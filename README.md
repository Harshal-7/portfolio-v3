# Portfolio V3

Harshal Shinde's personal site: full-stack and AI apps, with Evenor and Life Vault as the featured work.

There are two designs, and the site shows one at a time:

- **Notebook**: Fraunces headings with Inter body text, the Indigo palette, a paper-grain background, a pull-cord light bulb for light/dark, and large project tiles.
- **Pixel**: Pixelify Sans headings with Geist body text, the same Indigo palette, twinkling pixel sparkles, an LED ticker, and a bulb that bursts into pixels.

The admin page at `/admin` (or press Ctrl + H on the site) switches the design, sets the default light/dark mode, shows or hides sections, edits the text and uploads a new résumé. It takes two passwords: one to sign in, and a second one before any change is saved. The second one keeps saving unlocked for 15 minutes.

## Stack

Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind v4, Upstash Redis for the content and admin sessions, and Vercel Blob for the résumé PDF. Vercel Web Analytics (cookieless) counts visits to the public pages only; turn it on in the Vercel project's Analytics tab.

The home page is prerendered. Site content is one JSON document in Redis, read through a `'use cache'` function tagged `site`; an admin save calls `updateTag('site')`, so the next visit gets the new content.

## Run it locally

```bash
pnpm install
cp .env.example .env.local   # then fill it in, or set SITE_STORE=file
pnpm dev                      # http://localhost:3000
```

The admin cookie is marked Secure. Browsers treat `http://localhost` as secure, so it works locally without a certificate.

With `SITE_STORE=file` the content lives in `.data/site.json` and admin sessions and rate limits stay in memory, so you can try the admin page without any accounts. You still need `ADMIN_SESSION_SECRET`, `ADMIN_PASSWORD_HASH` and `ADMIN_SAVE_PASSWORD_HASH`.

## Admin secrets

```bash
pnpm admin:secrets   # prints a random ADMIN_SESSION_SECRET
pnpm admin:hash      # asks for both passwords and prints both hashes
```

The hashes use `:` between their parts, so they are safe to paste into `.env` files. Only the hashes are stored, never the passwords. Each password allows 5 tries per 15 minutes per IP.

## Checks

```bash
pnpm check   # typecheck, eslint, vitest and a production build
```
