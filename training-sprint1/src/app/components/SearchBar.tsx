'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SearchBar() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');

  const handleSearch = () => {
    if (!keyword.trim()) return;
    router.push(`/search?q=${keyword}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="例：エアコンの使い方"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 border rounded px-3 py-2"
      />
      <button
        type="button"
        role="button"
        onClick={handleSearch}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        検索
      </button>
    </div>
  );
}
