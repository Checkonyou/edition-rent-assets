#!/usr/bin/env node
/**
 * Higgsfield (Soul) image generator for the Edition Rent assets — build-time.
 *
 * Reads prompts from tools/images.higgsfield.json, generates each with the
 * Higgsfield "Soul" text-to-image model via the official SDK, and downloads
 * the result into ./assets/. The generated files are what the site references;
 * your Higgsfield credentials NEVER touch any committed file or the browser.
 *
 * Setup:
 *   npm install                       # restores @higgsfield/client (see package.json)
 *   export HF_CREDENTIALS="KEY_ID:KEY_SECRET"   # from cloud.higgsfield.ai → API keys
 *
 * Usage:
 *   node tools/generate-higgsfield.mjs            # generate missing
 *   node tools/generate-higgsfield.mjs --force    # regenerate all
 *   node tools/generate-higgsfield.mjs --only hero
 *   node tools/generate-higgsfield.mjs --dry-run  # no calls, no creds needed
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS_DIR = join(ROOT, 'assets');
const CONFIG_PATH = join(__dirname, 'images.higgsfield.json');
const SOUL_ENDPOINT = '/v1/text2image/soul';
const CONCURRENCY = 2; // Soul jobs are heavier; keep it gentle

// ---- args ----------------------------------------------------------------
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');
const onlyIdx = args.indexOf('--only');
const ONLY = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

const CREDS = process.env.HF_CREDENTIALS
  || (process.env.HF_API_KEY && process.env.HF_API_SECRET
        ? `${process.env.HF_API_KEY}:${process.env.HF_API_SECRET}`
        : null);

// ---- helpers -------------------------------------------------------------
const EXT_BY_TYPE = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
  'image/webp': 'webp', 'image/avif': 'avif',
};

async function loadClient() {
  // SDK is published as CommonJS; support both ESM-interop shapes.
  const mod = await import('@higgsfield/client/v2');
  const ns = mod.default ?? mod;
  const createHiggsfieldClient = ns.createHiggsfieldClient ?? mod.createHiggsfieldClient;
  if (typeof createHiggsfieldClient !== 'function') {
    throw new Error('Could not load createHiggsfieldClient from @higgsfield/client/v2');
  }
  return createHiggsfieldClient({ credentials: CREDS });
}

async function download(url, basePathNoExt, fallbackExt) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed (${res.status}) for ${url}`);
  const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const ext = EXT_BY_TYPE[type] || fallbackExt || 'jpg';
  const buf = Buffer.from(await res.arrayBuffer());
  const file = `${basePathNoExt}.${ext}`;
  await writeFile(join(ASSETS_DIR, file), buf);
  return { file, bytes: buf.length };
}

function fileExistsForName(name) {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'avif']) {
    if (existsSync(join(ASSETS_DIR, `${name}.${ext}`))) return `${name}.${ext}`;
  }
  return null;
}

async function generateOne(client, item) {
  const existing = fileExistsForName(item.name);
  if (!FORCE && existing) {
    console.log(`• skip   ${existing} (exists — use --force to regenerate)`);
    return { name: item.name, file: existing, status: 'skipped' };
  }

  console.log(`→ start  ${item.name}  [Soul ${item.width_and_height} ${item.quality}]`);
  const jobSet = await client.subscribe(SOUL_ENDPOINT, {
    input: {
      prompt: item.prompt,
      width_and_height: item.width_and_height ?? '2048x1152',
      quality: item.quality ?? '1080p',
      batch_size: 1,
      enhance_prompt: item.enhance_prompt ?? true,
      ...(item.seed != null ? { seed: item.seed } : {}),
      ...(item.style_id ? { style_id: item.style_id } : {}),
      ...(item.style_strength != null ? { style_strength: item.style_strength } : {}),
    },
    withPolling: true,
  });

  if (jobSet.isNsfw) throw new Error(`"${item.name}": rejected by moderation (nsfw)`);
  if (jobSet.isFailed || !jobSet.isCompleted) {
    throw new Error(`"${item.name}": generation did not complete (status: ${jobSet.status ?? 'unknown'})`);
  }
  const url = jobSet.jobs?.[0]?.results?.raw?.url;
  if (!url) throw new Error(`"${item.name}": completed but no image URL returned`);

  const { file, bytes } = await download(url, item.name, 'jpg');
  console.log(`✓ done   ${file}  (${(bytes / 1024).toFixed(0)} KB)`);
  return { name: item.name, file, status: 'generated', sourceUrl: url };
}

async function runPool(items, worker, limit) {
  const results = [];
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try { results[idx] = await worker(items[idx]); }
      catch (err) {
        console.error(`✗ error  ${items[idx].name}: ${err.message}`);
        results[idx] = { name: items[idx].name, status: 'error', error: err.message };
      }
    }
  });
  await Promise.all(runners);
  return results;
}

// ---- main ----------------------------------------------------------------
async function main() {
  const config = JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
  let items = config.images ?? [];
  if (ONLY) items = items.filter((x) => x.name === ONLY);
  if (items.length === 0) {
    console.error(ONLY ? `No image named "${ONLY}" in config.` : 'No images in config.');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log(`Dry run — ${items.length} Soul image(s) would be generated:\n`);
    for (const it of items) {
      console.log(`  ${it.name}  [${it.width_and_height ?? '2048x1152'} ${it.quality ?? '1080p'}]`);
      console.log(`    "${it.prompt.slice(0, 100)}${it.prompt.length > 100 ? '…' : ''}"`);
    }
    return;
  }

  if (!CREDS) {
    console.error(
      'Missing Higgsfield credentials. Set them first:\n' +
      '  export HF_CREDENTIALS="KEY_ID:KEY_SECRET"\n' +
      '(get them at cloud.higgsfield.ai → API keys)'
    );
    process.exit(1);
  }

  const client = await loadClient();
  await mkdir(ASSETS_DIR, { recursive: true });
  console.log(`Generating ${items.length} image(s) with Higgsfield Soul into ./assets …\n`);

  const results = await runPool(items, (it) => generateOne(client, it), CONCURRENCY);

  // Refresh the shared manifest (same shape the kie.ai script uses).
  const manifestPath = join(ASSETS_DIR, 'manifest.json');
  let prev = {};
  if (existsSync(manifestPath)) {
    try { prev = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { /* ignore */ }
  }
  const manifest = { generatedAt: new Date().toISOString(), provider: 'higgsfield-soul', images: { ...prev.images } };
  for (const r of results) {
    if (r.status === 'generated' || r.status === 'skipped') manifest.images[r.name] = { file: r.file };
  }
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  const ok = results.filter((r) => r.status === 'generated').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const failed = results.filter((r) => r.status === 'error').length;
  console.log(`\nSummary: ${ok} generated, ${skipped} skipped, ${failed} failed.`);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
