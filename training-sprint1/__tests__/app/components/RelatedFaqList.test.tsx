import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FaqRelatedItem } from '@/domain/models/faq';

// Next.js router のモック
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// コンポーネント import（まだ存在しないので RED）
import { RelatedFaqList } from '@/app/components/RelatedFaqList';

const mockRelated: FaqRelatedItem[] = [
  { id: 'faq-2', title: '暖房の使い方' },
  { id: 'faq-3', title: '除湿機の使い方' },
];

describe('RelatedFaqList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render each related faq title', () => {
      render(<RelatedFaqList faqs={mockRelated} />);

      expect(screen.getByText('暖房の使い方')).toBeInTheDocument();
      expect(screen.getByText('除湿機の使い方')).toBeInTheDocument();
    });

    it('should render nothing when faqs is empty array', () => {
      render(<RelatedFaqList faqs={[]} />);

      expect(screen.queryByText('暖房の使い方')).not.toBeInTheDocument();
      expect(screen.queryByText('除湿機の使い方')).not.toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to /faqs/<id> when a related faq title is clicked', async () => {
      const user = userEvent.setup();
      render(<RelatedFaqList faqs={mockRelated} />);

      await user.click(screen.getByText('暖房の使い方'));

      expect(mockPush).toHaveBeenCalledWith('/faqs/faq-2');
    });

    it('should navigate to the correct id for a different item clicked', async () => {
      const user = userEvent.setup();
      render(<RelatedFaqList faqs={mockRelated} />);

      await user.click(screen.getByText('除湿機の使い方'));

      expect(mockPush).toHaveBeenCalledWith('/faqs/faq-3');
    });
  });
});
