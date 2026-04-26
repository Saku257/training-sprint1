'use client';

import { useRouter } from 'next/navigation';
import type { FaqPopularItem } from '@/domain/models/faq';

export function PopularFaqList({ faqs }: { faqs: FaqPopularItem[] }) {
  const router = useRouter();
  const displayFaqs = faqs.slice(0, 5);

  return (
    <ul className="divide-y">
      {displayFaqs.map((faq) => (
        <li key={faq.id}>
          <button
            type="button"
            onClick={() => router.push(`/faqs/${faq.id}`)}
            className="w-full text-left py-3 hover:bg-gray-50"
          >
            {faq.title}
          </button>
        </li>
      ))}
    </ul>
  );
}
