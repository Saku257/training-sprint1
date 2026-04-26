import { createServerClient } from '@/lib/supabase/server';
import { FaqCategoryRepository } from '@/domain/repositories/faq-category.repository';
import { FaqRepository } from '@/domain/repositories/faq.repository';
import { FaqCategoryService } from '@/domain/services/faq-category.service';
import { FaqService } from '@/domain/services/faq.service';
import { SearchBar } from '@/app/components/SearchBar';
import { FaqCategoryList } from '@/app/components/FaqCategoryList';
import { PopularFaqList } from '@/app/components/PopularFaqList';
import { AiChatButton } from '@/app/components/AiChatButton';

async function getDefaultPropertyId(): Promise<string | null> {
  const client = createServerClient();
  const { data } = await client.from('properties').select('id').limit(1).single();
  return data?.id ?? null;
}

export default async function Home() {
  const propertyId = await getDefaultPropertyId();

  if (!propertyId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">物件情報を取得できませんでした。</p>
      </div>
    );
  }

  const client = createServerClient();
  const [categories, popularFaqs] = await Promise.all([
    new FaqCategoryService(new FaqCategoryRepository(client)).getCategoriesByPropertyId(propertyId),
    new FaqService(new FaqRepository(client)).getPopularFaqs(propertyId, 5),
  ]);

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <section>
        <SearchBar />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">カテゴリから探す</h2>
        <FaqCategoryList categories={categories} />
      </section>

      <section>
        <AiChatButton />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">よく見られるFAQ</h2>
        <PopularFaqList faqs={popularFaqs} />
      </section>
    </div>
  );
}
