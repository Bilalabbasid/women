# AUDIT.md: Phase 0 audit of the existing PWA

**Date:** 2026-11-06
**Scope:** the working tree as found (one commit, `8932ace Initial commit from Create Next App`; all MenoWell work is uncommitted).
**Method:** read the source, ran `typecheck`, `test`, `lint` and `build`, served the production build locally, fetched routes with curl (no JavaScript), and ran Lighthouse 13.6.0 (mobile, simulated throttling) on three routes.

No application code was changed for this audit.

---

## 1. Stack

| Item | Finding |
|---|---|
| Framework | Next.js 16.3.8 (App Router, Turbopack), React 19.2.8, TypeScript strict |
| Rendering | Every page is statically prerendered (`○`). Every page except `/` is a `'use client'` component, and its useful content renders only after JavaScript reads IndexedDB |
| Routing | Flat `src/app/<route>/page.tsx`. No route groups, no dynamic segments, and no `trailingSlash` setting, so the default 308 redirect strips the trailing slash |
| Hosting target | Vercel, according to PLAN.md. Nothing is deployed, and there is no `vercel.json` |
| Content source | **None.** There is no CMS, no Markdown/MDX, no frontmatter and no content folder. Copy is hard-coded in JSX |
| Database | Client-side IndexedDB through Dexie 4 (9 stores). There is no server database. Supabase appears only in PLAN.md and `.env.example` |
| Auth | None, and none needed for the local-first tracker |
| Styling | Tailwind v4, hand-rolled `Button`, `Card` and `Badge` primitives, system font stack |
| Package health | `typecheck` passes. `lint` gives 0 errors and 6 unused-import warnings. `build` passes. `test` has **1 failure out of 27** (see §5, the ID collision bug). Not checked: `npm audit` and outdated-package scan |
| Next.js note | The removed AGENTS.md header said this Next.js version has breaking changes and pointed to `node_modules/next/dist/docs/`. Read those docs before Phase 2 code |

**Verdict:** the stack *can* meet the rendering requirement. Next.js supports static generation of server components for articles and hubs. **No framework migration is needed.** What's missing is a content layer (Markdown with validated frontmatter) and server-component pages for public content.

## 2. Crawlability (production build, curl, no JS)

| Route | Status | `<title>` | H1s | Description | Canonical | OG/Twitter | JSON-LD | Body without JS |
|---|---|---|---|---|---|---|---|---|
| `/` | 200 | site default | 1 | site default | ✗ | ✗ | ✗ | ✓ marketing copy present |
| `/pricing` | 200 | site default | **2** | site default | ✗ | ✗ | ✗ | partial |
| `/dashboard` | 200 | site default | 1 | site default | ✗ | ✗ | ✗ | ✗ "Opening your private journal..." |
| `/treatments` | 200 | site default | 1 | site default | ✗ | ✗ | ✗ | ✗ loading shell |
| `/doctor` | 200 | site default | 1 | site default | ✗ | ✗ | ✗ | ✗ loading shell |
| `/does-not-exist` | **404** ✓ | site default | 0 | — | — | — | — | generic "Page Not Found" with no search or hubs. It does send `noindex` |
| `/pricing/` | 308 → `/pricing` | | | | | | | |

- Every page has the **same title and description**, because only the root layout sets metadata.
- `public/robots.txt` and `public/sitemap.xml` are static files. The sitemap lists `/` and `/pricing` with a hard-coded `lastmod` and the domain `menowell.app`, which isn't confirmed as owned.
- robots.txt disallows the private app routes, which is correct. It also disallows `/treatments/`, which **would block the future `/treatments/` content hub**.
- There are no per-page `noindex` tags on private app routes. robots.txt blocking alone doesn't remove them from the index.
- No HTTP security headers are set: no CSP, HSTS, X-Content-Type-Options, Referrer-Policy or Permissions-Policy.
- There are **no content pages**. Of the ~150-page inventory, 0 pages exist.

## 3. PWA

