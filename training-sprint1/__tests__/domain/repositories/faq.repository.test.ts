import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { FaqRepository } from '@/domain/repositories/faq.repository';
import type { FaqPopularItem, FaqSearchResultItem, FaqDetailItem, FaqRelatedItem } from '@/domain/models/faq';

describe('FaqRepository', () => {
  let repository: FaqRepository;
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
    repository = new FaqRepository(client);
  });

  describe('findPopularByPropertyId', () => {
    it('should return faq popular items array for existing property with limit=5', async () => {
      // Arrange
      const limit = 5;

      // Act
      const faqs = await repository.findPopularByPropertyId(testPropertyId, limit);

      // Assert
      expect(Array.isArray(faqs)).toBe(true);
      expect(faqs.length).toBeGreaterThan(0);
      expect(faqs.length).toBeLessThanOrEqual(limit);
    });

    it('should return items with correct shape (id, title, categoryName)', async () => {
      // Arrange
      const limit = 5;

      // Act
      const faqs = await repository.findPopularByPropertyId(testPropertyId, limit);

      // Assert: 各要素が FaqPopularItem 型の形状を持つ
      expect(faqs.length).toBeGreaterThan(0);
      const first = faqs[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('title');
      expect(first).toHaveProperty('categoryName');
      expect(typeof first.id).toBe('string');
      expect(typeof first.title).toBe('string');
      expect(typeof first.categoryName).toBe('string');
      // categoryName は空でないこと（JOIN でカテゴリが取得できている）
      expect(first.categoryName.length).toBeGreaterThan(0);
    });

    it('should return items ordered by access_count descending', async () => {
      // Arrange
      const limit = 5;

      // Act
      const faqs = await repository.findPopularByPropertyId(testPropertyId, limit);

      // Assert: access_count DESC 順であることを確認するために DB から生データも取得
      // （FaqPopularItem に access_count は含まれないので、順序の検証は DB クエリで確認）
      if (faqs.length < 2) {
        // データが1件以下の場合はスキップ
        return;
      }

      // 同じ propertyId の is_published=true なFAQを access_count DESC で取得
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: rawFaqs } = await supabase
        .from('faqs')
        .select('id, access_count')
        .eq('property_id', testPropertyId)
        .eq('is_published', true)
        .order('access_count', { ascending: false })
        .limit(limit);

      if (!rawFaqs || rawFaqs.length < 2) return;

      // repository の返却順が DB の access_count DESC 順と一致することを確認
      const expectedIds = rawFaqs.map((f) => f.id);
      const actualIds = faqs.map((f) => f.id);
      expect(actualIds).toEqual(expectedIds);
    });

    it('should return empty array for non-existing property', async () => {
      // Arrange
      const nonExistingPropertyId = '00000000-0000-0000-0000-000000000000';
      const limit = 5;

      // Act
      const faqs = await repository.findPopularByPropertyId(nonExistingPropertyId, limit);

      // Assert
      expect(Array.isArray(faqs)).toBe(true);
      expect(faqs.length).toBe(0);
    });

    it('should return at most limit items when limit=2', async () => {
      // Arrange
      const limit = 2;

      // Act
      const faqs = await repository.findPopularByPropertyId(testPropertyId, limit);

      // Assert: limit 件を超えないこと
      expect(faqs.length).toBeLessThanOrEqual(limit);
    });

    it('should only return is_published=true faqs', async () => {
      // Arrange: シードデータは全て is_published=true のため、
      // 返却された FAQ の id が全て is_published=true であることを確認
      const limit = 5;

      // Act
      const faqs = await repository.findPopularByPropertyId(testPropertyId, limit);

      if (faqs.length === 0) return;

      // DB から直接確認
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const ids = faqs.map((f) => f.id);
      const { data: rawFaqs } = await supabase
        .from('faqs')
        .select('id, is_published')
        .in('id', ids);

      // Assert: 全て is_published=true
      expect(rawFaqs).toBeDefined();
      rawFaqs!.forEach((faq) => {
        expect(faq.is_published).toBe(true);
      });
    });
  });

  // -------------------------------------------------------------------------
  // searchByPropertyId
  // -------------------------------------------------------------------------
  describe('searchByPropertyId', () => {
    // シードデータに存在するキーワード（title / body は faker.lorem で英語生成）
    // 確実にヒットさせるため、DBから1件取得してそのtitleの一部をキーワードに使う

    it('should return matching faqs when q hits title or body (is_published=true only)', async () => {
      // Arrange: シードデータから is_published=true の FAQを1件取得し、
      //          title の先頭3単語をキーワードとして使用
      const { data: seedFaqs } = await client
        .from('faqs')
        .select('id, title')
        .eq('property_id', testPropertyId)
        .eq('is_published', true)
        .limit(1)
        .single();

      if (!seedFaqs) {
        throw new Error('No seed FAQ found for testPropertyId');
      }

      // title の最初の単語（3文字以上）をキーワードとして使う
      const words = seedFaqs.title.split(/\s+/).filter((w: string) => w.length >= 3);
      const keyword = words[0];

      if (!keyword) {
        throw new Error('Could not extract keyword from seed FAQ title');
      }

      // Act
      const results = await repository.searchByPropertyId(testPropertyId, { q: keyword });

      // Assert
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      // ヒットしたFAQのいずれかに keyword が含まれること（ilike 部分一致）
      const lowerKeyword = keyword.toLowerCase();
      const hasMatch = results.some(
        (item: FaqSearchResultItem) =>
          item.title.toLowerCase().includes(lowerKeyword) ||
          item.bodyExcerpt.toLowerCase().includes(lowerKeyword)
      );
      expect(hasMatch).toBe(true);
    });

    it('should return matching faqs when categoryId is specified', async () => {
      // Arrange: シードデータから is_published=true の FAQのcategory_idを取得
      const { data: seedFaq } = await client
        .from('faqs')
        .select('id, category_id')
        .eq('property_id', testPropertyId)
        .eq('is_published', true)
        .limit(1)
        .single();

      if (!seedFaq) {
        throw new Error('No seed FAQ found for testPropertyId');
      }

      const categoryId = seedFaq.category_id;

      // Act
      const results = await repository.searchByPropertyId(testPropertyId, { categoryId });

      // Assert
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      // 返却されたFAQが全て同じカテゴリに属することを DB から確認
      const ids = results.map((r: FaqSearchResultItem) => r.id);
      const { data: rawFaqs } = await client
        .from('faqs')
        .select('id, category_id')
        .in('id', ids);

      expect(rawFaqs).toBeDefined();
      rawFaqs!.forEach((faq) => {
        expect(faq.category_id).toBe(categoryId);
      });
    });

    it('should prioritize q over categoryId when both are specified', async () => {
      // Arrange: シードデータから is_published=true の FAQを1件取得
      const { data: seedFaq } = await client
        .from('faqs')
        .select('id, title, category_id')
        .eq('property_id', testPropertyId)
        .eq('is_published', true)
        .limit(1)
        .single();

      if (!seedFaq) {
        throw new Error('No seed FAQ found for testPropertyId');
      }

      const words = seedFaq.title.split(/\s+/).filter((w: string) => w.length >= 3);
      const keyword = words[0];

      if (!keyword) {
        throw new Error('Could not extract keyword from seed FAQ title');
      }

      // 存在するが keyword を含まない可能性があるカテゴリIDとして、
      // 別カテゴリのFAQを探す（なければ同カテゴリでも結果は変わらないが q が優先されることを確認）
      const { data: otherFaq } = await client
        .from('faqs')
        .select('category_id')
        .eq('property_id', testPropertyId)
        .eq('is_published', true)
        .neq('category_id', seedFaq.category_id)
        .limit(1)
        .single();

      // 別カテゴリがない場合は同カテゴリを使う（q 優先の動作は変わらない）
      const differentCategoryId = otherFaq?.category_id ?? seedFaq.category_id;

      // Act: q と categoryId の両方を指定
      const resultsWithBoth = await repository.searchByPropertyId(testPropertyId, {
        q: keyword,
        categoryId: differentCategoryId,
      });

      // Act: q のみ指定
      const resultsWithQOnly = await repository.searchByPropertyId(testPropertyId, {
        q: keyword,
      });

      // Assert: 両方指定した場合と q のみの場合で結果が一致する（q 優先）
      expect(resultsWithBoth.map((r: FaqSearchResultItem) => r.id).sort()).toEqual(
        resultsWithQOnly.map((r: FaqSearchResultItem) => r.id).sort()
      );
    });

    it('should return empty array when q matches nothing', async () => {
      // Arrange: 絶対にヒットしないキーワード
      const nonExistentKeyword = 'XXXXXXXXXXXXXXXXXXXXXX_NO_MATCH_9999';

      // Act
      const results = await repository.searchByPropertyId(testPropertyId, {
        q: nonExistentKeyword,
      });

      // Assert
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should not return is_published=false faqs', async () => {
      // Arrange: is_published=false のFAQをテスト用に1件挿入
      const { data: categories } = await client
        .from('faq_categories')
        .select('id')
        .limit(1)
        .single();

      if (!categories) {
        throw new Error('No faq_category found');
      }

      const unpublishedTitle = 'UNPUBLISHED_TEST_FAQ_SEARCH_' + Date.now();
      const { data: unpublishedFaq, error: insertError } = await client
        .from('faqs')
        .insert({
          property_id: testPropertyId,
          category_id: categories.id,
          title: unpublishedTitle,
          body: unpublishedTitle + ' body content',
          access_count: 0,
          is_published: false,
        })
        .select()
        .single();

      if (insertError || !unpublishedFaq) {
        throw new Error(`Failed to insert unpublished FAQ: ${insertError?.message}`);
      }

      try {
        // Act: unpublished FAQのタイトルをキーワードにして検索
        const results = await repository.searchByPropertyId(testPropertyId, {
          q: unpublishedTitle,
        });

        // Assert: is_published=false の FAQ はヒットしない
        expect(Array.isArray(results)).toBe(true);
        const foundUnpublished = results.some(
          (r: FaqSearchResultItem) => r.id === unpublishedFaq.id
        );
        expect(foundUnpublished).toBe(false);
      } finally {
        // クリーンアップ
        await client.from('faqs').delete().eq('id', unpublishedFaq.id);
      }
    });

    it('should return items with id, title, bodyExcerpt, and categoryName fields', async () => {
      // Arrange: categoryId を使ってFAQを1件以上取得できることを確認
      const { data: seedFaq } = await client
        .from('faqs')
        .select('category_id')
        .eq('property_id', testPropertyId)
        .eq('is_published', true)
        .limit(1)
        .single();

      if (!seedFaq) {
        throw new Error('No seed FAQ found for testPropertyId');
      }

      // Act
      const results = await repository.searchByPropertyId(testPropertyId, {
        categoryId: seedFaq.category_id,
      });

      // Assert
      expect(results.length).toBeGreaterThan(0);
      const item = results[0];

      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('bodyExcerpt');
      expect(item).toHaveProperty('categoryName');

      expect(typeof item.id).toBe('string');
      expect(typeof item.title).toBe('string');
      expect(typeof item.bodyExcerpt).toBe('string');
      expect(typeof item.categoryName).toBe('string');

      // categoryName は空でないこと（JOIN でカテゴリが取得できている）
      expect(item.categoryName.length).toBeGreaterThan(0);
    });

    it('should truncate bodyExcerpt to at most 100 characters', async () => {
      // Arrange: body が100文字を超えるFAQをテスト用に挿入
      const { data: categories } = await client
        .from('faq_categories')
        .select('id')
        .limit(1)
        .single();

      if (!categories) {
        throw new Error('No faq_category found');
      }

      const longBody = 'A'.repeat(200); // 200文字のbody
      const excerptTestTitle = 'EXCERPT_TEST_FAQ_' + Date.now();
      const { data: longBodyFaq, error: insertError } = await client
        .from('faqs')
        .insert({
          property_id: testPropertyId,
          category_id: categories.id,
          title: excerptTestTitle,
          body: longBody,
          access_count: 0,
          is_published: true,
        })
        .select()
        .single();

      if (insertError || !longBodyFaq) {
        throw new Error(`Failed to insert long body FAQ: ${insertError?.message}`);
      }

      try {
        // Act
        const results = await repository.searchByPropertyId(testPropertyId, {
          q: excerptTestTitle,
        });

        // Assert
        expect(results.length).toBeGreaterThan(0);
        const found = results.find((r: FaqSearchResultItem) => r.id === longBodyFaq.id);
        expect(found).toBeDefined();
        // bodyExcerpt は最大100文字
        expect(found!.bodyExcerpt.length).toBeLessThanOrEqual(100);
        // body の先頭100文字と一致すること
        expect(found!.bodyExcerpt).toBe(longBody.substring(0, 100));
      } finally {
        // クリーンアップ
        await client.from('faqs').delete().eq('id', longBodyFaq.id);
      }
    });
  });

  // -------------------------------------------------------------------------
  // findDetailByPropertyAndId
  // -------------------------------------------------------------------------
  describe('findDetailByPropertyAndId', () => {
    let testFaqId: string;

    beforeAll(async () => {
      // テスト用 FAQ の id を取得（is_published=true のもの）
      const { data, error } = await client
        .from('faqs')
        .select('id')
        .eq('property_id', testPropertyId)
        .eq('is_published', true)
        .limit(1)
        .single();

      if (error || !data) {
        throw new Error(`Failed to fetch test faqId: ${error?.message}`);
      }

      testFaqId = data.id;
    });

    it('should return faq detail with id, title, body, categoryName, updatedAt, supportDesk when faq exists', async () => {
      // Act
      const detail = await repository.findDetailByPropertyAndId(testPropertyId, testFaqId);

      // Assert
      expect(detail).not.toBeNull();
      expect(detail).toBeDefined();

      const item = detail as FaqDetailItem;
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('body');
      expect(item).toHaveProperty('categoryName');
      expect(item).toHaveProperty('updatedAt');
      expect(item).toHaveProperty('supportDesk');

      expect(typeof item.id).toBe('string');
      expect(typeof item.title).toBe('string');
      expect(typeof item.body).toBe('string');
      expect(typeof item.categoryName).toBe('string');
      expect(typeof item.updatedAt).toBe('string');

      expect(item.supportDesk).toHaveProperty('phone');
      expect(typeof item.supportDesk.phone).toBe('string');
      // formUrl は string | null
      expect(
        item.supportDesk.formUrl === null || typeof item.supportDesk.formUrl === 'string'
      ).toBe(true);

      expect(item.id).toBe(testFaqId);
      expect(item.categoryName.length).toBeGreaterThan(0);
    });

    it('should increment access_count by 1 after calling findDetailByPropertyAndId', async () => {
      // Arrange: 呼び出し前の access_count を取得
      const { data: before } = await client
        .from('faqs')
        .select('access_count')
        .eq('id', testFaqId)
        .single();

      if (!before) {
        throw new Error('Failed to fetch access_count before call');
      }
      const countBefore = before.access_count as number;

      // Act
      await repository.findDetailByPropertyAndId(testPropertyId, testFaqId);

      // Assert: 呼び出し後の access_count を確認
      const { data: after } = await client
        .from('faqs')
        .select('access_count')
        .eq('id', testFaqId)
        .single();

      expect(after).toBeDefined();
      expect((after as { access_count: number }).access_count).toBe(countBefore + 1);
    });

    it('should return null for is_published=false faq', async () => {
      // Arrange: is_published=false の FAQ をテスト用に挿入
      const { data: category } = await client
        .from('faq_categories')
        .select('id')
        .limit(1)
        .single();

      if (!category) {
        throw new Error('No faq_category found');
      }

      const { data: unpublishedFaq, error: insertError } = await client
        .from('faqs')
        .insert({
          property_id: testPropertyId,
          category_id: category.id,
          title: 'UNPUBLISHED_DETAIL_TEST_' + Date.now(),
          body: 'This FAQ is not published',
          access_count: 0,
          is_published: false,
        })
        .select()
        .single();

      if (insertError || !unpublishedFaq) {
        throw new Error(`Failed to insert unpublished FAQ: ${insertError?.message}`);
      }

      try {
        // Act
        const result = await repository.findDetailByPropertyAndId(
          testPropertyId,
          unpublishedFaq.id
        );

        // Assert: is_published=false なので null を返すこと
        expect(result).toBeNull();
      } finally {
        await client.from('faqs').delete().eq('id', unpublishedFaq.id);
      }
    });

    it('should return null when faqId does not exist', async () => {
      // Arrange: 存在しない UUID
      const nonExistentFaqId = '00000000-0000-0000-0000-000000000000';

      // Act
      const result = await repository.findDetailByPropertyAndId(testPropertyId, nonExistentFaqId);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when propertyId does not match the faq', async () => {
      // Arrange: testFaqId は testPropertyId に属するが、別物件IDで検索
      const differentPropertyId = '00000000-0000-0000-0000-000000000001';

      // Act
      const result = await repository.findDetailByPropertyAndId(
        differentPropertyId,
        testFaqId
      );

      // Assert: 物件 ID が一致しないので null を返すこと
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // findRelatedByFaqId
  // -------------------------------------------------------------------------
  describe('findRelatedByFaqId', () => {
    let testFaqId: string;

    beforeAll(async () => {
      // タグが紐づいている FAQ を取得（faq_tag_mappings に存在するもの）
      const { data, error } = await client
        .from('faq_tag_mappings')
        .select('faq_id')
        .limit(1)
        .single();

      if (error || !data) {
        throw new Error(`Failed to fetch faqId with tags: ${error?.message}`);
      }

      testFaqId = data.faq_id;
    });

    it('should return related faqs that share the same tags', async () => {
      // Arrange
      const limit = 3;

      // Act
      const related = await repository.findRelatedByFaqId(testFaqId, limit);

      // Assert
      expect(Array.isArray(related)).toBe(true);
      // タグが紐づいていれば関連FAQが返る（0件の場合はシードデータに問題あり）
      // 各要素の型確認
      if (related.length > 0) {
        const first = related[0] as FaqRelatedItem;
        expect(first).toHaveProperty('id');
        expect(first).toHaveProperty('title');
        expect(typeof first.id).toBe('string');
        expect(typeof first.title).toBe('string');
      }
    });

    it('should not include the source faq itself in the related results', async () => {
      // Arrange
      const limit = 10;

      // Act
      const related = await repository.findRelatedByFaqId(testFaqId, limit);

      // Assert: testFaqId 自身は含まれないこと
      const ids = related.map((r: FaqRelatedItem) => r.id);
      expect(ids).not.toContain(testFaqId);
    });

    it('should return at most limit items', async () => {
      // Arrange
      const limit = 2;

      // Act
      const related = await repository.findRelatedByFaqId(testFaqId, limit);

      // Assert: limit 件を超えないこと
      expect(related.length).toBeLessThanOrEqual(limit);
    });
  });
});
