import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { FeedbackRepository } from '@/domain/repositories/feedback.repository';
import { FeedbackService } from '@/domain/services/feedback.service';
import { feedbackParamSchema, feedbackBodySchema } from '@/schemas/feedback.schema';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ faqId: string }> }
): Promise<NextResponse> {
  try {
    const { faqId } = await context.params;

    const paramParsed = feedbackParamSchema.safeParse({ faqId });
    if (!paramParsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_FAQ_ID', message: '無効な faqId です' } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const bodyParsed = feedbackBodySchema.safeParse(body);
    if (!bodyParsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FEEDBACK_VALUE',
            message: 'value は "solved" または "unsolved" である必要があります',
          },
        },
        { status: 400 }
      );
    }

    const client = createServerClient();
    const service = new FeedbackService(new FeedbackRepository(client));
    const result = await service.submitFeedback(faqId, bodyParsed.data.value);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'サーバーエラーが発生しました' },
      },
      { status: 500 }
    );
  }
}
