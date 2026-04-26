import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FaqSearchResultItem } from '@/domain/models/faq';

// Next.js router のモック
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// コンポーネント import（まだ存在しないので RED）
import { SearchResultList } from '@/app/components/SearchResultList';

const mockItems: FaqSearchResultItem[] = [
  {
    id: 'faq-1',
    title: 'エアコンの使い方',
    bodyExcerpt: 'エアコンのリモコンは...',
    categoryName: '設備',
  },
  {
    id: 'faq-2',
    title: 'ゴミの出し方',
    bodyExcerpt: 'ゴミは毎週月曜日に...',
    categoryName: 'ゴミ出し',
  },
];

describe('SearchResultList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render each item title', () => {
      render(<SearchResultList items={mockItems} />);

      expect(screen.getByText('エアコンの使い方')).toBeInTheDocument();
      expect(screen.getByText('ゴミの出し方')).toBeInTheDocument();
    });

    it('should render each item category name', () => {
      render(<SearchResultList items={mockItems} />);

      expect(screen.getByText('設備')).toBeInTheDocument();
      expect(screen.getByText('ゴミ出し')).toBeInTheDocument();
    });

    it('should render each item bodyExcerpt', () => {
      render(<SearchResultList items={mockItems} />);

      expect(screen.getByText('エアコンのリモコンは...')).toBeInTheDocument();
      expect(screen.getByText('ゴミは毎週月曜日に...')).toBeInTheDocument();
    });

    it('should render nothing when items is an empty array', () => {
      render(<SearchResultList items={[]} />);

      expect(screen.queryByText('エアコンの使い方')).not.toBeInTheDocument();
      expect(screen.queryByText('ゴミの出し方')).not.toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to /faqs/<id> when an item is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchResultList items={mockItems} />);

      await user.click(screen.getByText('エアコンの使い方'));

      expect(mockPush).toHaveBeenCalledWith('/faqs/faq-1');
    });

    it('should navigate to the correct faq id for each item clicked', async () => {
      const user = userEvent.setup();
      render(<SearchResultList items={mockItems} />);

      await user.click(screen.getByText('ゴミの出し方'));

      expect(mockPush).toHaveBeenCalledWith('/faqs/faq-2');
    });
  });
});
