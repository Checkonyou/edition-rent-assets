# Connecting to kie.ai for image generation

This repo generates the Edition Rent site imagery with the [kie.ai](https://kie.ai)
API. Images are generated **once into `/assets`** and the HTML/CSS reference those
local files — so your API key is never exposed in the browser or committed to git.

## How it works

```
images.config.json  →  generate-images.mjs  →  kie.ai API  →  /assets/*.jpeg  →  gallery.html / site
   (prompts)            (Node, no deps)        (your key)     (committed)        (references files)
```

kie.ai is async: the script POSTs each prompt to `…/jobs/createTask`, gets a
`taskId`, polls `…/jobs/recordInfo?taskId=…` until it succeeds, then downloads
the resulting image.

## One-time setup

1. **Get a key** (and rotate the one you shared in chat — treat it as burned):
   kie.ai dashboard → API keys.
2. **Store it locally, never in code:**
   ```bash
   cp .env.example .env
   # edit .env and paste your real key
   set -a; source .env; set +a      # load KIE_API_KEY into your shell
   ```
   `.env` is gitignored.

## Generate images

```bash
node tools/generate-images.mjs --dry-run     # preview the plan, no API calls, no key needed
node tools/generate-images.mjs               # generate any missing images
node tools/generate-images.mjs --only hero   # generate just one
node tools/generate-images.mjs --force       # regenerate everything
```

Output lands in `/assets/`, plus an `assets/manifest.json` index.

## Preview

Open `gallery.html` in a browser (or `python3 -m http.server` then visit it).
Cards show the generated images; any not-yet-generated show a placeholder.

## Editing what gets generated

Edit `tools/images.config.json`. Each entry:

```json
{
  "name": "hero",               // → assets/hero.jpeg
  "model": "google/nano-banana",// fast + cheap default
  "image_size": "16:9",         // "16:9" | "4:3" | "3:4" | "1:1"
  "output_format": "jpeg",      // "jpeg" | "png"
  "prompt": "…"
}
```

Model slugs and parameters: <https://kie.ai/market/text-to-image>.
Common choices: `google/nano-banana` (default), `google/nano-banana-pro`,
`flux-kontext-pro`.

## Security notes

- The key lives only in your env / `.env` (gitignored). It is **never** read by
  any HTML file or shipped to the browser.
- If a key ever appears in chat, a commit, or a screenshot, **rotate it.**
