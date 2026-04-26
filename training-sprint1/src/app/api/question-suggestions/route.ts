import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { QuestionSuggestionRepository } from '@/domain/repositories/question-suggestion.repository';
import { QuestionSuggestionService } from '@/domain/services/question-suggestion.service';

export async function GET(_req: NextRequest) {
  try {
    const client = createServerClient();
    const service = new QuestionSuggestionService(new QuestionSuggestionRepository(client));
    const data = await service.getSuggestions();
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
