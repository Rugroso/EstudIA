import { GoogleGenerativeAI } from '@google/generative-ai';
import { IncomingMessage, ServerResponse } from 'http';

const ORIGIN = process.env.CORS_ORIGIN || '*';

const googleApiKey = process.env.GOOGLE_API_KEY;
if (!googleApiKey) throw new Error('Falta GOOGLE_API_KEY');
const gen = new GoogleGenerativeAI(googleApiKey);
const embedModel = gen.getGenerativeModel({ model: 'text-embedding-004' });

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
  const text: string = payload?.text;
  if (!text) {
    res.statusCode = 422;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ message: 'Invalid request: missing "text"' }));
  }

  try {
    const { embedding } = await embedModel.embedContent(text);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ provider: 'gemini', dims: embedding.values.length, embedding: embedding.values }));
  } catch (e: any) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Embedding failed', detail: e?.message }));
  }
}