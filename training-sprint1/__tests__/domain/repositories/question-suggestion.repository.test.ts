import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { QuestionSuggestionRepository } from '@/domain/repositories/question-suggestion.repository';
import type { QuestionSuggestionItem } from '@/domain/models/chat';

describe('QuestionSuggestionRepository', () => {
  let repository: QuestionSuggestionRepository;
  let client: SupabaseClient;

  beforeAll(async () => {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    repository = new QuestionSuggestionRepository(client);
  });

  describe('findAll', () => {
    it('should return at most limit items when limit=5', async () => {
      const limit = 5;

      const results = await repository.findAll(limit);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(limit);
    });

    it('should return items with id and text fields', async () => {
      const limit = 5;

      const results = await repository.findAll(limit);

      if (results.length === 0) return;

      const first = results[0] as QuestionSuggestionItem;
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('text');
      expect(typeof first.id).toBe('string');
      expect(typeof first.text).toBe('string');
      expect(first.id.length).toBeGreaterThan(0);
      expect(first.text.length).toBeGreaterThan(0);
    });

    it('should return items ordered by display_order ascending', async () => {
      const limit = 10;

      const results = await repository.findAll(limit);

      if (results.length < 2) return;

      // DB から display_order の生データを取得して順序を確認
      const ids = results.map((r) => r.id);
      const { data: rawData } = await client
        .from('question_suggestions')
        .select('id, display_order')
        .in('id', ids)
        .order('display_order', { ascending: true });

      if (!rawData || rawData.length < 2) return;

      // repository の返却順が display_order ASC 順と一致することを確認
      const expectedIds = rawData.map((r) => r.id);
      const actualIds = results.map((r) => r.id);
      expect(actualIds).toEqual(expectedIds);
    });

    it('should return at most limit items when limit=2', async () => {
      const limit = 2;

      const results = await repository.findAll(limit);

      expect(results.length).toBeLessThanOrEqual(limit);
    });
  });
});
