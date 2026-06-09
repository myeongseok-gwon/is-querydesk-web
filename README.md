# QueryDesk (web)

A public, **fully static** semantic-search workbench over the Information
Systems literature corpus — journals, conferences, and preprints — ranked by
meaning, running **entirely in your browser**. Sign in to save query streams,
pin papers, attach your own sources, and keep notes (synced to your account).

🔎 No server: query embedding (bge-small via transformers.js) and cosine ranking
happen client-side over shipped int8 embeddings. Auth is Clerk; per-user data is
in Supabase (row-level-security per user).

## Stack
- **Frontend:** Vite + vanilla JS (`src/`), deployed to GitHub Pages.
- **Search:** `@huggingface/transformers` with `Xenova/bge-small-en-v1.5` (384-dim),
  over `public/data/emb_int8.bin` (int8) + `public/data/papers.slim.jsonl.gz`.
- **Auth:** Clerk (hotloaded `clerk.browser.js`).
- **Sync:** Supabase (`streams` / `external_papers` / `pins`), RLS keyed to the
  Clerk user id via Clerk↔Supabase third-party auth.

## Develop
```bash
npm install
npm run dev      # http://localhost:5173  (needs .env.local with VITE_ keys)
```
`.env.production` holds the public Clerk/Supabase keys used by the build. The
Clerk **secret** key is never committed (only in gitignored `.env.local`, and the
static app never uses it).

## Data pipeline (`data-gen/`)
The shipped dataset is regenerated from the local IS corpus:
1. export the abstract-bearing slim records → `data-gen/papers.slim.jsonl` (staging),
2. gzip → `public/data/papers.slim.jsonl.gz`,
3. `node data-gen/embed.mjs` → `public/data/emb_int8.bin` + `meta.json` (resumable).

A daily job re-runs this and `git push`es; GitHub Actions rebuilds and redeploys.

## Supabase setup
Run `supabase/schema.sql` once in the Supabase SQL editor (tables + RLS).

## Scope
Only papers **with abstracts** are searchable. Preprint coverage is sparse by
design and meant to be topped up per-query via your own added sources
(DOI / arXiv / Zotero), whose metadata is fetched from OpenAlex/Crossref or
parsed from your paste — never generated.
