import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { QuestionSuggestionItem } from '@/domain/models/chat';

import { QuestionSuggestionService } from '@/domain/services/question-suggestion.service';

type QuestionSuggestionRepositoryMock = {
  findAll: ReturnType<typeof vi.fn>;
};

describe('QuestionSuggestionService', () => {
  let mockRepository: QuestionSuggestionRepositoryMock;
  let service: QuestionSuggestionService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = {
      findAll: vi.fn(),
    };

    service = new QuestionSuggestionService(
      mockRepository as unknown as import('@/domain/repositories/question-suggestion.repository').QuestionSuggestionRepository
    );
  });

  describe('getSuggestions', () => {
    it('should call repository.findAll with default limit=5 when limit is not specified', async () => {
      // Arrange
      mockRepository.findAll.mockResolvedValue([]);

      // Act
      await service.getSuggestions();

      // Assert: デフォルト limit=5 で repository が呼ばれる
      expect(mockRepository.findAll).toHaveBeenCalledWith(5);
    });

    it('should call repository.findAll with specified limit when limit is within MAX_LIMIT', async () => {
      // Arrange
      mockRepository.findAll.mockResolvedValue([]);

      // Act: limit=3 を渡す（MAX_LIMIT=5 以内）
      await service.getSuggestions(3);

      // Assert: 指定した limit=3 で repository が呼ばれる
      expect(mockRepository.findAll).toHaveBeenCalledWith(3);
    });

    it('should return the result from repository as-is', async () => {
      // Arrange
      const suggestions: QuestionSuggestionItem[] = [
        { id: 'qs-1', text: 'チェックインの方法を教えてください' },
        { id: 'qs-2', text: 'Wi-Fiのパスワードは何ですか？' },
        { id: 'qs-3', text: 'ゴミ出しのルールを教えてください' },
      ];
      mockRepository.findAll.mockResolvedValue(suggestions);

      // Act
      const result = await service.getSuggestions();

      // Assert: repository の返り値をそのまま返す
      expect(result).toEqual(suggestions);
    });
  });
});
