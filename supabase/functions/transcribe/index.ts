// ============================================================
// Edge Function: transcribe
// ------------------------------------------------------------
// Receives an audio file (multipart/form-data, field "file"),
// forwards it to OpenAI Whisper, and returns { text }.
//
// The OpenAI key lives ONLY here (server-side), never in the app.
//
// Deploy:
//   supabase functions deploy transcribe --no-verify-jwt
//   supabase secrets set OPENAI_API_KEY=sk-...
// ============================================================

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

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
  if (!OPENAI_API_KEY) {
    return json({ error: 'Server is not configured for transcription.' }, 500);
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get('file');
    if (f instanceof File) file = f;
  } catch {
    return json({ error: 'Could not read the uploaded audio.' }, 400);
  }
  if (!file) {
    return json({ error: 'No audio file provided.' }, 400);
  }

  try {
    const openaiForm = new FormData();
    openaiForm.append('file', file, file.name || 'recording.m4a');
    openaiForm.append('model', 'whisper-1');
    openaiForm.append('response_format', 'json');

    const resp = await fetch(WHISPER_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: openaiForm,
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error('OpenAI Whisper error', resp.status, detail);
      return json({ error: 'Transcription failed. Please try again.' }, 502);
    }

    const data = await resp.json();
    const text = (data.text ?? '').trim();
    return json({ text }, 200);
  } catch (e) {
    console.error('Unexpected transcription error', e);
    return json({ error: 'Unexpected error during transcription.' }, 500);
  }
});
