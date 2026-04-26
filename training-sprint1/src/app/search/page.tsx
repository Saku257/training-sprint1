import { createServerClient } from '@/lib/supabase/server';
import { FaqRepository } from '@/domain/repositories/faq.repository';
import { FaqService } from '@/domain/services/faq.service';
import { SearchBar } from '@/app/components/SearchBar';
import { SearchResultList } from '@/app/components/SearchResultList';
import { EmptySearchResult } from '@/app/components/EmptySearchResult';

async function getDefaultPropertyId(): Promise<string | null> {
  const client = createServerClient();
  const { data } = await client.from('properties').select('id').limit(1).single();
  return data?.id ?? null;
}

interface SearchPageProps {
  searchParams: { q?: string; categoryId?: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, categoryId } = searchParams;

  const propertyId = await getDefaultPropertyId();

  if (!propertyId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">物件情報を取得できませんでした。</p>
      </div>
    );
  }

  const client = createServerClient();
  const { total, items } = await new FaqService(new FaqRepository(client)).searchFaqs(propertyId, {
    q,
    categoryId,
  });

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <section>
        <SearchBar />
      </section>

      {total === 0 ? (
        <EmptySearchResult />
      ) : (
        <section>
          <p className="text-sm text-gray-500 mb-2">{total}件見つかりました</p>
          <SearchResultList items={items} />
        </section>
      )}
    </div>
  );
}
