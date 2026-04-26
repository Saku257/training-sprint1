'use client';

import { useRouter } from 'next/navigation';
import type { FaqCategoryListItem } from '@/domain/models/faq-category';

export function FaqCategoryList({ categories }: { categories: FaqCategoryListItem[] }) {
  const router = useRouter();

  if (categories.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-3">
      {categories.map((category) => (
        <li key={category.id}>
          <button
            type="button"
            onClick={() => router.push(`/search?categoryId=${category.id}`)}
            className="w-full flex items-center gap-2 border rounded p-3 hover:bg-gray-50"
          >
            {category.icon && <span>{category.icon}</span>}
            <span>{category.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
