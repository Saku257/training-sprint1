'use client';

import { useRouter } from 'next/navigation';

export function EmptySearchResult() {
  const router = useRouter();

  return (
    <div className="text-center py-12 space-y-4">
      <p className="text-gray-600">見つかりませんでした</p>
      <button
        type="button"
        onClick={() => router.push('/chat')}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        AIに聞く
      </button>
    </div>
  );
}
