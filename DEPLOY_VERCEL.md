# Deploying MenoVerdict to Vercel

The site is a Next.js app. Every public page is prerendered, so it needs no database, AI key or email key to run.

## 1. Create the project

1. Sign in to [Vercel](https://vercel.com/) and choose **Add New… → Project**.
2. Import the GitHub repository `Bilalabbasid/women` (branch with the latest work, currently `site-rebuild`).
3. Framework preset: **Next.js** (detected automatically). Root directory: `./`.
4. Build command: `npm run build`. Install command: `npm ci`.

## 2. Environment variables

In **Project → Settings → Environment Variables**, add these for the **Production** environment. Leave Preview with no `SITE_ENV`: Vercel previews are noindex automatically.

| Name | Value | Notes |
|---|---|---|
| `SITE_ENV` | `production` | Makes pages indexable |
| `SITE_URL` | `https://menoverdict.com` | Every canonical, sitemap and social URL uses this. Never a `vercel.app` address |
| `SITE_NAME` | `MenoVerdict` | |
| `CONTACT_EMAIL` | your public contact address | Required for production |
| `LEGAL_ENTITY` | the legal name of the operator | Required for production |
| `CRON_SECRET` | a long random string | Required: the data-deletion job refuses to run without it |
| `FEATURE_LOGIN` | `false` | Keep false. Accounts need a real database and sign-in first (see `src/lib/account/guard.ts`) |
| `FEATURE_AI_PROMOTION` | `false` | |
| `FEATURE_APP_DOWNLOAD_PROMOTION` | `false` | |

Optional, when you have them: `GEMINI_API_KEY` or `AI_API_KEY`, `EMAIL_PROVIDER` and `RESEND_API_KEY`. The full list with comments is in `.env.example`.

Click **Deploy**.

## 3. Connect menoverdict.com (Namecheap)

1. In Vercel, open **Project → Settings → Domains** and add both `menoverdict.com` and `www.menoverdict.com`.
2. Set `menoverdict.com` as the primary domain and `www.menoverdict.com` to redirect to it (the app also redirects www → apex in one hop).
3. Vercel now shows the DNS records each domain needs. **Copy the exact values from that screen.** Don't use values from this guide or elsewhere, because Vercel can change them.
4. In Namecheap: **Domain List → Manage** (next to menoverdict.com) **→ Advanced DNS**.
5. Delete the parking records Namecheap adds by default (usually a `CNAME` for `www` to `parkingpage.namecheap.com` and a `URL Redirect Record` for `@`).
6. Under **Host Records**, add each record Vercel showed you: same **Type**, **Host** (`@` for the root, `www` for www) and **Value**. Leave TTL as Automatic.
7. Save. Back in Vercel, wait until both domains show **Valid Configuration**. DNS can take from minutes to a few hours.
8. Vercel issues the HTTPS certificate automatically.

## 4. Daily data deletion

`vercel.json` already schedules `/api/cron/data-deletion` daily. Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically when `CRON_SECRET` is set.

## 5. Check the deployment

Open each of these and confirm it loads over HTTPS on `menoverdict.com`:

- `https://menoverdict.com/`
- `https://www.menoverdict.com/symptoms/` → should land on `https://menoverdict.com/symptoms/` in one redirect
- `https://menoverdict.com/sitemap.xml` (every URL starts with `https://menoverdict.com/`)
- `https://menoverdict.com/robots.txt` (ends with `Sitemap: https://menoverdict.com/sitemap.xml`)
- `https://menoverdict.com/feed.xml`
- `https://menoverdict.com/tools/symptom-tracker/`

Then submit the sitemap in Google Search Console and Bing Webmaster Tools (`audit/OWNER_TODO.md`).
