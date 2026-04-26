import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FeedbackValue } from '@/domain/models/feedback';

// コンポーネント import（まだ存在しないので RED）
import { FeedbackButtons } from '@/app/components/FeedbackButtons';

describe('FeedbackButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the "解決できた" button', () => {
      const onFeedback = vi.fn<(value: FeedbackValue) => void>();
      render(<FeedbackButtons onFeedback={onFeedback} />);

      expect(
        screen.getByRole('button', { name: /解決できた/i }),
      ).toBeInTheDocument();
    });

    it('should render the "解決できなかった" button', () => {
      const onFeedback = vi.fn<(value: FeedbackValue) => void>();
      render(<FeedbackButtons onFeedback={onFeedback} />);

      expect(
        screen.getByRole('button', { name: /解決できなかった/i }),
      ).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('should call onFeedback("solved") when "解決できた" is clicked', async () => {
      const user = userEvent.setup();
      const onFeedback = vi.fn<(value: FeedbackValue) => void>();
      render(<FeedbackButtons onFeedback={onFeedback} />);

      await user.click(screen.getByRole('button', { name: /解決できた/i }));

      expect(onFeedback).toHaveBeenCalledWith('solved');
    });

    it('should call onFeedback("unsolved") when "解決できなかった" is clicked', async () => {
      const user = userEvent.setup();
      const onFeedback = vi.fn<(value: FeedbackValue) => void>();
      render(<FeedbackButtons onFeedback={onFeedback} />);

      await user.click(
        screen.getByRole('button', { name: /解決できなかった/i }),
      );

      expect(onFeedback).toHaveBeenCalledWith('unsolved');
    });
  });
});
