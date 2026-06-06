# Generating site images with Higgsfield (Soul)

Build-time image generation for the Edition Rent site using Higgsfield's
**Soul** text-to-image model. Images are generated **once into `/assets`** and the
HTML/CSS reference those static files — your Higgsfield credentials never appear
in the browser or in git.

```
images.higgsfield.json → generate-higgsfield.mjs → Higgsfield Soul API → /assets/*.{jpg,png} → gallery.html / site
   (prompts)               (Node + official SDK)     (your credentials)    (committed)          (references files)
```

## One-time setup

1. **Install the SDK** (restores `@higgsfield/client` from `package.json`):
   ```bash
   npm install
   ```
2. **Get credentials** at <https://cloud.higgsfield.ai> → **API keys**. Higgsfield
   keys are a **pair**: a key id and a key secret.
3. **Store them as an env var — never in code:**
   ```bash
   cp .env.example .env
   # edit .env: set HF_CREDENTIALS="KEY_ID:KEY_SECRET"
   set -a; source .env; set +a
   ```
   `.env` is gitignored.

## Generate

```bash
npm run generate:higgsfield                 # generate any missing images
node tools/generate-higgsfield.mjs --only hero
node tools/generate-higgsfield.mjs --force  # regenerate everything
node tools/generate-higgsfield.mjs --dry-run  # preview, no creds needed
```

Files land in `/assets/` (extension auto-detected from the response), plus an
`assets/manifest.json` index.

## Preview

Open `gallery.html` (double-click, or `python3 -m http.server` then visit it).
It tries `jpg/jpeg/png/webp` for each image and shows a placeholder for any not
yet generated.

## Editing prompts / sizes

Edit `tools/images.higgsfield.json`. Each entry:

```json
{
  "name": "hero",              // → assets/hero.<detected-ext>
  "width_and_height": "2048x1152",  // landscape; portrait: "1536x2048"; square: "1536x1536"
  "quality": "1080p",          // "720p" | "1080p"
  "prompt": "…",
  "enhance_prompt": true        // optional; auto-improves the prompt
}
```

Sizes available (from the SDK): landscape `2048x1152` / `2048x1536`, portrait
`1536x2048` / `1152x2048`, square `1536x1536`, and mixed `1536x1152` / `1152x1536`.

## How the API call works (under the hood)

The SDK's v2 client authenticates with `Authorization: Key KEY_ID:KEY_SECRET`,
POSTs to `/v1/text2image/soul`, and polls `/requests/{id}/status` until
`completed`. The result image URL is read from `jobSet.jobs[0].results.raw.url`
and downloaded to `/assets`.

## Security

- Credentials live only in your env / `.env` (gitignored). They are never read
  by any HTML file or shipped to the browser.
- If credentials ever land in chat, a commit, or a screenshot, **rotate them.**

---

There is also a kie.ai generator (`tools/generate-images.mjs`, see
`KIE_SETUP.md`) if you want to compare providers — both write to the same
`/assets` folder and `gallery.html`.
