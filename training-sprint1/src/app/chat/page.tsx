import { createServerClient } from '@/lib/supabase/server';
import { ChatClient } from './ChatClient';

async function getDefaultPropertyId(): Promise<string | null> {
  const client = createServerClient();
  const { data } = await client.from('properties').select('id').limit(1).single();
  return data?.id ?? null;
}

type ChatPageProps = {
  searchParams: Promise<{ faqId?: string }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const { faqId } = await searchParams;
  const propertyId = await getDefaultPropertyId();

  if (!propertyId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-600">物件情報を取得できませんでした。</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <header className="border-b px-4 py-3">
        <h1 className="text-lg font-semibold">AIアシスタント</h1>
        <p className="text-sm text-gray-500">FAQをもとにAIが回答します</p>
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatClient propertyId={propertyId} initialFaqId={faqId ?? null} />
      </div>
    </div>
  );
}
