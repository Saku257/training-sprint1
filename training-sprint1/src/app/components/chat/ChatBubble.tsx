type RelatedFaq = {
  id: string;
  title: string;
};

type SupportDesk = {
  phone: string;
  formUrl: string | null;
};

type ChatBubbleProps = {
  type: 'user' | 'ai';
  body: string;
  isUnresolved?: boolean;
  relatedFaqs?: RelatedFaq[];
  supportDesk?: SupportDesk | null;
};

export function ChatBubble({
  type,
  body,
  isUnresolved,
  relatedFaqs,
  supportDesk,
}: ChatBubbleProps) {
  const isUser = type === 'user';

  return (
    <div data-type={type} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          isUser ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 shadow-sm'
        }`}
      >
        <p className="whitespace-pre-wrap">{body}</p>

        {relatedFaqs && relatedFaqs.length > 0 && (
          <div data-section="related-faqs" className="mt-3 border-t border-gray-100 pt-3">
            <p className="mb-1 text-xs font-medium text-gray-500">関連するFAQ</p>
            <ul className="space-y-1">
              {relatedFaqs.map((faq) => (
                <li key={faq.id}>
                  <a href={`/faqs/${faq.id}`} className="text-xs text-blue-600 hover:underline">
                    {faq.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isUnresolved && supportDesk && (
          <div className="mt-3 rounded-lg bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-800">サポートデスクへのお問い合わせ</p>
            <p className="mt-1 text-sm text-amber-900">{supportDesk.phone}</p>
            {supportDesk.formUrl && (
              <a href={supportDesk.formUrl} className="mt-1 text-xs text-blue-600 hover:underline">
                お問い合わせフォーム
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
