import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FaqCategoryListItem } from '@/domain/models/faq-category';

// Next.js router のモック
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// コンポーネント import（まだ存在しないので RED）
import { FaqCategoryList } from '@/app/components/FaqCategoryList';

const sampleCategories: FaqCategoryListItem[] = [
  { id: 'cat-1', name: '設備・機器', icon: '🔧' },
  { id: 'cat-2', name: 'インターネット', icon: '🌐' },
  { id: 'cat-3', name: '契約・手続き', icon: null },
];

describe('FaqCategoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render all category names', () => {
      render(<FaqCategoryList categories={sampleCategories} />);

      expect(screen.getByText('設備・機器')).toBeInTheDocument();
      expect(screen.getByText('インターネット')).toBeInTheDocument();
      expect(screen.getByText('契約・手続き')).toBeInTheDocument();
    });

    it('should render no cards when categories is empty array', () => {
      render(<FaqCategoryList categories={[]} />);

      // カテゴリ名が表示されていないことを確認
      expect(screen.queryByText('設備・機器')).not.toBeInTheDocument();
    });

    it('should render without error when icon is null', () => {
      const categoriesWithNullIcon: FaqCategoryListItem[] = [
        { id: 'cat-null', name: 'アイコンなしカテゴリ', icon: null },
      ];

      // エラーなくレンダリングできること
      expect(() =>
        render(<FaqCategoryList categories={categoriesWithNullIcon} />),
      ).not.toThrow();

      expect(screen.getByText('アイコンなしカテゴリ')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to /search?categoryId=<id> when a category card is clicked', async () => {
      const user = userEvent.setup();
      render(<FaqCategoryList categories={sampleCategories} />);

      await user.click(screen.getByText('設備・機器'));

      expect(mockPush).toHaveBeenCalledWith('/search?categoryId=cat-1');
    });

    it('should navigate to the correct categoryId for each card clicked', async () => {
      const user = userEvent.setup();
      render(<FaqCategoryList categories={sampleCategories} />);

      await user.click(screen.getByText('インターネット'));

      expect(mockPush).toHaveBeenCalledWith('/search?categoryId=cat-2');
    });
  });
});
