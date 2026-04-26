import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChatSessionResult, SendMessageResult } from '@/domain/models/chat';
import type { ChatSessionRepository } from '@/domain/repositories/chat-session.repository';
import type { ChatMessageRepository } from '@/domain/repositories/chat-message.repository';
import type { FaqRepository } from '@/domain/repositories/faq.repository';
import type { generateAiAnswer } from '@/app/lib/llm/chat';
import type { FaqContext } from '@/app/lib/llm/chat';

export class ChatService {
  constructor(
    private sessionRepository: ChatSessionRepository,
    private messageRepository: ChatMessageRepository,
    private faqRepository: FaqRepository,
    private supabaseClient: SupabaseClient,
    private generateAi: typeof generateAiAnswer
  ) {}

  async createSession(propertyId: string): Promise<ChatSessionResult> {
    return this.sessionRepository.create(propertyId);
  }

  async sendMessage(params: {
    sessionId: string;
    message: string;
    faqId?: string;
    isFirstMessage?: boolean;
  }): Promise<SendMessageResult> {
    const { sessionId, message, faqId } = params;

    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    const propertyId = session.property_id;

    const faqList = await this.faqRepository.searchByPropertyId(propertyId, {
      q: message,
      limit: 3,
    });

    const faqContexts: FaqContext[] = faqList.map((faq) => ({
      id: faq.id,
      title: faq.title,
      body: faq.bodyExcerpt,
      categoryName: faq.categoryName,
    }));

    const isFirstMessage =
      params.isFirstMessage ?? (await this.messageRepository.countBySessionId(sessionId)) === 0;

    let initialFaqContext: FaqContext | null = null;
    if (isFirstMessage && faqId) {
      const faqDetail = await this.faqRepository.findDetailByPropertyAndId(propertyId, faqId);
      if (faqDetail) {
        initialFaqContext = {
          id: faqDetail.id,
          title: faqDetail.title,
          body: faqDetail.body,
          categoryName: faqDetail.categoryName,
        };
      }
    }

    const userMsgRecord = await this.messageRepository.create({
      sessionId,
      messageType: 'user',
      body: message,
    });

    const aiOutput = await this.generateAi({ message, faqContexts, initialFaqContext });

    const aiMsgRecord = await this.messageRepository.create({
      sessionId,
      messageType: 'ai',
      body: aiOutput.answer,
      isUnresolved: aiOutput.isUnresolved,
    });

    const relatedFaqs = aiOutput.relatedFaqIds
      .map((id) => faqList.find((f) => f.id === id))
      .filter((f): f is NonNullable<typeof f> => f !== undefined)
      .map((f) => ({ id: f.id, title: f.title }));

    let supportDesk: { phone: string; formUrl: string | null } | null = null;
    if (aiOutput.isUnresolved) {
      const { data } = await this.supabaseClient
        .from('properties')
        .select('support_phone, support_form_url')
        .eq('id', propertyId)
        .single();

      if (data) {
        supportDesk = {
          phone: (data as { support_phone: string; support_form_url: string | null }).support_phone,
          formUrl: (data as { support_phone: string; support_form_url: string | null })
            .support_form_url,
        };
      }
    }

    return {
      userMessage: {
        id: userMsgRecord.id,
        type: 'user',
        body: userMsgRecord.body,
        sentAt: userMsgRecord.sent_at,
      },
      aiMessage: {
        id: aiMsgRecord.id,
        type: 'ai',
        body: aiMsgRecord.body,
        isUnresolved: aiMsgRecord.is_unresolved ?? false,
        relatedFaqs,
        sentAt: aiMsgRecord.sent_at,
      },
      supportDesk,
    };
  }
}
