import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { FeedbackRepository } from '@/domain/repositories/feedback.repository';
import type { FeedbackResult } from '@/domain/models/feedback';

describe('FeedbackRepository', () => {
  let repository: FeedbackRepository;
  let client: SupabaseClient;
  let testFaqId: string;
  // テスト中に作成したフィードバックの id を追跡してクリーンアップに使う
  const createdFeedbackIds: string[] = [];

  beforeAll(async () => {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // テスト用に is_published=true の FAQ を 1 件取得
    const { data, error } = await client
      .from('faqs')
      .select('id')
      .eq('is_published', true)
      .limit(1)
      .single();

    if (error || !data) {
      throw new Error(`Failed to fetch test faqId: ${error?.message}`);
    }

    testFaqId = data.id;

    // Repository のインスタンス化（実装前なので例外が発生する）
    repository = new FeedbackRepository(client);
  });

  afterAll(async () => {
    // テストで作成したフィードバックを全て削除
    if (createdFeedbackIds.length > 0) {
      await client.from('feedback').delete().in('id', createdFeedbackIds);
    }
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('should create feedback with value=solved and return id, faqId, value, submittedAt', async () => {
      // Act
      const result = await repository.create(testFaqId, 'solved');

      // クリーンアップ用に id を記録
      createdFeedbackIds.push(result.id);

      // Assert: FeedbackResult の形状確認
      expect(result).toBeDefined();
      const feedback = result as FeedbackResult;

      expect(feedback).toHaveProperty('id');
      expect(feedback).toHaveProperty('faqId');
      expect(feedback).toHaveProperty('value');
      expect(feedback).toHaveProperty('submittedAt');

      expect(typeof feedback.id).toBe('string');
      expect(feedback.id.length).toBeGreaterThan(0);

      expect(feedback.faqId).toBe(testFaqId);
      expect(feedback.value).toBe('solved');

      expect(typeof feedback.submittedAt).toBe('string');
      expect(feedback.submittedAt.length).toBeGreaterThan(0);
    });

    it('should create feedback with value=unsolved', async () => {
      // Act
      const result = await repository.create(testFaqId, 'unsolved');

      // クリーンアップ用に id を記録
      createdFeedbackIds.push(result.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.value).toBe('unsolved');
      expect(result.faqId).toBe(testFaqId);
      expect(result.id).toBeDefined();
      expect(result.submittedAt).toBeDefined();
    });

    it('should throw an error when faqId does not exist (foreign key constraint violation)', async () => {
      // Arrange: 存在しない faqId（外部キー制約違反を引き起こす）
      const nonExistentFaqId = '00000000-0000-0000-0000-000000000000';

      // Act & Assert: 外部キー制約違反で例外がスローされること
      await expect(
        repository.create(nonExistentFaqId, 'solved')
      ).rejects.toThrow();
    });
  });
});
