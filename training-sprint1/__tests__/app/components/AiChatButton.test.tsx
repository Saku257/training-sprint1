import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Next.js router のモック
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// コンポーネント import（まだ存在しないので RED）
import { AiChatButton } from '@/app/components/AiChatButton';

describe('AiChatButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render button with "AIに聞く" text', () => {
      render(<AiChatButton />);

      expect(screen.getByText('AIに聞く')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to /chat when button is clicked', async () => {
      const user = userEvent.setup();
      render(<AiChatButton />);

      await user.click(screen.getByText('AIに聞く'));

      expect(mockPush).toHaveBeenCalledWith('/chat');
    });
  });
});
