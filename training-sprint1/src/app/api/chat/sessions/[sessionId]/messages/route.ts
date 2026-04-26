import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { ChatSessionRepository } from '@/domain/repositories/chat-session.repository';
import { ChatMessageRepository } from '@/domain/repositories/chat-message.repository';
import { FaqRepository } from '@/domain/repositories/faq.repository';
import { ChatService } from '@/domain/services/chat.service';
import { generateAiAnswer } from '@/app/lib/llm/chat';

const sessionIdSchema = z.string().uuid();
const bodySchema = z.object({
  message: z.string().trim().min(1).max(200),
  faqId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await ctx.params;

    if (!sessionIdSchema.safeParse(sessionId).success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_SESSION_ID', message: 'sessionId must be a valid UUID' },
        },
        { status: 400 }
      );
    }

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      const issues = parsed.error.issues;
      const faqIdError = issues.some((i) => i.path.includes('faqId'));
      if (faqIdError) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'INVALID_FAQ_ID', message: 'faqId must be a valid UUID' },
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_MESSAGE',
            message: 'message must not be empty and must be 200 characters or less',
          },
        },
        { status: 400 }
      );
    }

    const { message, faqId } = parsed.data;

    const client = createServerClient();
    const service = new ChatService(
      new ChatSessionRepository(client),
      new ChatMessageRepository(client),
      new FaqRepository(client),
      client,
      generateAiAnswer
    );

    const data = await service.sendMessage({ sessionId, message, faqId });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/chat/.../messages] Unhandled error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