| Item | Finding | Action |
|---|---|---|
| Manifest | Present. `start_url: /dashboard`. `theme_color #965342` doesn't match the viewport `themeColor #FAF8F5`. The maskable icon is SVG only. No `id`, no screenshots | improve |
| Icons | 192/512 SVG and PNG, plus a maskable SVG | improve (add a maskable PNG) |
| Service worker | Hand-written `public/sw.js`, registered only in production. **HTML is network-first** ✓. Static files use stale-while-revalidate | improve |
| SW risk 1 | Navigation responses are cached **without a status check**, so 404, redirect and error pages are stored and can be served offline as if they were the page | fix |
| SW risk 2 | The cache name is manually versioned (`menowell-cache-v1`) and there is no expiry, so stale canonical/noindex HTML can persist indefinitely while offline | fix |
| SW risk 3 | Offline fallback for unknown pages is `/dashboard` | fix |
| Stale-content warning | None. Cached medical pages would show no review date or "may be out of date" notice | build |
| Offline tracker | IndexedDB tracker works offline after the first load ✓ | keep |
| Install prompt | `PWAInstallBanner` is in the **root layout** and appears on every route, including the landing page, as soon as `beforeinstallprompt` fires. **This breaks "never interrupt reading."** The iOS dialog close button has no accessible name | fix: show only after a tool is used, or from Settings |
| Delete all data | `purgeAllData()` plus `localStorage.clear()` in Privacy Center ✓. It doesn't clear Cache Storage, which holds no health data | keep, improve copy |
| Export | JSON export ✓ | keep |

## 4. Existing routes, pages and tools

| Route | What it is | Verdict | Notes |
|---|---|---|---|
| `/` | Marketing landing page | **improve** | Rebuild as the site home (hubs, tools, evidence position). Copy problems in §5 |
| `/onboarding` | Storage-mode and pinned-symptom setup | keep → move | Move under the private app path |
| `/dashboard` | "Today" view of the tracker | keep → move | Remove auto-seeded demo data (§5) |
| `/check-in` | Daily symptom log (1–5 severity, flow, sleep, hot-flash counter, notes) | keep → move, improve | This is the core of **Tool 1 (tracker)**. Custom symptom names, with no MRS/Greene/MENQOL wording ✓. Needs urgent triggers and accessibility fixes |
| `/timeline` | 7–90 day history with delete | keep → move | |
| `/insights` | Deterministic stats | keep → move | Clinician review of wording needed |
| `/treatments` | HRT and medication regimen tracker with reminders | keep → **move** | **URL conflict:** the brief reserves `/treatments/` for the treatment content hub |
| `/doctor` | Printable doctor report | keep → move, improve | This is the "doctor report" half of Tool 1. It **pre-fills two HRT-specific questions** for every user (§5) |
| `/privacy-center` | Data location, export and delete | **merge** | Merge into the private app Settings. A separate public `/privacy/` policy page is required |
| `/settings` | Preferences | keep → move | Add the "Install app" link here |
| `/pricing` | $8.99/mo or $71.99/yr "Full Membership" with a 7-day trial | **remove from launch** | Advertises unbuilt features (PDF dossier, cloud backup, correlation timelines) and real-looking prices. The brief says not to add fake products or prices at launch. Keep the config file, but unlink the route and set it to noindex until the owner decides |
| `/offline` | Offline fallback | keep, improve | |
| `/api/health` | JSON health check | keep | Never called by the client |
| `not-found`, `error`, `loading` | App shell states | improve | The 404 page needs search and the top hubs |

**Tools required by the brief, mapped to what exists:** (1) Tracker and doctor report: **largely exists** (check-in, timeline, insights, doctor). (2) Symptoms checklist: no. (3) Stage guide: no. (4) Evidence checker: no. (5) Conversation builder: no. (6) 12-month counter: no. None of them has an indexable guide page.

## 5. Medical safety

