'use client';

import type { FeedbackValue } from '@/domain/models/feedback';

type Props = {
  onFeedback: (value: FeedbackValue) => void;
};

export function FeedbackButtons({ onFeedback }: Props) {
  return (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => onFeedback('solved')}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        解決できた
      </button>
      <button
        type="button"
        onClick={() => onFeedback('unsolved')}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
      >
        解決できなかった
      </button>
    </div>
  );
}
