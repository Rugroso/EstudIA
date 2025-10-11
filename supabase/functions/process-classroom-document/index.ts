// @ts-nocheck
// Tip: if you prefer proper Deno types in VS Code, install the "deno" extension and enable it for this workspace.
// Otherwise we disable TS checking here to avoid red squiggles while keeping the runtime correct on Supabase.
// You can remove this and rely on Deno's language server if desired.
declare const Deno: any;
// supabase/functions/process-classroom-document/index.ts
// MVP: procesa classroom_documents con text_excerpt, creando chunks y embeddings

// Use a direct Deno-friendly URL import so the editor doesn't need an import map
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4?target=deno';

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE';
  table: string;
  schema: string;
  record: any;
  old_record: any;
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EMBEDDING_URL = Deno.env.get('EMBEDDING_URL') || '';
const ALLOW_ORIGIN = Deno.env.get('CORS_ORIGIN') || '*';

const baseHeaders = {
  'Access-Control-Allow-Origin': ALLOW_ORIGIN,
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function chunkText(text: string, maxLen = 1200, overlap = 200) {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + maxLen, text.length);
    chunks.push(text.slice(i, end));
    if (end === text.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks;
}

async function embed(text: string): Promise<number[]> {
  if (!EMBEDDING_URL) throw new Error('EMBEDDING_URL not configured');
  const r = await fetch(EMBEDDING_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error(`Embedding HTTP ${r.status}`);
  const j = await r.json();
  // Supports both { embedding: [...] } and Google-style { embedding: { values: [...] } }
  const emb = j?.embedding?.values ?? j?.embedding;
  if (!Array.isArray(emb)) throw new Error('Invalid embedding response');
  return emb;
}

async function processRecord(rec: any) {
  const id = rec?.id as string;
  const classroom_id = rec?.classroom_id as string;
  const text = (rec?.text_excerpt as string) ?? '';

  // update status -> processing
  await supabaseAdmin.from('classroom_documents').update({ status: 'processing' }).eq('id', id);

  if (!text) {
    // TODO: manejar PDF/imagen desde Storage en iteraciones siguientes
    await supabaseAdmin.from('classroom_documents').update({ status: 'failed' }).eq('id', id);
    return;
  }

  const chunks = chunkText(text);
  let count = 0;
  for (let idx = 0; idx < chunks.length; idx++) {
    const c = chunks[idx];
    const emb = await embed(c.replace(/\s+/g, ' ').trim());
    const token = Math.ceil(c.length / 4);
    const { error } = await supabaseAdmin.from('classroom_document_chunks').insert({
      classroom_document_id: id,
      chunk_index: idx,
      content: c,
      token,
      embedding: emb,
    });
    if (error) throw error;
    count++;
  }

  await supabaseAdmin
    .from('classroom_documents')
    .update({ status: 'ready', embedding_ready: true, chunk_count: count })
    .eq('id', id);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: baseHeaders });
  if (req.method === 'GET') return new Response(JSON.stringify({ ok: true }), { status: 200, headers: baseHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405, headers: baseHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    // Manual trigger: { document_id }
    const manualId = body?.document_id as string | undefined;
    if (manualId) {
      const { data: rec, error } = await supabaseAdmin
        .from('classroom_documents')
        .select('*')
        .eq('id', manualId)
        .single();
      if (error || !rec) throw error || new Error('document not found');
      await processRecord(rec);
      return new Response(JSON.stringify({ ok: true, mode: 'manual' }), { status: 200, headers: baseHeaders });
    }

    // Webhook mode: DB row payload
    const payload = body as WebhookPayload;
    if (payload?.table !== 'classroom_documents' || payload?.schema !== 'public') {
      return new Response(JSON.stringify({ message: 'ignored' }), { status: 200, headers: baseHeaders });
    }
    const rec = payload.record || {};
    await processRecord(rec);
    return new Response(JSON.stringify({ ok: true, mode: 'webhook' }), { status: 200, headers: baseHeaders });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: baseHeaders });
  }
});
