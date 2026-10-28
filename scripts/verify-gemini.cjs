/**
 * Independent Gemini API Connectivity & Health Diagnostic
 * Usage: node scripts/verify-gemini.cjs
 *
 * Verifies server-side connectivity to Google Gemini API using configured key and model.
 * Never prints or leaks the API key.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables securely from .env if present
const envPath = path.resolve(process.cwd(), '.env');
const envVars = {};

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > -1) {
      envVars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  }
}

const apiKey = process.env.GEMINI_API_KEY || envVars.GEMINI_API_KEY || envVars.VITE_GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || envVars.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const cleanModel = model.replace(/^models\//, '');

console.log('====================================================');
console.log('       GOOGLE GEMINI API INDEPENDENT DIAGNOSTIC     ');
console.log('====================================================');

// Step 1 & 2: Verify Configuration
if (!apiKey) {
  console.error('\n❌ DIAGNOSTIC RESULT: FAILURE');
  console.error('Root Cause: GEMINI_API_KEY environment variable is missing.');
  console.error('Please configure GEMINI_API_KEY in your .env file.');
  process.exit(1);
}

if (apiKey.trim().length === 0) {
  console.error('\n❌ DIAGNOSTIC RESULT: FAILURE');
  console.error('Root Cause: GEMINI_API_KEY is present but empty.');
  process.exit(1);
}

console.log('1. Configuration Verification:');
console.log('   - Environment Variable: GEMINI_API_KEY present (Length: ' + apiKey.length + ')');
console.log('   - Requested Model: ' + cleanModel);
console.log('   - API Endpoint: https://generativelanguage.googleapis.com/v1beta/models/' + cleanModel + ':generateContent');

// Step 3: Run Text Generation Request
const testPrompt = 'Reply with exactly: GEMINI_CONNECTION_OK';
const payload = JSON.stringify({
  contents: [{ parts: [{ text: testPrompt }] }]
});

console.log('\n2. Dispatching Connectivity Probe:');
console.log('   - Prompt: "' + testPrompt + '"');

const startTime = Date.now();
const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey.trim()}`);

const req = https.request(
  url,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    },
    timeout: 15000
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      const durationMs = Date.now() - startTime;
      const safeData = data.replace(new RegExp(apiKey, 'g'), '[REDACTED_API_KEY]');

      console.log('   - HTTP Status: ' + res.statusCode);
      console.log('   - Duration: ' + durationMs + 'ms');

      if (res.statusCode === 200) {
        try {
          const parsed = JSON.parse(safeData);
          const replyText = parsed?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          const finishReason = parsed?.candidates?.[0]?.finishReason;
          const promptTokens = parsed?.usageMetadata?.promptTokenCount;
          const candidateTokens = parsed?.usageMetadata?.candidatesTokenCount;

          console.log('\n3. Response Validation:');
          console.log('   - Model Response: "' + replyText + '"');
          console.log('   - Finish Reason: ' + finishReason);
          console.log('   - Token Usage: ' + promptTokens + ' prompt, ' + candidateTokens + ' completion');

          if (replyText.includes('GEMINI_CONNECTION_OK')) {
            console.log('\n====================================================');
            console.log('✅ DIAGNOSTIC RESULT: GEMINI_CONNECTION_OK');
            console.log('Google Gemini API is fully operational and reachable.');
            console.log('====================================================\n');
            process.exit(0);
          } else {
            console.log('\n⚠️ Valid HTTP 200 response received, but unexpected text: "' + replyText + '"');
            process.exit(0);
          }
        } catch (parseErr) {
          console.error('\n❌ Failed to parse Gemini response JSON:', parseErr.message);
          process.exit(1);
        }
      } else {
        console.error('\n❌ DIAGNOSTIC RESULT: HTTP ' + res.statusCode + ' ERROR');
        try {
          const errObj = JSON.parse(safeData);
          console.error('Error Message: ' + (errObj?.error?.message || safeData));
          console.error('Status: ' + (errObj?.error?.status || 'UNKNOWN'));
        } catch {
          console.error('Raw Error: ' + safeData);
        }
        process.exit(1);
      }
    });
  }
);

req.on('error', (err) => {
  const durationMs = Date.now() - startTime;
  console.error('\n❌ Network error after ' + durationMs + 'ms: ' + err.message);
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  console.error('\n❌ Request timed out after 15000ms');
  process.exit(1);
});

req.write(payload);
req.end();
