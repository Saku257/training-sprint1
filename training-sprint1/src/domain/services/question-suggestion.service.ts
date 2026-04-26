import type { QuestionSuggestionItem } from '@/domain/models/chat';
import type { QuestionSuggestionRepository } from '@/domain/repositories/question-suggestion.repository';

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 5;

export class QuestionSuggestionService {
  constructor(private repository: QuestionSuggestionRepository) {}

  async getSuggestions(limit: number = DEFAULT_LIMIT): Promise<QuestionSuggestionItem[]> {
    const effectiveLimit = Math.min(limit, MAX_LIMIT);
    return this.repository.findAll(effectiveLimit);
  }
}
