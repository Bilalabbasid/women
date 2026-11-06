# Phase 1 Inventory: MenoVerdict (`menoverdict.com`)

**Date of Initial Inventory:** November 6, 2026  
**Branch:** `site-rebuild` (Baseline Commit: `972bc0b`)

---

## 1. Stack & Configuration

| Attribute | Value / Finding |
|---|---|
| **Framework** | Next.js `16.4.5` (App Router, Turbopack), React `19.2.8` |
| **Rendering Mode** | Static Site Generation (`SSG` via `generateStaticParams`) for all public content pages (`/[...slug]/`), hubs, sitemap, `robots.txt`, RSS (`feed.xml`), and web manifest. Server-rendered on demand (`ƒ Dynamic`) for `/api/*` endpoints. Client-hydrated shell for private `/app/*` tracker routes. |
| **Content Source** | Local Markdown (`.md`) files in `content/pages/` with YAML frontmatter validated by Zod (`src/lib/content/schema.ts`), plus YAML registries (`content/_sources/sources.yaml`, `content/_products/products.yaml`, `content/_products/slots.yaml`, `content/_tools/*.yaml`, `content/_people/people.yaml`) and CSV plan (`content/_plan/keyword-map.csv`). |
| **Package Manager** | `npm` (`package-lock.json` present) |
| **Hosting Config** | `vercel.json` (configures daily cron `/api/cron/data-deletion` at `0 0 * * *`), `next.config.ts` (`trailingSlash: true`, strict CSP blocking third-party scripts, HSTS, `X-Robots-Tag` headers on `/app/*`, `/go/*`, `/search/*`), `DEPLOY_HOSTINGER.md`, and `DEPLOY_VERCEL.md`. |
| **Environment Variables Used** | `SITE_ENV`, `SITE_NAME`, `SITE_URL`, `CONTACT_EMAIL`, `LEGAL_ENTITY`, `EMAIL_PROVIDER`, `STAGING_USER`, `STAGING_PASSWORD`, `CONTENT_ROOT`, `FEATURE_LOGIN`, `FEATURE_AI_PROMOTION`, `FEATURE_APP_DOWNLOAD_PROMOTION`, `CRON_SECRET`. |
| **Default Domain / Brand** | **Issue Found:** `src/lib/site/config.ts` currently defaults to `SITE_NAME = 'MenoWell'` and `SITE_URL = 'http://localhost:3000'` when env vars are unset. Must be updated to `MenoVerdict` and `https://menoverdict.com`. |
| **Security Audit (`npm audit`)** | `0 critical`, `0 high`, `8 moderate` (all 8 moderate advisories are dev-only transitive dependencies in `minimatch` via `@typescript-eslint/*` and `eslint-config-next`). `0` production runtime vulnerabilities. |

---

## 2. Build, Lint, Type-Check & Test Results (Baseline)

- **`npm run lint` (`eslint`)**: **1 error, 3 warnings**:
  - `error`: `src/components/site/next-steps.tsx:63:7` — `react-hooks/set-state-in-effect` (`Calling setState synchronously within an effect can trigger cascading renders`).
  - `warning`: `scripts/validate-graph.ts:3:42` — `'SiteGraphNode' is defined but never used`.
  - `warning`: `src/lib/content/gate.ts:5:7` — `'GRADE_EXEMPT' is assigned a value but never used`.
  - `warning`: `src/lib/tools/logic.ts:109:40` — `'siteEnv' is assigned a value but never used`.
