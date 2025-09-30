import { GoogleGenerativeAI } from '@google/generative-ai';
import { IncomingMessage, ServerResponse } from 'http';

const ORIGIN = process.env.CORS_ORIGIN || '*';

const googleApiKey = process.env.GOOGLE_API_KEY;
if (!googleApiKey) throw new Error('Falta GOOGLE_API_KEY');
const gen = new GoogleGenerativeAI(googleApiKey);
const chatModel = gen.getGenerativeModel({ model: 'gemini-2.0-flash' });

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    });
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Simple CORS (solo si llamas desde otro dominio; en mismo dominio no afecta)
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ message: 'Method Not Allowed' }));
  }

  const payload = await readBody(req);
  const prompt: string = typeof payload?.prompt === 'string' ? payload.prompt.trim() : '';
  if (!prompt) {
    res.statusCode = 422;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ message: 'Invalid request: missing "prompt"' }));
  }

  try {
    const result = await chatModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
    });
    const answer = result.response.text();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ provider: 'gemini', answer }));
  } catch (e: any) {
    console.error('Gemini /chat error:', e?.response ?? e);
    let detail = e?.message ?? 'Unknown error';
    try {
      const t = await e?.response?.text?.();
      if (t) detail = t;
    } catch {}
    const status = e?.response?.status ?? 400;
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Chat failed', detail }));
  }
}