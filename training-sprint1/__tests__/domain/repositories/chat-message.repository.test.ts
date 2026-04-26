import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ChatSessionRepository } from '@/domain/repositories/chat-session.repository';
import { ChatMessageRepository } from '@/domain/repositories/chat-message.repository';
import type { ChatMessage } from '@/domain/models/chat';

describe('ChatMessageRepository', () => {
  let messageRepository: ChatMessageRepository;
  let sessionRepository: ChatSessionRepository;
  let client: SupabaseClient;
  let testPropertyId: string;
  let testSessionId: string;
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

    sessionRepository = new ChatSessionRepository(client);
    messageRepository = new ChatMessageRepository(client);

    // テスト用セッションを作成
    const session = await sessionRepository.create(testPropertyId);
    testSessionId = session.sessionId;
    createdSessionIds.push(testSessionId);
  });

  afterAll(async () => {
    if (createdSessionIds.length > 0) {
      // メッセージはカスケード削除されるか、または先に削除
      await client.from('chat_messages').delete().in('session_id', createdSessionIds);
      await client.from('chat_sessions').delete().in('id', createdSessionIds);
    }
  });

  describe('create', () => {
    it('should create a user message and return all ChatMessage fields', async () => {
      const result = await messageRepository.create({
        sessionId: testSessionId,
        messageType: 'user',
        body: 'テストユーザーメッセージです',
        isUnresolved: null,
      });

      expect(result).toBeDefined();
      const message = result as ChatMessage;

      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('session_id');
      expect(message).toHaveProperty('message_type');
      expect(message).toHaveProperty('body');
      expect(message).toHaveProperty('is_unresolved');
      expect(message).toHaveProperty('sent_at');

      expect(typeof message.id).toBe('string');
      expect(message.id.length).toBeGreaterThan(0);
      expect(message.session_id).toBe(testSessionId);
      expect(message.message_type).toBe('user');
      expect(message.body).toBe('テストユーザーメッセージです');
      expect(message.is_unresolved).toBeNull();
      expect(typeof message.sent_at).toBe('string');
      expect(message.sent_at.length).toBeGreaterThan(0);
    });

    it('should create an AI message with isUnresolved=false', async () => {
      const result = await messageRepository.create({
        sessionId: testSessionId,
        messageType: 'ai',
        body: 'AIの回答テストです',
        isUnresolved: false,
      });

      expect(result).toBeDefined();
      expect(result.message_type).toBe('ai');
      expect(result.body).toBe('AIの回答テストです');
      expect(result.is_unresolved).toBe(false);
      expect(result.session_id).toBe(testSessionId);
    });

    it('should create an AI message with isUnresolved=true', async () => {
      const result = await messageRepository.create({
        sessionId: testSessionId,
        messageType: 'ai',
        body: '未解決の回答テストです',
        isUnresolved: true,
      });

      expect(result).toBeDefined();
      expect(result.is_unresolved).toBe(true);
      expect(result.message_type).toBe('ai');
    });
  });

  describe('findBySessionId', () => {
    it('should return messages created in the session', async () => {
      // 新しいセッションを作成してメッセージを追加
      const session = await sessionRepository.create(testPropertyId);
      const sessionId = session.sessionId;
      createdSessionIds.push(sessionId);

      await messageRepository.create({
        sessionId,
        messageType: 'user',
        body: '最初のメッセージ',
      });
      await messageRepository.create({
        sessionId,
        messageType: 'ai',
        body: 'AI返信',
        isUnresolved: false,
      });

      const messages = await messageRepository.findBySessionId(sessionId);

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(2);
      messages.forEach((msg) => {
        expect(msg.session_id).toBe(sessionId);
      });
    });

    it('should return messages ordered by sent_at ascending', async () => {
      const session = await sessionRepository.create(testPropertyId);
      const sessionId = session.sessionId;
      createdSessionIds.push(sessionId);

      const msg1 = await messageRepository.create({
        sessionId,
        messageType: 'user',
        body: '先のメッセージ',
      });
      const msg2 = await messageRepository.create({
        sessionId,
        messageType: 'ai',
        body: '後のメッセージ',
        isUnresolved: false,
      });

      const messages = await messageRepository.findBySessionId(sessionId);

      expect(messages.length).toBe(2);
      // sent_at 昇順: 先に作成したものが先頭
      expect(messages[0].id).toBe(msg1.id);
      expect(messages[1].id).toBe(msg2.id);
    });

    it('should return empty array for session with no messages', async () => {
      const session = await sessionRepository.create(testPropertyId);
      const sessionId = session.sessionId;
      createdSessionIds.push(sessionId);

      const messages = await messageRepository.findBySessionId(sessionId);

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(0);
    });
  });

  describe('countBySessionId', () => {
    it('should return correct count of messages in a session', async () => {
      const session = await sessionRepository.create(testPropertyId);
      const sessionId = session.sessionId;
      createdSessionIds.push(sessionId);

      await messageRepository.create({
        sessionId,
        messageType: 'user',
        body: 'メッセージ1',
      });
      await messageRepository.create({
        sessionId,
        messageType: 'ai',
        body: 'メッセージ2',
        isUnresolved: false,
      });
      await messageRepository.create({
        sessionId,
        messageType: 'user',
        body: 'メッセージ3',
      });

      const count = await messageRepository.countBySessionId(sessionId);

      expect(count).toBe(3);
    });

    it('should return 0 for session with no messages', async () => {
      const session = await sessionRepository.create(testPropertyId);
      const sessionId = session.sessionId;
      createdSessionIds.push(sessionId);

      const count = await messageRepository.countBySessionId(sessionId);

      expect(count).toBe(0);
    });
  });
});