- **`npm run typecheck` (`tsc --noEmit`)**: **PASS (0 errors)**.
- **`npm test` (`vitest run`)**: **PASS (18 test suites, 94/94 tests passing)**.
- **`npm run build` (`next build`)**: **PASS (64 static/dynamic routes compiled)** with **7 Turbopack warnings** in `src/lib/tools/logic.ts` (`Dynamic filesystem access causes tracing of the whole project`).
- **`npm run validate`**:
  - `validate:content`: 0 errors, 0 warnings (notes that `symptom-tracker` and `symptoms-checklist` logic YAML status is `draft`).
  - `validate:plan`: 0 errors, 0 warnings (160 planned rows).
  - `validate:links`: 0 errors, 13 warnings (some about/evidence pages have <3 contextual links or no tool link; weak hubs on `/perimenopause/` and `/treatments/`).
  - `validate:graph`: 0 errors, 1 warning (`/treatments/hormone-therapy/boxed-warning/` has 2 outgoing internal links).
  - `validate:cta`: 0 errors, 0 warnings.
  - `validate:seo`: 0 errors, 11 warnings (title >65 chars or meta description >160 chars on 9 pages).
  - `validate:a11y`: 0 errors, 0 warnings across all 47 prerendered HTML pages.
  - `validate:privacy`: 0 errors, 0 warnings across 101 source files and 49 built HTML files.

---

## 3. Route Inventory (Production Build)

Total prerendered HTML pages inspected: **47** (plus system routes `/sitemap.xml`, `/robots.txt`, `/feed.xml`, `/manifest.webmanifest`, `/sources.json`, `/search-index.json`, `/sw.js`, and 7 `/api/*` endpoints).

### A. Public Content, Hub, Tool & Legal Pages (35 Prerendered Routes)

