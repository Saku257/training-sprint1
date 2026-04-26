import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Next.js router のモック
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// コンポーネント import（まだ存在しないので RED）
import { SearchBar } from '@/app/components/SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render search input with placeholder', () => {
      render(<SearchBar />);

      expect(
        screen.getByPlaceholderText('例：エアコンの使い方'),
      ).toBeInTheDocument();
    });

    it('should render search button', () => {
      render(<SearchBar />);

      expect(
        screen.getByRole('button', { name: /検索/i }),
      ).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to /search?q=<keyword> when search button is clicked with keyword', async () => {
      const user = userEvent.setup();
      render(<SearchBar />);

      const input = screen.getByPlaceholderText('例：エアコンの使い方');
      await user.type(input, 'エアコン');

      const button = screen.getByRole('button', { name: /検索/i });
      await user.click(button);

      expect(mockPush).toHaveBeenCalledWith('/search?q=エアコン');
    });

    it('should navigate to /search?q=<keyword> when Enter key is pressed with keyword', async () => {
      const user = userEvent.setup();
      render(<SearchBar />);

      const input = screen.getByPlaceholderText('例：エアコンの使い方');
      await user.type(input, 'インターネット');
      await user.keyboard('{Enter}');

      expect(mockPush).toHaveBeenCalledWith('/search?q=インターネット');
    });
  });

  describe('validation', () => {
    it('should not navigate when search button is clicked with empty input', async () => {
      const user = userEvent.setup();
      render(<SearchBar />);

      const button = screen.getByRole('button', { name: /検索/i });
      await user.click(button);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should not navigate when search button is clicked with whitespace-only input', async () => {
      const user = userEvent.setup();
      render(<SearchBar />);

      const input = screen.getByPlaceholderText('例：エアコンの使い方');
      await user.type(input, '   ');

      const button = screen.getByRole('button', { name: /検索/i });
      await user.click(button);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
