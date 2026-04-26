'use client';

import { useRouter } from 'next/navigation';
import type { FaqRelatedItem } from '@/domain/models/faq';

type Props = {
  faqs: FaqRelatedItem[];
};

export function RelatedFaqList({ faqs }: Props) {
  const router = useRouter();

  if (faqs.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y">
      {faqs.map((faq) => (
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
