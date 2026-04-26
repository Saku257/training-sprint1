import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { FaqDetailItem } from '@/domain/models/faq';

// コンポーネント import（まだ存在しないので RED）
import { FaqDetailBody } from '@/app/components/FaqDetailBody';

const mockFaq: FaqDetailItem = {
  id: 'faq-1',
  title: 'エアコンの使い方',
  body: 'エアコンのリモコンは棚の上にあります。',
  categoryName: '設備',
  updatedAt: '2024-01-15T10:00:00.000Z',
  supportDesk: { phone: '03-1234-5678', formUrl: null },
};

describe('FaqDetailBody', () => {
  describe('rendering', () => {
    it('should render the faq title', () => {
      render(<FaqDetailBody faq={mockFaq} />);

      expect(screen.getByText('エアコンの使い方')).toBeInTheDocument();
    });

    it('should render the category name', () => {
      render(<FaqDetailBody faq={mockFaq} />);

      expect(screen.getByText('設備')).toBeInTheDocument();
    });

    it('should render the body text', () => {
      render(<FaqDetailBody faq={mockFaq} />);

      expect(
        screen.getByText('エアコンのリモコンは棚の上にあります。'),
      ).toBeInTheDocument();
    });
  });
});