| URL | Type | Cluster | Status | Words | H1 | Canonical (Baseline) | JSON-LD Types |
|---|---|---|---|---:|---|---|---|
| `/` | Hub (Homepage) | `site` | `published` | 369 | What's going on with your body right now? | `http://localhost:3000/` | `Organization`, `WebSite` |
| `/perimenopause/` | Hub | `perimenopause` | `published` | 766 | Perimenopause: stages, symptoms and evidence-graded options | `http://localhost:3000/perimenopause/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/perimenopause/early-signs/` | Article (`guide`) | `perimenopause` | `published` | 1009 | Early signs of perimenopause: what to expect in your 40s | `http://localhost:3000/perimenopause/early-signs/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/perimenopause/questions-for-your-doctor/` | Article (`guide`) | `perimenopause` | `published` | 896 | What to ask your doctor about perimenopause | `http://localhost:3000/perimenopause/questions-for-your-doctor/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/symptoms/` | Hub | `symptoms` | `published` | 730 | Perimenopause and menopause symptoms | `http://localhost:3000/symptoms/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/symptoms/hot-flashes/` | Article (`symptom`) | `symptoms` | `published` | 1141 | Hot flashes in perimenopause: why they happen and what helps | `http://localhost:3000/symptoms/hot-flashes/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/symptoms/night-sweats/` | Article (`symptom`) | `symptoms` | `published` | 1586 | Night Sweats: How to Sleep Cooler Tonight | `http://localhost:3000/symptoms/night-sweats/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/symptoms/vaginal-dryness/` | Article (`symptom`) | `symptoms` | `published` | 1399 | Vaginal Dryness After Menopause: What Actually Helps | `http://localhost:3000/symptoms/vaginal-dryness/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/symptoms/painful-sex/` | Article (`symptom`) | `symptoms` | `published` | 1266 | Painful Sex in Perimenopause and Menopause: Causes and Relief | `http://localhost:3000/symptoms/painful-sex/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/symptoms/incontinence/` | Article (`symptom`) | `symptoms` | `published` | 1228 | Bladder Leaks in Menopause: Causes, Types, and What Actually Helps | `http://localhost:3000/symptoms/incontinence/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/treatments/` | Hub | `treatments` | `published` | 770 | Menopause treatments: evidence-graded options | `http://localhost:3000/treatments/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/treatments/hormone-therapy/boxed-warning/` | Article (`treatment`) | `treatments` | `published` | 1044 | The FDA HRT boxed warning change, explained | `http://localhost:3000/treatments/hormone-therapy/boxed-warning/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/does-it-work/` | Hub | `does-it-work` | `published` | 634 | Does it work? Menopause treatments tested against evidence | `http://localhost:3000/does-it-work/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/does-it-work/magnesium/` | Article (`does_it_work`) | `does-it-work` | `published` | 1006 | Does magnesium help menopause sleep and symptoms? | `http://localhost:3000/does-it-work/magnesium/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/does-it-work/cooling-products/` | Product Guide (`does_it_work`) | `does-it-work` | `published` | 1106 | Cooling Your Bed: Fans, Sheets, and Climate Systems Compared | `http://localhost:3000/does-it-work/cooling-products/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/does-it-work/exercise/` | Article (`does_it_work`) | `does-it-work` | `published` | 1116 | Strength Training Through Menopause: What the Science Shows | `http://localhost:3000/does-it-work/exercise/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/care/` | Hub | `care` | `published` | 622 | Getting Menopause Care: Options, Guides, and Daily Support | `http://localhost:3000/care/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/care/menopause-books/` | Product Guide (`guide`) | `care` | `published` | 1473 | Menopause Books Worth Reading, Chosen by Evidence | `http://localhost:3000/care/menopause-books/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/care/moisturizers-and-lubricants/` | Product Guide (`guide`) | `care` | `published` | 1416 | Vaginal Moisturiser vs Lubricant: Which Do You Need? | `http://localhost:3000/care/moisturizers-and-lubricants/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/care/pelvic-floor-exercises/` | Product Guide (`guide`) | `care` | `published` | 1222 | How to Do Pelvic Floor Exercises Correctly: A Step-by-Step Guide | `http://localhost:3000/care/pelvic-floor-exercises/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/care/sleepwear-for-night-sweats/` | Product Guide (`guide`) | `care` | `published` | 987 | Best Sleepwear for Night Sweats: How to Choose | `http://localhost:3000/care/sleepwear-for-night-sweats/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList` |
| `/tools/` | Hub (Tools) | `tools` | `published` | 190 | Tools | `http://localhost:3000/tools/` | `Organization`, `WebSite`, `BreadcrumbList`, `WebApplication` |
| `/tools/symptom-tracker/` | Tool | `tools` | `draft` (frontmatter) | 918 | Symptom tracker and doctor report | `http://localhost:3000/tools/symptom-tracker/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList`, `FAQPage` |
| `/tools/symptoms-checklist/` | Tool | `tools` | `draft` (frontmatter) | 1204 | Perimenopause symptoms checklist | `http://localhost:3000/tools/symptoms-checklist/` | `Organization`, `WebSite`, `MedicalWebPage`, `BreadcrumbList`, `FAQPage`, `WebApplication` |
| `/evidence/` | Legal / Editorial | `evidence` | `published` | 274 | How we check the evidence | `http://localhost:3000/evidence/` | `Organization`, `WebSite`, `Article`, `BreadcrumbList` |
| `/evidence/how-we-grade/` | Legal / Editorial | `evidence` | `published` | 426 | How we grade evidence | `http://localhost:3000/evidence/how-we-grade/` | `Organization`, `WebSite`, `Article`, `BreadcrumbList` |
| `/evidence/updates/` | Legal / Editorial | `evidence` | `published` | 449 | What's changed: evidence updates and corrections log | `http://localhost:3000/evidence/updates/` | `Organization`, `WebSite`, `Article`, `BreadcrumbList` |
| `/about/` | Legal / About | `site` | `published` | 291 | About us | `http://localhost:3000/about/` | `Organization`, `WebSite`, `Article`, `BreadcrumbList` |
| `/about/how-we-make-money/` | Legal / Disclosure | `site` | `published` | 483 | How we make money | `http://localhost:3000/about/how-we-make-money/` | `Organization`, `WebSite`, `Article`, `BreadcrumbList` |
| `/privacy/` | Legal | `site` | `published` | 662 | Privacy notice and health data retention policy | `http://localhost:3000/privacy/` | `Organization`, `WebSite`, `WebPage`, `BreadcrumbList` |
| `/cookies/` | Legal | `site` | `published` | 391 | Cookie policy | `http://localhost:3000/cookies/` | `Organization`, `WebSite`, `WebPage`, `BreadcrumbList` |
| `/terms/` | Legal | `site` | `published` | 390 | Terms of use | `http://localhost:3000/terms/` | `Organization`, `WebSite`, `WebPage`, `BreadcrumbList` |
| `/medical-disclaimer/` | Legal | `site` | `published` | 399 | Medical disclaimer | `http://localhost:3000/medical-disclaimer/` | `Organization`, `WebSite`, `WebPage`, `BreadcrumbList` |
| `/urgent-help/` | Legal / Safety | `site` | `published` | 385 | Urgent help and crisis lines | `http://localhost:3000/urgent-help/` | `Organization`, `WebSite`, `BreadcrumbList` |
| `/search/` | Utility (`noindex`) | `site` | `published` | 1 | Search | `http://localhost:3000/search/` | `Organization`, `WebSite` |

