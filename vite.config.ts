import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

function geminiServerProxyPlugin(): Plugin {
  return {
    name: 'gemini-server-proxy',
    configureServer(server) {
      server.middlewares.use('/api/gemini', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: { code: 405, message: 'Method Not Allowed' } }));
          return;
        }

        const env = loadEnv('development', process.cwd(), '');
        const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: {
                code: 500,
                message: 'GEMINI_API_KEY is not configured on the server. Please check your .env file.'
              }
            })
          );
          return;
        }

        const urlObj = new URL(req.url || '', 'http://localhost');
        const modelQuery = urlObj.searchParams.get('model');
        const pathPart = urlObj.pathname.replace(/^\//, '');
        const targetPath = modelQuery
          ? `models/${modelQuery.replace(/^models\//, '')}:generateContent`
          : pathPart || 'models/gemini-2.5-flash:generateContent';
        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/${targetPath}?key=${apiKey.trim()}`;

        // Collect incoming request body
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const bodyBuffer = Buffer.concat(chunks);

        try {
          const upstreamRes = await fetch(targetUrl, {
            method: 'POST',
            headers: {
              'Content-Type': req.headers['content-type'] || 'application/json'
            },
            body: bodyBuffer
          });

          const resData = await upstreamRes.text();
          res.statusCode = upstreamRes.status;
          res.setHeader('Content-Type', 'application/json');
          // Redact any accidental reflection of the API key
          const safeData = resData.replace(new RegExp(apiKey, 'g'), '[REDACTED_API_KEY]');
          res.end(safeData);
        } catch (fetchErr: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: {
                code: 502,
                message: `Network error connecting to Gemini API: ${fetchErr?.message || 'Upstream gateway error'}`
              }
            })
          );
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), geminiServerProxyPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}']
  }
});
