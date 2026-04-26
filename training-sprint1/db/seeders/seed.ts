import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import {
  createProperties,
  createFaqCategories,
  createFaqTags,
  createFeedbackData,
  createChatSessionData,
  createChatMessageData,
  createQuestionSuggestionData,
  REAL_FAQ_TEMPLATES,
} from '../factories';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const client = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  console.log('🌱 Database seeding started...');

  // ---- クリア（依存関係の逆順）----
  console.log('Clearing existing data...');
  await client.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await client.from('chat_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await client.from('feedback').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await client.from('faq_tag_mappings').delete().neq('faq_id', '00000000-0000-0000-0000-000000000000');
  await client.from('faqs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await client.from('faq_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await client.from('faq_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await client.from('question_suggestions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await client.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // ---- properties ----
  console.log('Creating properties...');
  const propertyData = createProperties(3, {});
  const { data: properties, error: propError } = await client
    .from('properties')
    .insert(propertyData)
    .select();
  if (propError) throw new Error(`properties: ${propError.message}`);
  console.log(`✓ Created ${properties.length} properties`);

  // ---- faq_categories ----
  console.log('Creating faq_categories...');
  const { data: categories, error: catError } = await client
    .from('faq_categories')
    .insert(createFaqCategories(6))
    .select();
  if (catError) throw new Error(`faq_categories: ${catError.message}`);
  console.log(`✓ Created ${categories.length} faq_categories`);

  // ---- faq_tags ----
  console.log('Creating faq_tags...');
  const { data: tags, error: tagError } = await client
    .from('faq_tags')
    .insert(createFaqTags(7))
    .select();
  if (tagError) throw new Error(`faq_tags: ${tagError.message}`);
  console.log(`✓ Created ${tags.length} faq_tags`);

  // ---- faqs（固定テンプレートを全プロパティに投入）----
  console.log('Creating faqs...');
  const categoryById = new Map(categories.map((c: { id: string; name: string }) => [c.name, c.id]));
  const faqRows: Record<string, unknown>[] = [];
  for (const property of properties) {
    for (const template of REAL_FAQ_TEMPLATES) {
      const categoryId = categoryById.get(template.categoryName);
      if (!categoryId) continue;
      faqRows.push({
        property_id: property.id,
        category_id: categoryId,
        title: template.title,
        body: template.body,
        access_count: template.access_count,
        is_published: true,
      });
    }
  }
  const { data: faqs, error: faqError } = await client.from('faqs').insert(faqRows).select();
  if (faqError) throw new Error(`faqs: ${faqError.message}`);
  console.log(`✓ Created ${faqs.length} faqs (${REAL_FAQ_TEMPLATES.length} per property)`);

  // ---- faq_tag_mappings ----
  console.log('Creating faq_tag_mappings...');
  const tagByName = new Map(tags.map((t: { id: string; name: string }) => [t.name, t.id]));
  const mappings = faqs.flatMap((faq: { id: string }, i: number) => {
    const template = REAL_FAQ_TEMPLATES[i % REAL_FAQ_TEMPLATES.length];
    return template.tagNames
      .map((name) => tagByName.get(name))
      .filter((tagId): tagId is string => !!tagId)
      .map((tagId) => ({ faq_id: faq.id, tag_id: tagId }));
  });
  if (mappings.length > 0) {
    const { error: mapError } = await client.from('faq_tag_mappings').insert(mappings);
    if (mapError) throw new Error(`faq_tag_mappings: ${mapError.message}`);
  }
  console.log(`✓ Created ${mappings.length} faq_tag_mappings`);

  // ---- feedback ----
  console.log('Creating feedback...');
  const feedbackRows = faqs.slice(0, 10).flatMap((faq: { id: string }) => [
    createFeedbackData(faq.id, { value: 'solved' }),
    createFeedbackData(faq.id, { value: 'unsolved' }),
  ]);
  const { error: fbError } = await client.from('feedback').insert(feedbackRows);
  if (fbError) throw new Error(`feedback: ${fbError.message}`);
  console.log(`✓ Created ${feedbackRows.length} feedback records`);

  // ---- chat_sessions & chat_messages ----
  console.log('Creating chat_sessions and chat_messages...');
  for (const property of properties) {
    const sessionData = createChatSessionData(property.id);
    const { data: sessions, error: sessionError } = await client
      .from('chat_sessions')
      .insert([sessionData])
      .select();
    if (sessionError) throw new Error(`chat_sessions: ${sessionError.message}`);

    const session = sessions[0];
    const messages = [
      createChatMessageData(session.id, 'user', { body: 'エアコンが故障しました' }),
      createChatMessageData(session.id, 'ai', {
        body: 'エアコンの故障については管理会社にご連絡ください。',
        is_unresolved: false,
      }),
      createChatMessageData(session.id, 'user', { body: '夜間でも連絡できますか？' }),
      createChatMessageData(session.id, 'ai', {
        body: '夜間緊急窓口は 0120-XXX-XXX です。',
        is_unresolved: false,
      }),
    ];
    const { error: msgError } = await client.from('chat_messages').insert(messages);
    if (msgError) throw new Error(`chat_messages: ${msgError.message}`);
  }
  console.log(`✓ Created chat sessions and messages for ${properties.length} properties`);

  // ---- question_suggestions ----
  console.log('Creating question_suggestions...');
  const suggestions = Array.from({ length: 5 }, (_, i) =>
    createQuestionSuggestionData(i + 1)
  );
  const { error: sugError } = await client.from('question_suggestions').insert(suggestions);
  if (sugError) throw new Error(`question_suggestions: ${sugError.message}`);
  console.log(`✓ Created ${suggestions.length} question_suggestions`);

  console.log('✨ Database seeding completed successfully!');
}

seedDatabase().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
