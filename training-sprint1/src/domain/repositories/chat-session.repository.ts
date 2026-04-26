import { SupabaseClient } from '@supabase/supabase-js';
import type { ChatSessionResult } from '@/domain/models/chat';

export class ChatSessionRepository {
  constructor(private client: SupabaseClient) {}

  async create(propertyId: string): Promise<ChatSessionResult> {
    const { data, error } = await this.client
      .from('chat_sessions')
      .insert({ property_id: propertyId })
      .select('id, started_at')
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create chat session');
    }

    return {
      sessionId: data.id as string,
      startedAt: data.started_at as string,
    };
  }

  async findById(sessionId: string): Promise<{ id: string; property_id: string } | null> {
    const { data, error } = await this.client
      .from('chat_sessions')
      .select('id, property_id')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message ?? 'Failed to fetch chat session');
    }

    if (!data) {
      return null;
    }

    return { id: data.id as string, property_id: data.property_id as string };
  }
}
