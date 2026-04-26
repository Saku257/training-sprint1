import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FeedbackResult } from '@/domain/models/feedback';

import { FeedbackService } from '@/domain/services/feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let mockFeedbackRepository: { create: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFeedbackRepository = {
      create: vi.fn(),
    };

    service = new FeedbackService(
      mockFeedbackRepository as unknown as import('@/domain/repositories/feedback.repository').FeedbackRepository
    );
  });

  describe('submitFeedback', () => {
    it('should call repository.create with faqId and "solved" when value is "solved"', async () => {
      // Arrange
      const faqId = 'faq-uuid-001';
      const expectedResult: FeedbackResult = {
        id: 'feedback-uuid-001',
        faqId,
        value: 'solved',
        submittedAt: '2024-01-01T00:00:00Z',
      };
      mockFeedbackRepository.create.mockResolvedValue(expectedResult);

      // Act
      await service.submitFeedback(faqId, 'solved');

      // Assert: 正しい引数で repository が呼ばれる
      expect(mockFeedbackRepository.create).toHaveBeenCalledWith(faqId, 'solved');
    });

    it('should call repository.create with faqId and "unsolved" when value is "unsolved"', async () => {
      // Arrange
      const faqId = 'faq-uuid-002';
      const expectedResult: FeedbackResult = {
        id: 'feedback-uuid-002',
        faqId,
        value: 'unsolved',
        submittedAt: '2024-01-01T00:00:00Z',
      };
      mockFeedbackRepository.create.mockResolvedValue(expectedResult);

      // Act
      await service.submitFeedback(faqId, 'unsolved');

      // Assert: 正しい引数で repository が呼ばれる
      expect(mockFeedbackRepository.create).toHaveBeenCalledWith(faqId, 'unsolved');
    });

    it('should return the result from repository as-is', async () => {
      // Arrange
      const faqId = 'faq-uuid-003';
      const expectedResult: FeedbackResult = {
        id: 'feedback-uuid-003',
        faqId,
        value: 'solved',
        submittedAt: '2024-06-15T10:30:00Z',
      };
      mockFeedbackRepository.create.mockResolvedValue(expectedResult);

      // Act
      const result = await service.submitFeedback(faqId, 'solved');

      // Assert: repository の返り値をそのまま返す
      expect(result).toEqual(expectedResult);
    });

    it('should throw Error("INVALID_FEEDBACK_VALUE") when value is "invalid" and not call repository', async () => {
      // Arrange
      const faqId = 'faq-uuid-004';

      // Act & Assert: 無効な値で Error をスロー
      await expect(
        service.submitFeedback(faqId, 'invalid' as never)
      ).rejects.toThrow('INVALID_FEEDBACK_VALUE');

      // repository.create は呼ばれない
      expect(mockFeedbackRepository.create).not.toHaveBeenCalled();
    });
  });
});
