import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function parseEnv(filePath) {
  try {
    return Object.fromEntries(
      readFileSync(filePath, 'utf8')
        .split('\n')
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const idx = line.indexOf('=');
          return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
        }),
    );
  } catch {
    return {};
  }
}

const env = { ...parseEnv(resolve(ROOT, 'backend/.env')), ...process.env };

const ENDPOINT = env.AZURE_TTS_ENDPOINT;
const API_KEY = env.AZURE_TTS_API_KEY;
const API_VERSION = env.AZURE_TTS_API_VERSION || env.AZURE_OPENAI_API_VERSION;
const DEPLOYMENT = env.AZURE_OPENAI_DEPLOYMENT_TTS;

if (!ENDPOINT || !API_KEY || !API_VERSION || !DEPLOYMENT) {
  console.error(
    'Missing env vars: AZURE_TTS_ENDPOINT, AZURE_TTS_API_KEY, AZURE_OPENAI_API_VERSION, AZURE_OPENAI_DEPLOYMENT_TTS',
  );
  process.exit(1);
}

const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
const PREVIEW_TEXT = "Hi, I'll be narrating your story today. Let's dive in.";
const OUT_DIR = resolve(ROOT, 'frontend/public/voices');

mkdirSync(OUT_DIR, { recursive: true });

for (const voice of VOICES) {
  console.log(`Generating preview for: ${voice}`);
  const url = `${ENDPOINT}/openai/deployments/${DEPLOYMENT}/audio/speech?api-version=${API_VERSION}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: DEPLOYMENT, input: PREVIEW_TEXT, voice, response_format: 'mp3' }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`  ✗ Failed for ${voice}: ${response.status} - ${error}`);
    continue;
  }

  const buffer = await response.arrayBuffer();
  const outPath = resolve(OUT_DIR, `${voice}.mp3`);
  writeFileSync(outPath, Buffer.from(buffer));
  console.log(`  ✓ Saved ${outPath}`);
}

console.log('Done.');
