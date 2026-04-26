import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { FaqCategoryRepository } from '@/domain/repositories/faq-category.repository';
import { FaqCategoryService } from '@/domain/services/faq-category.service';
import { propertyIdParamSchema } from '@/schemas/faq-category.schema';

export async function GET(
  _request: NextRequest,
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

    const client = createServerClient();
    const repository = new FaqCategoryRepository(client);
    const service = new FaqCategoryService(repository);

    const categories = await service.getCategoriesByPropertyId(propertyId);

    if (categories.length === 0) {
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

    return NextResponse.json({ success: true, data: categories }, { status: 200 });
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
