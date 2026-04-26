import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// コンポーネント import（まだ存在しないので RED）
import { ChatInput } from '@/app/components/chat/ChatInput';

describe('ChatInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render a text input and a send button', () => {
      const onSend = vi.fn();
      render(<ChatInput onSend={onSend} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /送信/i })).toBeInTheDocument();
    });

    it('should render text input with custom placeholder when provided', () => {
      const onSend = vi.fn();
      render(<ChatInput onSend={onSend} placeholder="質問を入力してください" />);

      expect(screen.getByPlaceholderText('質問を入力してください')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('should call onSend with the input value when send button is clicked', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();
      render(<ChatInput onSend={onSend} />);

      await user.type(screen.getByRole('textbox'), 'エアコンの使い方は？');
      await user.click(screen.getByRole('button', { name: /送信/i }));

      expect(onSend).toHaveBeenCalledWith('エアコンの使い方は？');
    });

    it('should clear the input after sending', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();
      render(<ChatInput onSend={onSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'エアコンの使い方は？');
      await user.click(screen.getByRole('button', { name: /送信/i }));

      expect(input).toHaveValue('');
    });

    it('should NOT call onSend when input is empty', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();
      render(<ChatInput onSend={onSend} />);

      await user.click(screen.getByRole('button', { name: /送信/i }));

      expect(onSend).not.toHaveBeenCalled();
    });

    it('should NOT call onSend when input is whitespace only', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();
      render(<ChatInput onSend={onSend} />);

      await user.type(screen.getByRole('textbox'), '   ');
      await user.click(screen.getByRole('button', { name: /送信/i }));

      expect(onSend).not.toHaveBeenCalled();
    });

    it('should NOT call onSend when disabled=true', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();
      render(<ChatInput onSend={onSend} disabled={true} />);

      await user.type(screen.getByRole('textbox'), 'エアコンの使い方は？');
      await user.click(screen.getByRole('button', { name: /送信/i }));

      expect(onSend).not.toHaveBeenCalled();
    });

    it('should disable the send button when disabled=true', () => {
      const onSend = vi.fn();
      render(<ChatInput onSend={onSend} disabled={true} />);

      expect(screen.getByRole('button', { name: /送信/i })).toBeDisabled();
    });
  });
});
