#!/usr/bin/env node
/**
 * kie.ai image generator for the Edition Rent assets.
 *
 * Reads prompts from tools/images.config.json, sends each to the kie.ai
 * async jobs API, polls until the image is ready, and downloads it into
 * ./assets/. The generated image files are what the HTML/CSS reference —
 * your API key NEVER ends up in any committed file or in the browser.
 *
 * Requirements: Node 18+ (uses built-in fetch). No npm install needed.
 *
 * Usage:
 *   KIE_API_KEY=sk-... node tools/generate-images.mjs            # generate missing
 *   KIE_API_KEY=sk-... node tools/generate-images.mjs --force    # regenerate all
 *   KIE_API_KEY=sk-... node tools/generate-images.mjs --only hero # one image
 *   node tools/generate-images.mjs --dry-run                     # print plan, no calls
 *
 * The key is read from the KIE_API_KEY environment variable. Put it in a
 * local .env (gitignored) or export it in your shell. Do not paste it here.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS_DIR = join(ROOT, 'assets');
const CONFIG_PATH = join(__dirname, 'images.config.json');

const API_BASE = 'https://api.kie.ai/api/v1/jobs';
const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 min per image
const CONCURRENCY = 3;

// ---- args ----------------------------------------------------------------
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');
const onlyIdx = args.indexOf('--only');
const ONLY = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

const KEY = process.env.KIE_API_KEY;

// ---- helpers -------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function authHeaders() {
  return {
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  };
}

async function createTask(item) {
  const body = {
    model: item.model,
    input: {
      prompt: item.prompt,
      output_format: item.output_format ?? 'png',
      image_size: item.image_size ?? '16:9',
      ...(item.input ?? {}),
    },
  };
  const res = await fetch(`${API_BASE}/createTask`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.code !== 200 || !json?.data?.taskId) {
    throw new Error(
      `createTask failed for "${item.name}": HTTP ${res.status} ${JSON.stringify(json)}`
    );
  }
  return json.data.taskId;
}

async function pollTask(taskId, name) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const res = await fetch(`${API_BASE}/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
      headers: authHeaders(),
    });
    const json = await res.json().catch(() => ({}));
    const data = json?.data ?? {};
    const state = String(data.state ?? '').toLowerCase();

    if (state === 'success') {
      // resultJson is usually a JSON-encoded string; sometimes already an object.
      let result = data.resultJson;
      if (typeof result === 'string') {
        try { result = JSON.parse(result); } catch { /* leave as-is */ }
      }
      const urls = result?.resultUrls || result?.resultUrl || data.resultUrls;
      const url = Array.isArray(urls) ? urls[0] : urls;
      if (!url) throw new Error(`"${name}": success but no result URL in ${JSON.stringify(data)}`);
      return url;
    }
    if (state === 'fail' || state === 'failed' || state === 'error') {
      throw new Error(`"${name}": generation failed: ${data.failMsg || JSON.stringify(data)}`);
    }
    // states like 'waiting' | 'queuing' | 'generating' -> keep polling
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`"${name}": timed out after ${POLL_TIMEOUT_MS / 1000}s`);
}

async function download(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed (${res.status}) for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
  return buf.length;
}

async function generateOne(item) {
  const ext = (item.output_format ?? 'png').toLowerCase();
  const file = `${item.name}.${ext}`;
  const dest = join(ASSETS_DIR, file);

  if (!FORCE && existsSync(dest)) {
    console.log(`• skip   ${file} (exists — use --force to regenerate)`);
    return { name: item.name, file, status: 'skipped' };
  }

  console.log(`→ start  ${file}  [${item.model}]`);
  const taskId = await createTask(item);
  console.log(`  task   ${file}  id=${taskId}`);
  const url = await pollTask(taskId, item.name);
  const bytes = await download(url, dest);
  console.log(`✓ done   ${file}  (${(bytes / 1024).toFixed(0)} KB)`);
  return { name: item.name, file, status: 'generated', sourceUrl: url };
}

// Simple concurrency-limited map.
async function runPool(items, worker, limit) {
  const results = [];
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await worker(items[idx]);
      } catch (err) {
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
    console.log(`Dry run — ${items.length} image(s) would be generated:\n`);
    for (const it of items) {
      console.log(`  ${it.name}.${it.output_format ?? 'png'}  [${it.model} ${it.image_size ?? '16:9'}]`);
      console.log(`    "${it.prompt.slice(0, 100)}${it.prompt.length > 100 ? '…' : ''}"`);
    }
    return;
  }

  if (!KEY) {
    console.error(
      'Missing KIE_API_KEY. Set it in your environment first, e.g.:\n' +
      '  export KIE_API_KEY="your-rotated-key"\n' +
      'or run:  KIE_API_KEY=... node tools/generate-images.mjs'
    );
    process.exit(1);
  }

  await mkdir(ASSETS_DIR, { recursive: true });
  console.log(`Generating ${items.length} image(s) into ./assets …\n`);

  const results = await runPool(items, generateOne, CONCURRENCY);

  // Write/refresh a manifest the HTML can use to know what exists — but only
  // if something actually landed on disk, so failed runs don't churn the file.
  const usable = results.filter((r) => r.status === 'generated' || r.status === 'skipped');
  if (usable.length > 0) {
    const manifestPath = join(ASSETS_DIR, 'manifest.json');
    let prev = {};
    if (existsSync(manifestPath)) {
      try { prev = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { /* ignore */ }
    }
    const manifest = { generatedAt: new Date().toISOString(), images: { ...prev.images } };
    for (const r of usable) manifest.images[r.name] = { file: r.file };
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  }

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
