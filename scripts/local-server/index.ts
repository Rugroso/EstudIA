import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';
import { createServer, ServerResponse } from 'http';

const PORT = Number(process.env.PORT ?? 8000);
const ORIGIN = process.env.CORS_ORIGIN ?? '*';

const googleApiKey = process.env.GOOGLE_API_KEY;
if (!googleApiKey) throw new Error('Falta GOOGLE_API_KEY en .env');
const gen = new GoogleGenerativeAI(googleApiKey);
const embedModel = gen.getGenerativeModel({ model: 'text-embedding-004' });
const chatModel = gen.getGenerativeModel({ model: 'gemini-2.0-flash' });

function setCors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
function json(res: ServerResponse, status: number, payload: any) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

const server = createServer(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.writeHead(204).end();

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname;

  if (req.method === 'GET' && (path === '/' || path === '/health')) {
    return json(res, 200, { ok: true, message: 'Server alive' });
  }

  if (req.method !== 'POST') return json(res, 405, { message: 'Method Not Allowed' });

  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', async () => {
    let payload: any = {};
    try { payload = JSON.parse(body || '{}'); } catch {}

    if (path === '/embedding') {
      const text: string = payload?.text;
      if (!text) return json(res, 422, { message: 'Invalid request: missing "text"' });
      try {
        const { embedding } = await embedModel.embedContent(text);
        return json(res, 200, { provider: 'gemini', dims: embedding.values.length, embedding: embedding.values });
      } catch (e: any) {
        return json(res, 400, { message: 'Embedding failed', detail: e?.message });
      }
    }

    if (path === '/chat') {
  const prompt: string = typeof payload?.prompt === 'string' ? payload.prompt.trim() : '';
  if (!prompt) return json(res, 422, { message: 'Invalid request: missing "prompt"' });

  try {
    const result = await chatModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    const answer = result.response.text();
    return json(res, 200, { provider: 'gemini', answer });
  } catch (e: any) {
    // Log útil en consola para ver por qué falla
    console.error('Gemini /chat error:', e?.response ?? e);
    const status = e?.response?.status ?? 400;
    // intenta extraer mensaje de la respuesta de la API si existe
    let detail = e?.message ?? 'Unknown error';
    try {
      const t = await e?.response?.text?.();
      if (t) detail = t;
    } catch {}
    return json(res, status, { message: 'Chat failed', detail });
  }
}


    // Ruta no encontrada
    return json(res, 404, { message: 'Not Found' });
  });
});

server.listen(PORT, '127.0.0.1', () =>
  console.log(`Local server on http://127.0.0.1:${PORT}  (GET /health, POST /embedding, POST /chat)`)
);
