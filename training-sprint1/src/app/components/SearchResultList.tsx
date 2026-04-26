'use client';

import { useRouter } from 'next/navigation';
import type { FaqSearchResultItem } from '@/domain/models/faq';

export function SearchResultList({ items }: { items: FaqSearchResultItem[] }) {
  const router = useRouter();

  return (
    <ul className="divide-y">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => router.push(`/faqs/${item.id}`)}
            className="w-full text-left py-3 hover:bg-gray-50"
          >
            <span className="block font-medium">{item.title}</span>
            <span className="block text-sm text-gray-500">{item.categoryName}</span>
            <span className="block text-sm text-gray-600 mt-1">{item.bodyExcerpt}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
