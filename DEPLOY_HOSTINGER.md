# Deploying MenoVerdict to Hostinger

The site is a Next.js app run with Node.js. Every public page is prerendered, so it needs no database, AI key or email key to run. You need a Hostinger plan that supports **Node.js applications** (Business or Cloud web hosting, or a VPS).

## 1. Environment variables

Set these in the Node.js application settings in hPanel (or in a `.env.local` file in the app folder, never committed):

```bash
SITE_ENV=production
SITE_URL=https://menoverdict.com
SITE_NAME=MenoVerdict
CONTACT_EMAIL=          # your public contact address (required)
LEGAL_ENTITY=           # the legal name of the operator (required)
CRON_SECRET=            # a long random string (required for the deletion job)
FEATURE_LOGIN=false     # keep false until real sign-in and a database exist
FEATURE_AI_PROMOTION=false
FEATURE_APP_DOWNLOAD_PROMOTION=false
```

Optional, when you have them: `GEMINI_API_KEY` or `AI_API_KEY`, `EMAIL_PROVIDER`, `RESEND_API_KEY`. The full list with comments is in `.env.example`.

## 2. Deploy the app

1. In hPanel go to **Websites → menoverdict.com → Advanced → Git**, add the repository `https://github.com/Bilalabbasid/women.git` and the branch with the latest work (currently `site-rebuild`), then **Create**.
2. Go to **Advanced → Node.js → Create application**:
   - Node.js version: **22.x** (the project needs 20.9 or later)
   - Application mode: **Production**
   - Application root: the folder Git pulled into
   - Application URL: `menoverdict.com`
   - Startup file / command: `npm start`
3. In the hPanel terminal (or SSH), in the application root:
   ```bash
   npm ci
   npm run build
   ```
   The build runs the content checks first and stops if any fail.
4. Back in **Node.js**, click **Restart**.

## 3. Connect menoverdict.com (Namecheap)

The domain is registered at Namecheap. Point it at Hostinger:

1. In hPanel, open the website and find the DNS details Hostinger asks for. It shows either **nameservers** (for example under **Domains → Domain portfolio** or the website's **DNS / Nameservers** page) or the **A record IP** and `www` record for your plan. **Copy the exact values from hPanel.** Don't use values from this guide; they differ by account and server.
2. In Namecheap: **Domain List → Manage** (next to menoverdict.com).
   - If Hostinger gave **nameservers**: under **Nameservers** choose **Custom DNS**, paste each Hostinger nameserver, and save. Hostinger then manages the DNS records.
   - If Hostinger gave **records**: open **Advanced DNS**, delete the parking records (usually a `CNAME` for `www` to `parkingpage.namecheap.com` and a `URL Redirect Record` for `@`), then add the `A` record for `@` and the record for `www` exactly as hPanel shows them.
3. Wait for DNS to update (minutes to a few hours; nameserver changes can take up to 24–48 hours).
4. In hPanel, open **Security → SSL** for menoverdict.com and install the free SSL certificate, then turn on **Force HTTPS**.
5. Make sure both `menoverdict.com` and `www.menoverdict.com` reach the app. The app itself redirects `www` to `https://menoverdict.com` in one hop.

## 4. Daily data deletion

In **Advanced → Cron Jobs**, add a daily job:

```bash
curl -s -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://menoverdict.com/api/cron/data-deletion/ > /dev/null 2>&1
```

Replace `YOUR_CRON_SECRET` with the value you set. Without `CRON_SECRET` the endpoint refuses to run.

## 5. Check the deployment

Open each and confirm it loads over HTTPS:

- `https://menoverdict.com/`
- `https://www.menoverdict.com/symptoms/` → lands on `https://menoverdict.com/symptoms/` in one redirect
- `https://menoverdict.com/sitemap.xml` (every URL starts with `https://menoverdict.com/`)
- `https://menoverdict.com/robots.txt` (ends with `Sitemap: https://menoverdict.com/sitemap.xml`)
- `https://menoverdict.com/feed.xml`
- `https://menoverdict.com/tools/symptom-tracker/`

Then submit the sitemap in Google Search Console and Bing Webmaster Tools (`audit/OWNER_TODO.md`).
