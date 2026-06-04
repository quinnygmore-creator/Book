// ============================================================
// Edge Function: cleanup
// ------------------------------------------------------------
// Turns a raw voice-note transcript into a clean, structured page
// using Claude. Returns { title, body }.
//
// Strategy: a forced `save_page` tool guarantees structured output,
// and a tightly-scoped system prompt removes filler / fixes grammar
// WITHOUT inventing content or changing the speaker's meaning.
//
// Deploy:
//   supabase functions deploy cleanup --no-verify-jwt
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// ============================================================

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `You are the editor inside a journaling app called Books. You transform raw, spoken voice-note transcripts into a clean, beautifully structured page — without changing the meaning or inventing anything.

Rules:
- Remove filler words and sounds: "um", "uh", "ah", "like", "you know", "I mean", "sort of", "kind of" when used as filler, plus false starts and repeated words.
- Fix grammar, punctuation, and capitalization.
- Keep the speaker's original meaning, intent, and first-person voice. Do NOT add new ideas, facts, opinions, or answers. Do NOT respond to the content — only clean and structure it.
- Write clear, natural prose in short paragraphs. Use a markdown bullet list ONLY when the content is genuinely a list of items or steps.
- Create a short, evocative title (2–5 words) capturing the essence.
- Be concise. Prefer fewer, well-formed sentences over padding.

Example:
Input: "Umm I was thinking maybe a tote bag with a hidden compartment"
Title: Design Concept
Body: A tote bag featuring a hidden compartment while maintaining a clean, minimal appearance.

Always return your result by calling the save_page tool.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }
  if (!ANTHROPIC_API_KEY) {
    return json({ error: 'Server is not configured for AI cleanup.' }, 500);
  }

  let text = '';
  try {
    const body = await req.json();
    text = (body?.text ?? '').toString().trim();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  if (!text) {
    return json({ error: 'No text provided to clean up.' }, 400);
  }

  try {
    const resp = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: [
          {
            name: 'save_page',
            description: 'Save the cleaned, structured page.',
            input_schema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Short evocative title (2–5 words).' },
                body: { type: 'string', description: 'Cleaned, structured markdown body.' },
              },
              required: ['title', 'body'],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'save_page' },
        messages: [
          { role: 'user', content: `Clean and structure this voice note:\n\n"""${text}"""` },
        ],
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error('Anthropic error', resp.status, detail);
      return json({ error: 'AI cleanup failed. Please try again.' }, 502);
    }

    const data = await resp.json();
    const toolUse = Array.isArray(data?.content)
      ? data.content.find((c: { type?: string }) => c.type === 'tool_use')
      : null;

    const title = (toolUse?.input?.title ?? '').toString().trim();
    const cleanBody = (toolUse?.input?.body ?? '').toString().trim();

    if (!cleanBody) {
      console.error('No structured output from model', JSON.stringify(data));
      return json({ error: 'AI cleanup returned an empty page.' }, 502);
    }

    return json({ title: title || 'Untitled', body: cleanBody }, 200);
  } catch (e) {
    console.error('Unexpected cleanup error', e);
    return json({ error: 'Unexpected error during AI cleanup.' }, 500);
  }
});
