import { SupabaseClient } from '@supabase/supabase-js';
import type { ChatMessage, MessageType } from '@/domain/models/chat';

export class ChatMessageRepository {
  constructor(private client: SupabaseClient) {}

  async create(data: {
    sessionId: string;
    messageType: MessageType;
    body: string;
    isUnresolved?: boolean | null;
  }): Promise<ChatMessage> {
    const { data: row, error } = await this.client
      .from('chat_messages')
      .insert({
        session_id: data.sessionId,
        message_type: data.messageType,
        body: data.body,
        is_unresolved: data.isUnresolved ?? null,
      })
      .select('id, session_id, message_type, body, is_unresolved, sent_at')
      .single();

    if (error || !row) {
      throw new Error(error?.message ?? 'Failed to create chat message');
    }

    return {
      id: row.id as string,
      session_id: row.session_id as string,
      message_type: row.message_type as MessageType,
      body: row.body as string,
      is_unresolved: row.is_unresolved as boolean | null,
      sent_at: row.sent_at as string,
    };
  }

  async findBySessionId(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await this.client
      .from('chat_messages')
      .select('id, session_id, message_type, body, is_unresolved, sent_at')
      .eq('session_id', sessionId)
      .order('sent_at', { ascending: true });

    if (error) {
      throw new Error(error.message ?? 'Failed to fetch chat messages');
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      session_id: row.session_id as string,
      message_type: row.message_type as MessageType,
      body: row.body as string,
      is_unresolved: row.is_unresolved as boolean | null,
      sent_at: row.sent_at as string,
    }));
  }

  async countBySessionId(sessionId: string): Promise<number> {
    const { count, error } = await this.client
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (error) {
      throw new Error(error.message ?? 'Failed to count chat messages');
    }

    return count ?? 0;
  }
}