### B. Private App & Utility Routes (12 Prerendered Routes, all `noindex, nofollow`)
- `/app/`, `/app/today/`, `/app/check-in/`, `/app/timeline/`, `/app/treatments/`, `/app/insights/`, `/app/doctor-report/`, `/app/settings/`, `/app/onboarding/`, `/app/privacy/`, `/app/membership/`, `/offline/`.

### C. API Routes (7 Dynamic Server Routes)
- `/api/auth/login` (POST)
- `/api/cron/data-deletion` (GET/POST)
- `/api/health` (GET)
- `/api/user/consent` (GET/POST/DELETE)
- `/api/user/delete-account` (POST)
- `/api/user/export` (GET)
- `/api/user/health-data` (GET/POST/DELETE)
- *(Missing API route noticed: `EmailCapture` posts to `/api/newsletter/subscribe`, which does not exist yet — it falls back in `catch`, causing a 404 network request in browser devtools unless implemented!)*

---

## 4. Counts by Cluster, Tools, Product Blocks & Legal Pages

### A. Content Pages by Topic Cluster (31 Markdown Pages Total vs ~300 Target)
- `perimenopause`: 3 (1 hub + 2 guides)
- `menopause`: 0 (**Missing hub and articles**)
- `postmenopause`: 0 (**Missing hub and articles**)
- `symptoms`: 6 (1 hub + 5 symptom articles)
- `treatments`: 2 (1 hub + 1 article)
- `does-it-work`: 4 (1 hub + 3 verdict articles)
- `compare`: 0 (**Missing hub and telehealth comparison page**)
- `care`: 5 (1 hub + 4 buying/care guides)
- `groups`: 0 (**Missing hub and special groups articles: surgical/early menopause, cancer history**)
- `tools`: 2 (`symptom-tracker`, `symptoms-checklist`; **Missing 4 tools**: stage guide, does-it-work checker, doctor question builder, 12-month counter)
- `evidence`: 3 (`/evidence/`, `/evidence/how-we-grade/`, `/evidence/updates/`)
- `site`: 6 (`/about/`, `/about/how-we-make-money/`, `/privacy/`, `/cookies/`, `/terms/`, `/medical-disclaimer/`; **Missing**: Editorial Policy, Corrections, Contact)

### B. Product Blocks & Affiliate Links by Partner
- **Amazon Associates (9 products in `content/_products/products.yaml`, 18 rendered `<ProductBlock>` placements across 10 pages, plus 3 inline hub "Further reading" links):**
  - `blackxpace05-20`: 1 product (`replens-moisturiser` - `B000P9WSMY`, placed on 3 pages)
  - `buynow01c3-20`: 8 products (`revaree-ha` `B07GX9NQ65`, `uberlube` `B00KDHS8PO`, `elvie-trainer` `B018IFNSX4`, `cooljams-pyjamas` `B07FCZD43T`, `bedjet` `B01BMCWJ7G`, `book-menopause-manifesto` `0806540664`, `book-new-menopause` `059379625X`, `book-next-level` `B0H94P11XX`)
