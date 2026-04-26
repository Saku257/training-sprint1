import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { FaqCategoryRepository } from '@/domain/repositories/faq-category.repository';
import type { FaqCategory } from '@/domain/models/faq-category';

describe('FaqCategoryRepository', () => {
  let repository: FaqCategoryRepository;
  let testPropertyId: string;
  let client: SupabaseClient;

  beforeAll(async () => {
    // Supabase クライアントを作成してテスト用 propertyId を取得
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await client
      .from('properties')
      .select('id')
      .limit(1)
      .single();

    if (error || !data) {
      throw new Error(`Failed to fetch test propertyId: ${error?.message}`);
    }

    testPropertyId = data.id;

    // Repository のインスタンス化（実装前なので例外が発生する）
    repository = new FaqCategoryRepository(client);
  });

  describe('findByPropertyId', () => {
    it('should return faq categories array for existing property', async () => {
      // Arrange
      // testPropertyId はシードデータに存在する有効な物件ID

      // Act
      const categories = await repository.findByPropertyId(testPropertyId);

      // Assert
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should return faq categories with correct shape (id, name, icon, created_at, updated_at)', async () => {
      // Arrange
      // testPropertyId はシードデータに存在する有効な物件ID

      // Act
      const categories = await repository.findByPropertyId(testPropertyId);

      // Assert: 各要素が FaqCategory 型の形状を持つ
      expect(categories.length).toBeGreaterThan(0);
      const first = categories[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('icon');
      expect(first).toHaveProperty('created_at');
      expect(first).toHaveProperty('updated_at');
      expect(typeof first.id).toBe('string');
      expect(typeof first.name).toBe('string');
      // icon は string または null
      expect(first.icon === null || typeof first.icon === 'string').toBe(true);
    });

    it('should return empty array for non-existing property', async () => {
      // Arrange
      const nonExistingPropertyId = '00000000-0000-0000-0000-000000000000';

      // Act
      const categories = await repository.findByPropertyId(nonExistingPropertyId);

      // Assert
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBe(0);
    });
  });
});
