'use client';

import { useRouter } from 'next/navigation';

type AiChatButtonProps = {
  faqId?: string;
  label?: string;
};

export function AiChatButton({ faqId, label }: AiChatButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    const url = faqId ? `/chat?faqId=${faqId}` : '/chat';
    router.push(url);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full bg-green-600 text-white py-3 px-6 rounded-lg text-lg font-semibold"
    >
      {label ?? 'AIに聞く'}
    </button>
  );
}
