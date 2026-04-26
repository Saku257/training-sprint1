import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ChatSessionRepository } from '@/domain/repositories/chat-session.repository';
import type { ChatSessionResult } from '@/domain/models/chat';

describe('ChatSessionRepository', () => {
  let repository: ChatSessionRepository;
  let client: SupabaseClient;
  let testPropertyId: string;
  const createdSessionIds: string[] = [];

  beforeAll(async () => {
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

    repository = new ChatSessionRepository(client);
  });

  afterAll(async () => {
    if (createdSessionIds.length > 0) {
      await client.from('chat_sessions').delete().in('id', createdSessionIds);
    }
  });

  describe('create', () => {
    it('should return sessionId and startedAt after creating a session', async () => {
      const result = await repository.create(testPropertyId);

      createdSessionIds.push(result.sessionId);

      expect(result).toBeDefined();
      const session = result as ChatSessionResult;

      expect(session).toHaveProperty('sessionId');
      expect(session).toHaveProperty('startedAt');

      expect(typeof session.sessionId).toBe('string');
      expect(session.sessionId.length).toBeGreaterThan(0);

      expect(typeof session.startedAt).toBe('string');
      expect(session.startedAt.length).toBeGreaterThan(0);
    });

    it('should create a new session with unique id each time', async () => {
      const result1 = await repository.create(testPropertyId);
      const result2 = await repository.create(testPropertyId);

      createdSessionIds.push(result1.sessionId);
      createdSessionIds.push(result2.sessionId);

      expect(result1.sessionId).not.toBe(result2.sessionId);
    });
  });

  describe('findById', () => {
    it('should return { id } when session exists', async () => {
      const created = await repository.create(testPropertyId);
      createdSessionIds.push(created.sessionId);

      const found = await repository.findById(created.sessionId);

      expect(found).not.toBeNull();
      expect(found).toHaveProperty('id');
      expect(found!.id).toBe(created.sessionId);
    });

    it('should return null when session does not exist', async () => {
      const nonExistentSessionId = '00000000-0000-4000-8000-000000000000';

      const result = await repository.findById(nonExistentSessionId);

      expect(result).toBeNull();
    });
  });
});
