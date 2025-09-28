// supabase/functions/embedding/index.ts
// Deno runtime (Supabase Edge Functions)

const GEMINI_KEY = Deno.env.get('GOOGLE_API_KEY')!;
const ALLOW_ORIGIN = Deno.env.get('CORS_ORIGIN') ?? '*';

const baseHeaders = {
  'Access-Control-Allow-Origin': ALLOW_ORIGIN,
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: baseHeaders });
  }

  // Health check
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ ok: true, provider: 'gemini' }), {
      status: 200,
      headers: baseHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
      status: 405,
      headers: baseHeaders,
    });
  }

  // Body
  let text = '';
  try {
    const body = await req.json();
    text = body?.text ?? '';
  } catch {
    // ignore
  }
  if (!text) {
    return new Response(JSON.stringify({ message: 'Invalid request: missing "text"' }), {
      status: 422, headers: baseHeaders,
    });
  }

  try {
    // REST embeddings API
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent' +
      `?key=${encodeURIComponent(GEMINI_KEY)}`;

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return new Response(JSON.stringify({ message: 'Gemini error', detail }), {
        status: r.status || 400,
        headers: baseHeaders,
      });
    }

    const data = await r.json();
    const embedding: number[] = data?.embedding?.values ?? [];
    const dims = embedding.length;

    return new Response(JSON.stringify({ provider: 'gemini', dims, embedding }), {
      status: 200, headers: baseHeaders,
    });
  } catch (e) {
    return new Response(JSON.stringify({ message: 'Something went wrong', detail: String(e) }), {
      status: 400, headers: baseHeaders,
    });
  }
});
