import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
if (!url || !/^https:\/\/[^/]+\.supabase\.co\/?$/.test(url)) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL to the Supabase project URL.');
}
if (!key || key.startsWith('sb_secret_') || key.length < 20) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (never a secret/service role key).');
}
const html = await readFile(resolve(root, 'site/index.html'), 'utf8');
await mkdir(resolve(root, 'dist'), { recursive: true });
await writeFile(resolve(root, 'dist/index.html'), html);
await writeFile(resolve(root, 'dist/config.js'), `window.CAT_CONFIG = ${JSON.stringify({url:url.replace(/\/$/,''), publishableKey:key})};\n`);
console.log('Built cat workspace static site.');
