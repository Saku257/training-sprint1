import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { FaqRepository } from '@/domain/repositories/faq.repository';
import { FaqService } from '@/domain/services/faq.service';

const uuidSchema = z.string().uuid();

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ propertyId: string; faqId: string }> }
): Promise<NextResponse> {
  try {
    const { propertyId, faqId } = await context.params;

    if (!uuidSchema.safeParse(propertyId).success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_PROPERTY_ID', message: '無効な propertyId です' },
        },
        { status: 400 }
      );
    }

    if (!uuidSchema.safeParse(faqId).success) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_FAQ_ID', message: '無効な faqId です' } },
        { status: 400 }
      );
    }

    const client = createServerClient();
    const service = new FaqService(new FaqRepository(client));
    const related = await service.getRelatedFaqs(faqId);

    return NextResponse.json({ success: true, data: related }, { status: 200 });
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