| Severity | Finding | Location |
|---|---|---|
| Medium *(corrected 2026-11-06: originally logged as High "auto-seeded")* | **Sample data goes into the user's real journal.** On empty screens, a "Load Sample Records" button calls `seedDemoDataIfEmpty()`. It is opt-in, not automatic, but it writes an estradiol patch "0.05 mg/day", micronized progesterone "100 mg" and fake check-ins into *her* IndexedDB. These then mix with her own records and appear in her doctor report | `src/lib/db/service.ts:258`; buttons in `dashboard`, `insights`, `timeline` |
| **High** *(found in Phase 2)* | **Check-in pre-selects symptoms.** Hot flashes (3/5), night waking (3/5), "woke at night" and a hot-flash count of 2 are preset, so a quick save records symptoms she never reported | `check-in/page.tsx:38-53` |
| **High** | **No urgent-symptom handling.** Check-in records bleeding, palpitations, low mood and anxiety, but there are no urgent triggers: nothing for postmenopausal bleeding, heavy bleeding, chest pain, fainting or thoughts of self-harm, and no crisis resources (988 in the US, Samaritans in the UK) | `check-in/page.tsx`, `lib/config/symptoms.ts` |
| **High** | **Data-loss bug.** Treatment event IDs are `te_${Date.now()}`, so two events in the same millisecond overwrite each other. This causes the failing test | `src/lib/db/service.ts:174`, `src/test/treatments.test.ts:103` |
| Medium | Doctor report pre-fills HRT-specific questions ("…despite patch adherence. Is my current progesterone timing…") for every user, whether or not she uses HRT | `doctor/page.tsx:27-30` |
| Medium | Unsupported claim on the homepage: "Most health apps monetize your intimate records through data brokers or advertising SDKs." There's no source, and it reads as fear-based copy (rules 1 and 8) | `page.tsx` privacy section |
| Medium | "Talk or Type Quickly … *'Woke at 3 AM hot, headache…'*" implies natural-language parsing. Check-in actually has a free-text notes box and structured inputs, and does no parsing | `page.tsx` flow section |
| Medium | Treatment-comparison insight compares symptom averages before and after a treatment starts. The causation disclaimer is good ✓, but a clinician must review whether this view invites self-adjusting | `lib/insights/treatment-comparison.ts` |
| ~~Low~~ | ~~Lock-screen reminders show medication names by default.~~ *Corrected 2026-11-06: the default is already `discrete` mode, so no change is needed* | `lib/notifications/treatment-reminders.ts:18` |
| Info | Disclaimer copy is sound and appears on every screen ✓. The banner is dismissible and sits above content, so on articles it will push the opening answer down | `medical-disclaimer.tsx` |
| Info | No diagnostic phrasing ("you have", "you should take") found. No medical claims or citations exist yet, so there are no sources to verify | grep across `src/` |

## 6. Performance and accessibility

Lighthouse 13.6.0, mobile preset with simulated throttling, local production server. These are **lab numbers, not field p75 Core Web Vitals.** There is no article or comparison page to test yet.

| Route | Perf | A11y | Best practices | SEO* | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 97 | 91 | 100 | 100 | 0.8 s | 0.071 | 180 ms |
| `/check-in` (tool) | 99 | **81** | 100 | 100 | 0.8 s | 0.071 | 40 ms |
| `/dashboard` | 99 | 100 | 100 | 100 | 0.8 s | 0.071 | 50 ms |

\*Lighthouse SEO doesn't check canonicals, unique titles or structured data, so 100 here is misleading (see §2).

