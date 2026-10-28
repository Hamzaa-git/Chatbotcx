/**
 * Vercel Serverless Function for Live AI API Proxy
 * Securely forwards AI generation requests to the upstream AI gateway without exposing API keys to the client.
 */
export default async function handler(req, res) {
  // Enable basic CORS if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 405, message: 'Method Not Allowed' } });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: {
        code: 500,
        message: 'API key environment variable is not configured in your deployment settings. Please set GEMINI_API_KEY in your hosting dashboard.'
      }
    });
  }

  // Determine the target model and method
  let targetPath = 'models/gemini-2.5-flash:generateContent';
  if (req.query?.model) {
    const cleanModel = String(req.query.model).replace(/^models\//, '');
    targetPath = `models/${cleanModel}:generateContent`;
  } else if (req.query?.path) {
    const rawPath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    targetPath = rawPath.replace(/^\//, '');
  } else if (req.url) {
    const cleanUrl = req.url.split('?')[0].replace(/^\/api\/gemini\/?/, '');
    if (cleanUrl) {
      targetPath = cleanUrl;
    }
  }

  const targetUrl = `https://generativelanguage.googleapis.com/v1beta/${targetPath}?key=${apiKey.trim()}`;

  try {
    const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const upstreamRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload
    });

    const data = await upstreamRes.json();
    return res.status(upstreamRes.status).json(data);
  } catch (error) {
    return res.status(502).json({
      error: {
        code: 502,
        message: `Network error connecting to AI Gateway: ${error?.message || 'Gateway error'}`
      }
    });
  }
}
