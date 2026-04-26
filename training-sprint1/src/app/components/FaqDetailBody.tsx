import type { FaqDetailItem } from '@/domain/models/faq';

export function FaqDetailBody({ faq }: { faq: FaqDetailItem }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{faq.categoryName}</p>
      <h1 className="text-xl font-bold mt-1">{faq.title}</h1>
      <div className="mt-4 whitespace-pre-wrap">{faq.body}</div>
    </div>
  );
}
