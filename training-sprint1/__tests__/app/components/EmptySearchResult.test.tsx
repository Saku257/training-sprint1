import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Next.js router のモック
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// コンポーネント import（まだ存在しないので RED）
import { EmptySearchResult } from '@/app/components/EmptySearchResult';

describe('EmptySearchResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render a zero-result message', () => {
      render(<EmptySearchResult />);

      expect(screen.getByText(/見つかりませんでした/i)).toBeInTheDocument();
    });

    it('should render an "AIに聞く" button', () => {
      render(<EmptySearchResult />);

      expect(
        screen.getByRole('button', { name: /AIに聞く/i })
      ).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to /chat when the "AIに聞く" button is clicked', async () => {
      const user = userEvent.setup();
      render(<EmptySearchResult />);

      await user.click(screen.getByRole('button', { name: /AIに聞く/i }));

      expect(mockPush).toHaveBeenCalledWith('/chat');
    });
  });
});
