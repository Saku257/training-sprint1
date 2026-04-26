import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { ChatSessionRepository } from '@/domain/repositories/chat-session.repository';
import { ChatMessageRepository } from '@/domain/repositories/chat-message.repository';
import { FaqRepository } from '@/domain/repositories/faq.repository';
import { ChatService } from '@/domain/services/chat.service';
import { generateAiAnswer } from '@/app/lib/llm/chat';

const bodySchema = z.object({
  propertyId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_PROPERTY_ID', message: 'propertyId must be a valid UUID' },
        },
        { status: 400 }
      );
    }

    const { propertyId } = parsed.data;

    const client = createServerClient();
    const service = new ChatService(
      new ChatSessionRepository(client),
      new ChatMessageRepository(client),
      new FaqRepository(client),
      client,
      generateAiAnswer
    );

    const data = await service.createSession(propertyId);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
