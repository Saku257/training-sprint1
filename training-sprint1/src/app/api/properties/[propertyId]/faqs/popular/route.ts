import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { FaqRepository } from '@/domain/repositories/faq.repository';
import { FaqService } from '@/domain/services/faq.service';
import { propertyIdParamSchema } from '@/schemas/faq-category.schema';
import { popularQuerySchema } from '@/schemas/faq.schema';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ propertyId: string }> }
): Promise<NextResponse> {
  try {
    const { propertyId } = await context.params;

    const parsed = propertyIdParamSchema.safeParse({ propertyId });
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PROPERTY_ID',
            message: '無効な propertyId です',
          },
        },
        { status: 400 }
      );
    }

    const limitParam = request.nextUrl.searchParams.get('limit') ?? undefined;
    const queryParsed = popularQuerySchema.safeParse({ limit: limitParam });
    const limit = queryParsed.success ? queryParsed.data.limit : 5;

    const client = createServerClient();
    const repository = new FaqRepository(client);
    const service = new FaqService(repository);

    const faqs = await service.getPopularFaqs(propertyId, limit);

    if (faqs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROPERTY_NOT_FOUND',
            message: '物件が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: faqs }, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'サーバーエラーが発生しました',
        },
      },
      { status: 500 }
    );
  }
}
