'use client';

import { useState } from 'react';

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatInput({ onSend, disabled = false, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-gray-50"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled}
        className="rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        送信
      </button>
    </div>
  );
}
