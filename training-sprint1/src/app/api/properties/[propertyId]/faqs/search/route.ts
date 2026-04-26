import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { FaqRepository } from '@/domain/repositories/faq.repository';
import { FaqService } from '@/domain/services/faq.service';
import { searchParamSchema, searchQuerySchema } from '@/schemas/search.schema';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ propertyId: string }> }
): Promise<NextResponse> {
  try {
    const { propertyId } = await context.params;

    const paramParsed = searchParamSchema.safeParse({ propertyId });
    if (!paramParsed.success) {
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

    const q = request.nextUrl.searchParams.get('q') ?? undefined;
    const categoryId = request.nextUrl.searchParams.get('categoryId') ?? undefined;
    const queryParsed = searchQuerySchema.safeParse({ q, categoryId });
    if (!queryParsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SEARCH_QUERY',
            message: queryParsed.error.issues.map((e) => e.message).join(', '),
          },
        },
        { status: 400 }
      );
    }

    const client = createServerClient();
    const repository = new FaqRepository(client);
    const service = new FaqService(repository);

    // q が指定されている場合は q のみを渡す（q 優先）
    const serviceQuery = queryParsed.data.q
      ? { q: queryParsed.data.q }
      : { categoryId: queryParsed.data.categoryId };

    const result = await service.searchFaqs(paramParsed.data.propertyId, serviceQuery);

    return NextResponse.json(
      { success: true, data: { total: result.total, items: result.items } },
      { status: 200 }
    );
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
