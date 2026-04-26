'use client';

import { useEffect, useRef, useState } from 'react';
import type { QuestionSuggestionItem, SendMessageResult } from '@/domain/models/chat';
import { SuggestionChips } from '@/app/components/chat/SuggestionChips';
import { ChatBubble } from '@/app/components/chat/ChatBubble';
import { ChatInput } from '@/app/components/chat/ChatInput';

type Message = {
  id: string;
  type: 'user' | 'ai';
  body: string;
  isUnresolved?: boolean;
  relatedFaqs?: { id: string; title: string }[];
  supportDesk?: { phone: string; formUrl: string | null } | null;
};

type ChatClientProps = {
  propertyId: string;
  initialFaqId?: string | null;
};

export function ChatClient({ propertyId, initialFaqId }: ChatClientProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<QuestionSuggestionItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const [sessionRes, suggestionsRes] = await Promise.all([
          fetch('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ propertyId }),
          }),
          fetch('/api/question-suggestions'),
        ]);

        if (sessionRes.ok) {
          const { data } = (await sessionRes.json()) as {
            data: { sessionId: string; startedAt: string };
          };
          setSessionId(data.sessionId);
        }

        if (suggestionsRes.ok) {
          const { data } = (await suggestionsRes.json()) as { data: QuestionSuggestionItem[] };
          setSuggestions(data);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [propertyId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (message: string) => {
    if (!sessionId || isLoading) return;

    const isFirstMessage = messages.length === 0;

    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, type: 'user', body: message }]);
    setSuggestions([]);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          faqId: isFirstMessage && initialFaqId ? initialFaqId : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const { data } = (await res.json()) as { data: SendMessageResult };

      setMessages((prev) => {
        const updated = prev.filter((m) => !m.id.startsWith('user-'));
        return [
          ...updated,
          {
            id: data.userMessage.id,
            type: 'user',
            body: data.userMessage.body,
          },
          {
            id: data.aiMessage.id,
            type: 'ai',
            body: data.aiMessage.body,
            isUnresolved: data.aiMessage.isUnresolved,
            relatedFaqs: data.aiMessage.relatedFaqs,
            supportDesk: data.supportDesk,
          },
        ];
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          type: 'ai',
          body: '申し訳ありません。エラーが発生しました。しばらく経ってからもう一度お試しください。',
          isUnresolved: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-center">
            <p className="text-sm text-gray-500">ご質問をどうぞ</p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            type={msg.type}
            body={msg.body}
            isUnresolved={msg.isUnresolved}
            relatedFaqs={msg.relatedFaqs}
            supportDesk={msg.supportDesk}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
              回答を生成中...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {suggestions.length > 0 && (
        <div className="border-t p-3">
          <SuggestionChips
            suggestions={suggestions}
            onSelect={sendMessage}
            disabled={isLoading || !sessionId}
          />
        </div>
      )}

      <div className="border-t p-3">
        <ChatInput
          onSend={sendMessage}
          disabled={isLoading || !sessionId}
          placeholder="質問を入力してください（200文字以内）"
        />
      </div>
    </div>
  );
}
