# Deploying MenoWell to Hostinger

This guide explains how to deploy the MenoWell Next.js website to **Hostinger**.

---

## 1. Hostinger Plan Requirements

- **Recommended Plans:** Hostinger **Business Web Hosting**, **Cloud Startup**, or any **VPS**.
- **Node.js Support:** Hostinger Web Hosting includes Node.js (via the **Node.js Selector** in hPanel). Ensure **Node.js version 20.x LTS or 22.x LTS** is selected.
- **Serverless / Standalone:** Next.js App Router runs smoothly on Hostinger with its built-in Node server or standalone server.
- **Static Content:** All public guides, hubs, and symptom pages are statically pre-rendered (SSG) at build time, ensuring maximum crawling speed and minimal server resource usage.

---

## 2. Environment Variables Configuration

In Hostinger hPanel (or via an `.env.production` file in your application root directory), configure the following environment variables:

```bash
# ---------------------------------------------------------------------------
# Required Site Configuration (DECISIONS.md D-005)
# ---------------------------------------------------------------------------
NODE_ENV=production
SITE_ENV=production
SITE_NAME=MenoWell
SITE_URL=https://yourdomain.com
CONTACT_EMAIL=support@yourdomain.com
LEGAL_ENTITY=MenoWell Ltd
EMAIL_PROVIDER=resend

# ---------------------------------------------------------------------------
# Feature Flags (Prompt 2 Defaults)
# ---------------------------------------------------------------------------
FEATURE_LOGIN=false
FEATURE_AI_PROMOTION=false
FEATURE_APP_DOWNLOAD_PROMOTION=false

# ---------------------------------------------------------------------------
# Scheduled Data Retention Job Secret
# ---------------------------------------------------------------------------
CRON_SECRET=generate-a-strong-random-secret-here
```

> **Note on Feature Flags:**
> - `FEATURE_LOGIN=false`: Keeps user login hidden while public reading, tools, and on-device storage remain 100% active. Set to `true` once your production database credentials are added.
> - `FEATURE_AI_PROMOTION=false`: Keeps AI promotion banners, pop-ups, and chat prompts disabled.
> - `FEATURE_APP_DOWNLOAD_PROMOTION=false`: Disables app download or install prompts on content pages.

---

## 3. Deployment Steps via hPanel (Git / Node.js App)

### Step 1: Push Code to Git Repository
Push your project to GitHub or GitLab.

### Step 2: Configure Git in Hostinger
1. In hPanel, navigate to **Advanced** → **Git**.
2. Add your repository URL and branch (`master` or `site-rebuild`).
3. Click **Create** to pull the files.

### Step 3: Setup Node.js in hPanel
1. Navigate to **Advanced** → **Node.js**.
2. Click **Create Application**.
3. Choose:
   - **Node.js version**: 20.x or 22.x LTS
   - **Application mode**: Production
   - **Application root**: `/public_html` (or your project folder)
   - **Application URL**: `yourdomain.com`
   - **Application startup file**: `node_modules/next/dist/bin/next` with arguments `start` (or `npm start`)
4. Save the configuration.

### Step 4: Install Dependencies and Build
Connect via SSH or use the hPanel Terminal in the project directory:
```bash
npm ci --production=false
npm run build
```
The prebuild hook runs all content and link validations before compiling static HTML pages.

### Step 5: Start the Application
In the Node.js menu in hPanel, click **Restart** (or **Start**) to launch the server. Verify your site by visiting `https://yourdomain.com`.

---

## 4. Setup Automated Daily Data Deletion (Cron Job)

Prompt 2 requires automatic deletion of expired health records at least daily. Set up a Cron job in Hostinger hPanel:

1. Navigate to **Advanced** → **Cron Jobs**.
2. Select **Custom** or **Daily (Midnight)**.
3. Enter the command:
   ```bash
   curl -s -X POST -H "Authorization: Bearer <YOUR_CRON_SECRET>" https://yourdomain.com/api/cron/data-deletion > /dev/null 2>&1
   ```
4. Click **Save**.

This calls the secured deletion endpoint daily, permanently removing records past their retention window (10, 20, 30, or 90 days).

