// ============================================================
// Edge Function: detect-goals
// ------------------------------------------------------------
// Given an entry's text and the user's goals (id + title), returns
// the ids of goals the entry is about or progresses. Uses a forced
// `link_goals` tool so output is always a clean id list.
//
// Deploy:
//   supabase functions deploy detect-goals --no-verify-jwt
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// ============================================================

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `You connect a journal entry to a user's goals. You are given the entry text and a list of the user's goals (each with an id and a title). Decide which goals, if any, the entry is about or makes progress toward.

Rules:
- Only choose from the provided goal ids. Never invent ids.
- Link a goal only when the entry clearly relates to it. When unsure, leave it out.
- An entry may link to zero, one, or several goals.

Example: the entry "I worked on the tote bag today" should link to a goal titled "Launch Clothing Brand".

Always return your answer by calling the link_goals tool.`;

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

interface GoalInput {
  id: string;
  title: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }
  if (!ANTHROPIC_API_KEY) {
    return json({ error: 'Server is not configured for goal detection.' }, 500);
  }

  let text = '';
  let goals: GoalInput[] = [];
  try {
    const body = await req.json();
    text = (body?.text ?? '').toString().trim();
    goals = Array.isArray(body?.goals) ? body.goals : [];
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  // Nothing to match against — return an empty list (not an error).
  if (!text || goals.length === 0) {
    return json({ goalIds: [] }, 200);
  }

  const validIds = new Set(goals.map((g) => g.id));
  const goalList = goals.map((g) => `- ${g.id}: ${g.title}`).join('\n');

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
        max_tokens: 256,
        system: SYSTEM_PROMPT,
        tools: [
          {
            name: 'link_goals',
            description: 'Link the entry to zero or more of the provided goals.',
            input_schema: {
              type: 'object',
              properties: {
                goalIds: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Ids of goals this entry relates to (from the provided list).',
                },
              },
              required: ['goalIds'],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'link_goals' },
        messages: [
          {
            role: 'user',
            content: `Goals:\n${goalList}\n\nEntry:\n"""${text}"""`,
          },
        ],
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error('Anthropic error', resp.status, detail);
      return json({ error: 'Goal detection failed.' }, 502);
    }

    const data = await resp.json();
    const toolUse = Array.isArray(data?.content)
      ? data.content.find((c: { type?: string }) => c.type === 'tool_use')
      : null;

    const raw = Array.isArray(toolUse?.input?.goalIds) ? toolUse.input.goalIds : [];
    // Defensively keep only ids we actually provided.
    const goalIds = raw.filter((id: unknown) => typeof id === 'string' && validIds.has(id));

    return json({ goalIds }, 200);
  } catch (e) {
    console.error('Unexpected goal detection error', e);
    return json({ error: 'Unexpected error during goal detection.' }, 500);
  }
});