- **Planned Partner Slots (`content/_products/slots.yaml`):**
  - 17 generic category slots currently defined (`status: empty`), rendering "How to choose" blocks without broken links.
  - **Gap:** `slot-report.csv` and `slots.yaml` do not yet explicitly map the named planned partners required in Section G (Midi, Allara, Hers, Alloy, Blossom Health [mood pages only], Uresta [bladder leaks], Lusome, Cool-jams direct, OPAL COOL, Sesame Care).

---

## 5. No-JavaScript Test (10+ Key Pages)

Inspected the raw static HTML in `.next/server/app/` (which is served directly without JavaScript execution):
1. `/` (Homepage): Full `<title>`, `<h1>`, search form (`action="/search/" method="get"`), symptom links, stage cards, tool links, and urgent banner present in raw HTML (`369` words).
2. `/perimenopause/` (Hub): Full `<title>`, `<h1>`, body text, child links, and references (`#ref-1`, `#ref-2`) in raw HTML (`766` words).
3. `/symptoms/hot-flashes/` (Article): Full `<title>`, `<h1>`, standard notice, evidence badge, body text, doctor questions, and linked references in raw HTML (`1,141` words).
4. `/symptoms/night-sweats/` (Article with products): Full `<title>`, `<h1>`, Amazon disclosure, body text, rendered `<ProductBlock>` cards with direct Amazon links, and references in raw HTML (`1,586` words).
5. `/symptoms/vaginal-dryness/` (Article): Full `<title>`, `<h1>`, body text, 3 product blocks, and references in raw HTML (`1,399` words).
6. `/treatments/hormone-therapy/boxed-warning/` (Article): Full `<title>`, `<h1>`, body text, and FDA references in raw HTML (`1,044` words).
7. `/does-it-work/cooling-products/` (Buying guide): Full `<title>`, `<h1>`, comparison table, BedJet product block, and references in raw HTML (`1,106` words).
8. `/care/menopause-books/` (Buying guide): Full `<title>`, `<h1>`, 3 book reviews, and references in raw HTML (`1,473` words).
9. `/tools/symptoms-checklist/` (Tool page): Full `<title>`, `<h1>`, explanatory prose, interactive checklist initial state, and references in raw HTML (`1,204` words).
10. `/urgent-help/` (Crisis page): Full `<title>`, `<h1>`, 988 US and Samaritans UK numbers in raw HTML (`385` words).

---

## 6. Network & Privacy Check

- Automated static + built HTML analysis (`scripts/validate-privacy.ts`) and code inspection confirm:
  - **Zero third-party scripts, ad pixels, or session replay** on any page (enforced by CSP `default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self'`).
  - **Zero symptom or tool inputs leave the browser**: `SymptomsChecklist` uses `localStorage` (`menowell_pinned_symptoms`, `menowell_tool_used`) and IndexedDB (`menowell_local_db` via Dexie) on-device only.
  - **Minor issue found**: `EmailCapture` submits to `/api/newsletter/subscribe` which does not have a route handler yet (would cause a 404 in the network tab on form submit). Also, there is no interactive Cookie Consent Banner with an equal "Reject all" button yet.

---

## 7. Domain & Branding Check (`https://menoverdict.com`)

- **Current State**:
  - `src/lib/site/config.ts` defaults to `MenoWell` and `http://localhost:3000`.
  - When `SITE_ENV` is unset during `next build`, `SITE.env` becomes `'preview'`, which sets `<meta name="robots" content="noindex, follow">` on all pages and outputs an empty `/sitemap.xml` and `Disallow: /` in `/robots.txt`.
  - Missing `<meta name="awin-verification" content="Awin">` in homepage `<head>`.
  - Missing `www.menoverdict.com` → `menoverdict.com` permanent redirect in `next.config.ts` / `vercel.json`.
  - Missing `BRAND.md`, MenoVerdict SVG wordmark + mark, full favicon set (`favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`), and default `1200x630` Open Graph image.

