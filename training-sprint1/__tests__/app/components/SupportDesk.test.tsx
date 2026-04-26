import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// コンポーネント import（まだ存在しないので RED）
import { SupportDesk } from '@/app/components/SupportDesk';

describe('SupportDesk', () => {
  describe('rendering', () => {
    it('should render the phone number', () => {
      render(
        <SupportDesk phone="03-1234-5678" formUrl={null} />,
      );

      expect(screen.getByText('03-1234-5678')).toBeInTheDocument();
    });

    it('should render the form link when formUrl is not null', () => {
      render(
        <SupportDesk phone="03-1234-5678" formUrl="https://example.com/form" />,
      );

      expect(
        screen.getByRole('link', { name: /フォーム/i }),
      ).toBeInTheDocument();
    });

    it('should not render the form link when formUrl is null', () => {
      render(
        <SupportDesk phone="03-1234-5678" formUrl={null} />,
      );

      expect(
        screen.queryByRole('link', { name: /フォーム/i }),
      ).not.toBeInTheDocument();
    });

    it('should apply a highlight class when isHighlighted is true', () => {
      const { container } = render(
        <SupportDesk
          phone="03-1234-5678"
          formUrl={null}
          isHighlighted={true}
        />,
      );

      // 強調表示クラス（highlight または bg- 系）が付与されていること
      const highlightedEl = container.querySelector(
        '[class*="highlight"], [class*="bg-red"], [class*="bg-yellow"], [class*="bg-orange"]',
      );
      expect(highlightedEl).not.toBeNull();
    });
  });
});
