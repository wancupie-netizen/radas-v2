# PC-009 â€” Vercel Deployment

## Build settings

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`
- Root directory: repository root

## Required Vercel environment variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Apply both variables to Production, Preview and Development.

`OPENAI_API_KEY` must not be stored in Vercel. It remains a Supabase Edge Function secret.

## Verification

1. Login
2. Dashboard live counts
3. Research Library
4. Direct refresh on a `/research/:slug` URL
5. Admin Studio CRUD and image upload
6. AI generation and review
7. Publish a research