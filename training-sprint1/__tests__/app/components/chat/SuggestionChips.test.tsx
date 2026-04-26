import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// コンポーネント import（まだ存在しないので RED）
import { SuggestionChips } from '@/app/components/chat/SuggestionChips';

const mockSuggestions = [
  { id: 'q1', text: 'エアコンの使い方は？' },
  { id: 'q2', text: 'インターネットの接続方法は？' },
  { id: 'q3', text: '駐車場の利用ルールは？' },
];

describe('SuggestionChips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render each suggestion text as a button', () => {
      const onSelect = vi.fn();
      render(<SuggestionChips suggestions={mockSuggestions} onSelect={onSelect} />);

      expect(screen.getByRole('button', { name: 'エアコンの使い方は？' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'インターネットの接続方法は？' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '駐車場の利用ルールは？' })).toBeInTheDocument();
    });

    it('should render nothing when suggestions array is empty', () => {
      const onSelect = vi.fn();
      const { container } = render(<SuggestionChips suggestions={[]} onSelect={onSelect} />);

      expect(container.querySelector('button')).toBeNull();
    });
  });

  describe('interaction', () => {
    it('should call onSelect with the suggestion text when a chip is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<SuggestionChips suggestions={mockSuggestions} onSelect={onSelect} />);

      await user.click(screen.getByRole('button', { name: 'エアコンの使い方は？' }));

      expect(onSelect).toHaveBeenCalledWith('エアコンの使い方は？');
    });

    it('should not call onSelect when disabled=true and a chip is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<SuggestionChips suggestions={mockSuggestions} onSelect={onSelect} disabled={true} />);

      await user.click(screen.getByRole('button', { name: 'エアコンの使い方は？' }));

      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});
