# Deploying MenoWell to Vercel

This guide explains how to deploy the MenoWell Next.js website to **Vercel**. The exact same codebase runs identically on Vercel without code modifications.

---

## 1. Quick Deploy via Vercel Dashboard

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Sign in to [Vercel](https://vercel.com/) and click **Add New...** → **Project**.
3. Import your repository.
4. **Framework Preset:** Vercel automatically selects **Next.js**.
5. **Root Directory:** Leave as `./` (default).
6. **Build Command:** `npm run build` (runs content validation, graph checks, and SSG generation).
7. **Install Command:** `npm install` (or `npm ci`).

---

## 2. Environment Variables Configuration

In Vercel **Project Settings** → **Environment Variables**, add:

| Key | Example Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Node environment |
| `SITE_ENV` | `production` | Site environment (enforces indexable production mode) |
| `SITE_NAME` | `MenoWell` | Working site brand |
| `SITE_URL` | `https://your-domain.vercel.app` | Canonical domain (https, no trailing slash) |
| `CONTACT_EMAIL` | `hello@yourdomain.com` | Public contact address |
| `LEGAL_ENTITY` | `MenoWell Ltd` | Legal entity name |
| `EMAIL_PROVIDER` | `resend` | Consented newsletter email adapter |
| `FEATURE_LOGIN` | `false` | Turn on when connecting live DB in 1-2 weeks |
| `FEATURE_AI_PROMOTION` | `false` | Keeps AI chat popups / prompts hidden |
| `FEATURE_APP_DOWNLOAD_PROMOTION` | `false` | Keeps app download banners hidden |
| `CRON_SECRET` | `generate-a-strong-random-secret` | Authorizes scheduled cron tasks |

---

## 3. Automated Daily Data Deletion with Vercel Cron

Vercel Cron can invoke the secure deletion endpoint daily. Configure `vercel.json` in your repository root:

```json
{
  "crons": [
    {
      "path": "/api/cron/data-deletion",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Vercel automatically passes `Authorization: Bearer <CRON_SECRET>` to cron requests when `CRON_SECRET` is set in the environment variables.

---

## 4. Verifying the Deployment

1. Click **Deploy**. Vercel will run `npm run prebuild` (content and schema validation) followed by `next build`.
2. Inspect the build log: All public content pages will be listed as pre-rendered static HTML (`● (SSG)`).
3. Test key routes:
   - Homepage: `https://your-domain.vercel.app/`
   - Symptom checklist: `https://your-domain.vercel.app/tools/symptoms-checklist/`
   - Symptom tracker: `https://your-domain.vercel.app/tools/symptom-tracker/`
   - XML Sitemap: `https://your-domain.vercel.app/sitemap.xml`
   - RSS Feed: `https://your-domain.vercel.app/feed.xml`

