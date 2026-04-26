import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { FaqRepository } from '@/domain/repositories/faq.repository';
import { FaqService } from '@/domain/services/faq.service';
import { FaqDetailBody } from '@/app/components/FaqDetailBody';
import { FeedbackWrapper } from '@/app/components/FeedbackWrapper';
import { RelatedFaqList } from '@/app/components/RelatedFaqList';
import { SupportDesk } from '@/app/components/SupportDesk';
import { AiChatButton } from '@/app/components/AiChatButton';

async function getDefaultPropertyId(): Promise<string | null> {
  const client = createServerClient();
  const { data } = await client.from('properties').select('id').limit(1).single();
  return data?.id ?? null;
}

type Props = {
  params: Promise<{ faqId: string }>;
};

export default async function FaqDetailPage({ params }: Props) {
  const { faqId } = await params;

  const propertyId = await getDefaultPropertyId();
  if (!propertyId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">物件情報を取得できませんでした。</p>
      </div>
    );
  }

  const client = createServerClient();
  const faqService = new FaqService(new FaqRepository(client));

  const [detail, related] = await Promise.all([
    faqService.getFaqDetail(propertyId, faqId),
    faqService.getRelatedFaqs(faqId),
  ]);

  if (!detail) {
    notFound();
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <section>
        <FaqDetailBody faq={detail} />
      </section>

      <section>
        <FeedbackWrapper faqId={faqId} />
      </section>

      <section>
        <AiChatButton faqId={faqId} label="AIに詳しく聞く" />
      </section>

      {related.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">関連するFAQ</h2>
          <RelatedFaqList faqs={related} />
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">サポートデスク</h2>
        <SupportDesk phone={detail.supportDesk.phone} formUrl={detail.supportDesk.formUrl} />
      </section>
    </div>
  );
}
