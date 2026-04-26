import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// コンポーネント import（まだ存在しないので RED）
import { ChatBubble } from '@/app/components/chat/ChatBubble';

describe('ChatBubble', () => {
  describe('rendering', () => {
    it('should render the body text', () => {
      render(<ChatBubble type="ai" body="エアコンのフィルターは月1回清掃してください。" />);

      expect(screen.getByText('エアコンのフィルターは月1回清掃してください。')).toBeInTheDocument();
    });

    it('should indicate user type via data attribute', () => {
      const { container } = render(<ChatBubble type="user" body="エアコンの使い方は？" />);

      expect(container.querySelector('[data-type="user"]')).not.toBeNull();
    });

    it('should indicate ai type via data attribute', () => {
      const { container } = render(<ChatBubble type="ai" body="AIの回答です。" />);

      expect(container.querySelector('[data-type="ai"]')).not.toBeNull();
    });
  });

  describe('related faqs', () => {
    it('should render related FAQ links when relatedFaqs is provided and non-empty', () => {
      const relatedFaqs = [
        { id: 'faq-1', title: 'エアコンのフィルター清掃方法' },
        { id: 'faq-2', title: 'エアコンの電源が入らない場合' },
      ];
      render(<ChatBubble type="ai" body="AIの回答です。" relatedFaqs={relatedFaqs} />);

      expect(screen.getByText('エアコンのフィルター清掃方法')).toBeInTheDocument();
      expect(screen.getByText('エアコンの電源が入らない場合')).toBeInTheDocument();
    });

    it('should NOT render related FAQs section when relatedFaqs is empty', () => {
      render(<ChatBubble type="ai" body="AIの回答です。" relatedFaqs={[]} />);

      expect(screen.queryByText('エアコンのフィルター清掃方法')).not.toBeInTheDocument();
    });

    it('should NOT render related FAQs section when relatedFaqs is undefined', () => {
      const { container } = render(<ChatBubble type="ai" body="AIの回答です。" />);

      // 関連FAQ セクションが存在しないこと
      expect(container.querySelector('[data-section="related-faqs"]')).toBeNull();
    });
  });

  describe('support desk', () => {
    it('should render supportDesk phone when isUnresolved=true and supportDesk is provided', () => {
      render(
        <ChatBubble
          type="ai"
          body="回答できませんでした。"
          isUnresolved={true}
          supportDesk={{ phone: '03-1234-5678', formUrl: null }}
        />,
      );

      expect(screen.getByText('03-1234-5678')).toBeInTheDocument();
    });

    it('should NOT render supportDesk section when isUnresolved=false', () => {
      render(
        <ChatBubble
          type="ai"
          body="AIの回答です。"
          isUnresolved={false}
          supportDesk={{ phone: '03-1234-5678', formUrl: null }}
        />,
      );

      expect(screen.queryByText('03-1234-5678')).not.toBeInTheDocument();
    });
  });
});
