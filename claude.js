// Vercel serverless function: forwards the simulator's requests to the Anthropic API.
// Your API key stays on the server (set ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables).
//
// Optional environment variables:
//   ACCESS_CODE      If set, the page asks for this code before it can use Claude (stops strangers spending your credits).
//   ANTHROPIC_MODEL  Override the model, e.g. claude-sonnet-5-5.

const DEFAULT_MODEL = 'claude-sonnet-5-5';
const QUICK_MODEL = 'claude-haiku-5-5';

export default async function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;
  const accessCode = process.env.ACCESS_CODE || '';

  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, configured: Boolean(key), requiresCode: Boolean(accessCode) });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in Vercel.' });
  if (accessCode && req.headers['x-access-code'] !== accessCode) {
    return res.status(401).json({ error: 'Wrong or missing access code.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { messages, images = [], tier = 'default' } = body;
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: 'messages is required' });
  }

  // Keep only text roles the API accepts, and cap the size of each message.
  const clean = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 120000) }));
  if (!clean.length || clean[clean.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'The last message must come from the user.' });
  }

  // Attach slide images (base64 JPEG) to the first user message.
  const imgs = images.filter(x => typeof x === 'string').slice(0, 6);
  if (imgs.length) {
    const first = clean.findIndex(m => m.role === 'user');
    clean[first] = {
      role: 'user',
      content: [
        ...imgs.map(data => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } })),
        { type: 'text', text: clean[first].content },
      ],
    };
  }

  const model = process.env.ANTHROPIC_MODEL || (tier === 'quick' ? QUICK_MODEL : DEFAULT_MODEL);

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: tier === 'quick' ? 2000 : 12000, messages: clean }),
    });
    const data = await r.json();
    if (!r.ok) {
      const status = r.status === 429 || r.status === 529 ? 429 : 502;
      return res.status(status).json({ error: data?.error?.message || `Anthropic API error ${r.status}` });
    }
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return res.status(200).json({ text, truncated: data.stop_reason === 'max_tokens' });
  } catch (err) {
    return res.status(502).json({ error: 'Could not reach the Anthropic API.' });
  }
}
