const http = require('http');
const { spawn } = require('child_process');

async function testServer() {
  process.env.PORT = '3005';
  const serverProcess = spawn('node', ['server.cjs'], {
    env: { ...process.env, PORT: '3005' },
    stdio: 'pipe'
  });

  serverProcess.stdout.on('data', (d) => console.log('SERVER:', d.toString().trim()));
  serverProcess.stderr.on('data', (d) => console.error('SERVER ERR:', d.toString().trim()));

  await new Promise((r) => setTimeout(r, 1500));

  try {
    // 1. Test static HTML response
    const htmlRes = await fetch('http://localhost:3005/');
    console.log('GET / status:', htmlRes.status);
    const htmlText = await htmlRes.text();
    console.log('HTML contains root div?', htmlText.includes('id="root"'));

    // 2. Test Gemini API proxy with probe payload
    const proxyRes = await fetch('http://localhost:3005/api/gemini/models/gemini-3.5-flash-lite:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with exactly: PONG' }] }]
      })
    });
    console.log('POST /api/gemini status:', proxyRes.status);
    const proxyJson = await proxyRes.json();
    const replyText = proxyJson.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Gemini Live Proxy Reply:', replyText?.trim());
    
    if (htmlRes.status === 200 && proxyRes.status === 200 && replyText) {
      console.log('✅ PRODUCTION SERVER TEST PASSED COMPLETELY!');
    } else {
      console.error('❌ PRODUCTION SERVER TEST FAILED');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    serverProcess.kill();
  }
}

testServer();
