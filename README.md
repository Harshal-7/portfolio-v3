# Portfolio V3

Harshal Shinde's personal site: full-stack and AI apps, with Evenor and Life Vault as the featured work.

There are two designs, and the site shows one at a time:

- **Notebook**: Fraunces headings with Inter body text, the Indigo palette, a paper-grain background, a pull-cord light bulb for light/dark, and large project tiles.
- **Pixel**: Pixelify Sans headings with Geist body text, the same Indigo palette, twinkling pixel sparkles, an LED ticker, and a bulb that bursts into pixels.

A password-protected admin page at a secret address switches the design, sets the default light/dark mode, shows or hides sections, edits the text and uploads a new résumé.

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

With `SITE_STORE=file` the content lives in `.data/site.json` and admin sessions and rate limits stay in memory, so you can try the admin page without any accounts. You still need `ADMIN_PATH`, `ADMIN_SESSION_SECRET` and `ADMIN_PASSWORD_HASH`.

## Admin secrets

```bash
pnpm admin:secrets   # prints a random ADMIN_PATH and ADMIN_SESSION_SECRET
pnpm admin:hash      # asks for a password and prints ADMIN_PASSWORD_HASH
```

The hash uses `:` between its parts, so it is safe to paste into `.env` files. The admin page is then at `/<ADMIN_PATH>`. The plain `/admin` address always returns 404.

## Checks

```bash
pnpm check   # typecheck, eslint, vitest and a production build
```
