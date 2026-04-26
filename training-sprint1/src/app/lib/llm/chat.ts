import type { AiAnswerOutput } from '@/domain/models/chat';

export type FaqContext = {
  id: string;
  title: string;
  body: string;
  categoryName: string;
};

export type ChatLlmInput = {
  message: string;
  faqContexts: FaqContext[];
  initialFaqContext?: FaqContext | null;
};

const SYSTEM_PROMPT = `あなたは建物・物件の入居者向けサポートAIアシスタントです。
以下のFAQデータをもとに、入居者の質問に日本語で回答してください。

回答ルール：
- FAQデータに基づいた正確な情報のみを回答すること
- FAQデータで解決できない質問には「申し訳ありません。この質問にはお答えできません。サポートデスクにお問い合わせください。」と回答し、isUnresolved を true にすること
- relatedFaqIds にはFAQデータの中で質問に関連するFAQのIDを最大3件含めること
- 回答はマークダウン形式で、読みやすく構造化すること`;

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.0-flash';

export async function generateAiAnswer(input: ChatLlmInput): Promise<AiAnswerOutput> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      answer:
        '申し訳ありません。AIサービスが利用できません。サポートデスクにお問い合わせください。',
      isUnresolved: true,
      relatedFaqIds: [],
    };
  }

  const model = process.env.LLM_MODEL ?? DEFAULT_MODEL;

  const faqContextText = input.faqContexts
    .map((f) => `[FAQ ID: ${f.id}]\nカテゴリ: ${f.categoryName}\nQ: ${f.title}\nA: ${f.body}`)
    .join('\n\n---\n\n');

  const initialContext = input.initialFaqContext
    ? `\n\n## 参照中のFAQ（追加コンテキスト）\n[FAQ ID: ${input.initialFaqContext.id}]\nQ: ${input.initialFaqContext.title}\nA: ${input.initialFaqContext.body}`
    : '';

  const systemContent = `${SYSTEM_PROMPT}\n\n## FAQデータ\n${faqContextText}${initialContext}`;

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemContent }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: input.message }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          answer: {
            type: 'string',
            description: '入居者への回答テキスト（マークダウン）',
          },
          isUnresolved: {
            type: 'boolean',
            description: 'FAQで解決できなかった場合は true',
          },
          relatedFaqIds: {
            type: 'array',
            items: { type: 'string' },
            description: '関連するFAQのID（最大3件）',
          },
        },
        required: ['answer', 'isUnresolved', 'relatedFaqIds'],
      },
    },
  };

  const response = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '(failed to read body)');
    console.error(
      `[generateAiAnswer] Gemini API error: ${response.status} ${response.statusText}\nmodel: ${model}\nbody: ${errorBody}`
    );

    // 利用可能な全ステータスでフォールバック（クォータ超過・モデル不在・アクセス拒否など）
    return {
      answer:
        '申し訳ありません。現在AIサービスが利用できません。しばらく経ってから再度お試しいただくか、サポートデスクにお問い合わせください。',
      isUnresolved: true,
      relatedFaqIds: [],
    };
  }

  const result = (await response.json()) as {
    candidates: { content: { parts: { text: string }[] } }[];
  };

  const text = result.candidates[0]?.content?.parts[0]?.text;
  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  const parsed = JSON.parse(text) as AiAnswerOutput;
  return {
    answer: parsed.answer,
    isUnresolved: parsed.isUnresolved,
    relatedFaqIds: (parsed.relatedFaqIds ?? []).slice(0, 3),
  };
}