Failing automated checks (Lighthouse's axe-core audits):
- `/`: color contrast (1 element) and 2 links with no accessible name.
- `/check-in`: 4 icon buttons with no accessible name, color contrast (10 elements), heading order skipped, 1 unlabelled form field.

Against the brief's design rules:
- **Text size:** body copy is mostly `text-xs` (12px, 200 uses) and `text-[11px]` (54 uses). The brief requires an **18px minimum** on mobile. This is the largest design gap.
- **Tap targets:** several buttons are `min-h-[34px]`, below the **44px** minimum.
- **Reduced motion:** no `prefers-reduced-motion` handling, while `active:scale` and transitions are used everywhere.
- **Focus:** focus-visible rings on `Button` ✓. Raw `<button>`s, such as the banner close buttons and check-in chips, have no visible focus style.
- **JavaScript:** `/` ships 9 scripts, **~188 KB gzip**. The brief caps articles at 100 KB. Articles must be server components with no app shell JS (the root layout currently loads four client components on every page).
- **Fonts:** system stack. No web fonts, so `font-display` doesn't apply ✓.
- **Look:** cream with terracotta (`#965342`). It isn't bubble-gum pink, but it leans "wellness". The editorial redesign should move toward a calmer, more neutral palette.
- Not done: keyboard and screen-reader spot checks.

## 7. Privacy

| Item | Finding |
|---|---|
| Third-party scripts | **None** ✓ (no analytics, ads, pixels, Sentry or fonts CDN) |
| Cookies | **None** set by the app ✓ |
| Network calls from the client | **None** besides page and asset loads. `fetch` isn't used in `src/`, and `/api/health` is never called ✓ |
| IndexedDB (`menowell` via Dexie) | checkins, symptoms, journal (free text), customSymptoms, cycles (bleeding), treatments (name and dose), treatmentEvents, appointments, settings. **All health data stays on the device** ✓ |
| localStorage | `menowell_onboarding_completed`, `menowell_storage_mode`, `menowell_pinned_symptoms` (symptom IDs, which are health-adjacent, local only) |
| Cache Storage | App shell and visited HTML. No IndexedDB data, because pages render data client-side |
| Notifications | Local `Notification` API only, with no push server |
| Export | Client-side JSON download ✓ |
| Where health inputs go | **Nowhere off-device.** ✓ This meets rule 9 today |
| Gaps | No public privacy policy page. `.env.example` lists Supabase, Gemini, Stripe, Sentry and Resend for features that aren't built: any of those would need legal review before health data touches them. `.gitignore` pattern `.env*` also ignores `.env.example`, so it isn't versioned |

## 8. Commercial

- Affiliate links: **none.** CTAs: "Start Privately", "Open Demo Journal" and the pricing "membership" card. Disclosures: none (none needed yet). Tracking: none. `/go/` redirects: none.
- **Positioning conflict:** the hero line "Your body isn't our business model." sits awkwardly beside the affiliate revenue model the brief requires. A truthful version would say "your *data* isn't our business model" and point to an honest "How we make money" page. Owner decision, logged in DECISIONS.md.

---

## Prioritised gap list against the brief

**P0: blocks everything else**
1. **Content layer is missing.** Add Markdown content with validated frontmatter (all 29 required fields), a status gate that excludes non-`clinician_approved`/`published` medical pages from production, and a source registry. *(Phase 2)*
2. **URL architecture conflicts.** Move the private tracker app from `/dashboard`, `/treatments` and so on to a single noindexed prefix, so `/treatments/` and `/tools/` become content hubs. Set a trailing-slash rule. *(Phase 2)*
3. **Safety fixes in the existing tool:** stop writing sample data into real journals, remove preset symptom values, add a clinician-reviewable urgent-trigger file with crisis resources, fix the ID-collision data-loss bug, and remove the pre-filled HRT questions. *(Phase 2; small and should land first)*
4. **No clinician reviewer.** No medical page can publish. All content stays draft until `{{CLINICAL_REVIEWER_NAME}}` exists. *(Owner)*
5. **Placeholders unfilled:** site name, domain, reviewer, email provider, legal entity and contact email. *(Owner. Defaults in DECISIONS.md)*

**P1: foundation**
6. Per-page metadata, canonicals, OG/Twitter tags, generated `sitemap.xml` and `robots.txt`, and noindex on app, `/go/`, search and draft routes.
7. A shared JSON-LD generator (Organization, WebSite, MedicalWebPage/Article, BreadcrumbList, WebApplication, FAQPage) with tests.
8. Article layout as server components with under 100 KB JS: move the install banner, disclaimer and nav out of the global client path.
9. Design system pass: 18px body, 44px targets, contrast, reduced motion, focus styles, evidence-grade badges with text, breadcrumbs, table of contents, search and a "Tools" nav item.
10. Service worker hardening: cache only 200 OK HTML, versioned cache tied to the build ID, an offline page instead of `/dashboard`, and a stale review-date warning.
11. Validators `validate:content|seo|links|cta|a11y|privacy`, CI, and `scripts/link-audit.ts`.
12. Security headers, including a CSP that would block any accidental third-party script.

**P2: plan and content**
13. `content/_plan/keyword-map.csv` (no volumes unless supplied), an import/merge script and a cannibalisation check.
14. `content/_sources/sources.yaml` built from sources actually opened and verified. The research plan's figures must be re-checked before use.
15. Required site pages as drafts (About, Editorial Policy, Evidence Method, Medical Review, How We Make Money, Products We Won't Recommend, Corrections, Privacy, Cookies, Terms, Disclaimer, Contact, Crisis and Urgent Help).

**P3: commercial and remaining tools**
16. CTA rules engine, `partners.yaml` (all disabled, null values), `/go/{partner}`, disclosures and banned-combination tests.
17. Tools 2–6 with indexable guide pages. Email adapter.
18. Decide the fate of `/pricing` (recommended: unlinked and noindex until a real product exists).

**Not yet measured:** field Core Web Vitals (no traffic), keyboard and screen-reader checks, `npm audit`.
