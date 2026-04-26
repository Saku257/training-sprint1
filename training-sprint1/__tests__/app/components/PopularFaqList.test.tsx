import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FaqPopularItem } from '@/domain/models/faq';

// Next.js router のモック
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// コンポーネント import（まだ存在しないので RED）
import { PopularFaqList } from '@/app/components/PopularFaqList';

const sampleFaqs: FaqPopularItem[] = [
  { id: 'faq-1', title: 'エアコンの使い方', categoryName: '設備・機器' },
  {
    id: 'faq-2',
    title: 'Wi-Fiに繋がらない場合は？',
    categoryName: 'インターネット',
  },
  { id: 'faq-3', title: 'ゴミの出し方について', categoryName: 'ルール' },
  {
    id: 'faq-4',
    title: '駐車場の利用方法',
    categoryName: '共用施設',
  },
  { id: 'faq-5', title: '管理費の支払い方法', categoryName: '契約・手続き' },
];

const sixFaqs: FaqPopularItem[] = [
  ...sampleFaqs,
  { id: 'faq-6', title: '6件目のFAQ', categoryName: 'その他' },
];

describe('PopularFaqList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render all faq titles', () => {
      render(<PopularFaqList faqs={sampleFaqs} />);

      expect(screen.getByText('エアコンの使い方')).toBeInTheDocument();
      expect(screen.getByText('Wi-Fiに繋がらない場合は？')).toBeInTheDocument();
      expect(screen.getByText('ゴミの出し方について')).toBeInTheDocument();
      expect(screen.getByText('駐車場の利用方法')).toBeInTheDocument();
      expect(screen.getByText('管理費の支払い方法')).toBeInTheDocument();
    });

    it('should render no list items when faqs is empty array', () => {
      render(<PopularFaqList faqs={[]} />);

      expect(screen.queryByText('エアコンの使い方')).not.toBeInTheDocument();
    });

    it('should render at most 5 items even when 6 faqs are passed', () => {
      render(<PopularFaqList faqs={sixFaqs} />);

      // 5件目まで表示される
      expect(screen.getByText('エアコンの使い方')).toBeInTheDocument();
      expect(screen.getByText('管理費の支払い方法')).toBeInTheDocument();

      // 6件目は表示されない
      expect(screen.queryByText('6件目のFAQ')).not.toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to /faqs/<id> when a faq item is clicked', async () => {
      const user = userEvent.setup();
      render(<PopularFaqList faqs={sampleFaqs} />);

      await user.click(screen.getByText('エアコンの使い方'));

      expect(mockPush).toHaveBeenCalledWith('/faqs/faq-1');
    });

    it('should navigate to the correct faq id for each item clicked', async () => {
      const user = userEvent.setup();
      render(<PopularFaqList faqs={sampleFaqs} />);

      await user.click(screen.getByText('Wi-Fiに繋がらない場合は？'));

      expect(mockPush).toHaveBeenCalledWith('/faqs/faq-2');
    });
  });
});
