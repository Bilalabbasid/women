# MenoWell Content & Platform Build Progress

Tracking progress across the platform build and article waves according to Claude Code Prompt 2.

## Platform Foundations & Systems

- [x] **Website-First Architecture**: App routes moved to `/app/` (noindex), homepage redesigned as website entry leading with search, symptoms, stages, tools.
- [x] **Owner Decisions (Prompt 2)**:
  - Everything goes live: All finished pages published and indexable in production build.
  - Clinician approval unblocking: Content publishes once sources are checked and validators pass.
  - Honesty rule: Medical articles without clinician approval display standard honesty disclaimer ("content was not written by a doctor").
  - Accuracy rule: Unverified claims excluded.
  - Safety & privacy rules: On-device health storage by default; no commercial slots in urgent sections.
- [x] **Config Flags**:
  - `FEATURE_LOGIN=false`: Login and account links hidden until owner supplies database credentials.
  - `FEATURE_AI_PROMOTION=false`: AI promotional prompts, pop-ups, and banners disabled.
  - `FEATURE_APP_DOWNLOAD_PROMOTION=false`: App install banners suppressed on content pages.
- [x] **Accounts, Consent & Retention Engine**:
  - Implemented `AccountService` and `DatabaseAdapter` with test adapter.
  - Explicit consent screen with mandatory 10, 20, 30, or 90 days retention choice (no preselection).
  - Data deletion cron endpoint (`/api/cron/data-deletion`) secured with `CRON_SECRET`.
  - Full suite of 8 passing unit tests covering consent, automatic expiry deletion, withdrawal, and export.
- [x] **Hosting & Deployment Documentation**:
  - `DEPLOY_HOSTINGER.md` with Node.js selector, environment variables, build instructions, and daily hPanel cron command.
  - `DEPLOY_VERCEL.md` and `vercel.json` with Vercel Cron configuration.
  - Complete `.env.example` with all configuration keys.
- [x] **Product Placeholder System**:
  - `content/_products/slots.yaml` with required categories (cooling bedding, sleepwear, fans, lubricants, moisturisers, CBT, supplements, etc.).
  - `<ProductSlot id="..." />` and markdown integration.
  - Empty status shows helpful editorial how-to-choose guide without buy links.
  - Filled status renders clear recommendation block with rel="sponsored nofollow" and mandatory paid link notice.
  - Automated slot report generator (`scripts/generate-slot-report.ts`) outputting `content/_products/slot-report.csv`.
- [x] **Site Graph & Linking Validation**:
  - Build-time site graph generation (`content/_plan/site-graph.json`).
  - Hard build check (`npm run validate:graph`) enforcing click depth <= 3, hub links, anchor text distribution, and no broken edges.
  - Reports generated in `reports/link-graph.csv` and `reports/seo-sync-report.md`.
- [x] **What Brings Readers Back**:
  - Consented email capture component (`EmailCapture`) with free appointment guide.
  - Three-path next steps component (`NextSteps`: Still tracking / Ready to talk to a doctor / Already on treatment).
  - On-device bookmarking (`BookmarkButton`) requiring zero login.
  - Standard honesty disclaimer box on all medical articles and in footer.
- [x] **Banned Phrases & AI-Filler Validation**:
  - Updated `banned-phrases.ts` with all forbidden AI words ("navigating", "journey", "embrace", "game-changer", etc.) and fake experience phrases.

---

## Content Waves

Target: ~300 high quality, evidence-checked, brief-backed articles.

- **Wave 1** (Hubs, perimenopause basics, top symptoms, boxed-warning explainer, doctor guides):
  - [x] `/tools/symptom-tracker/` (Symptom tracker and doctor report)
  - [x] `/tools/symptoms-checklist/` (Perimenopause symptoms checklist)
  - [ ] Hubs: `/symptoms/`, `/treatments/`, `/perimenopause/`, `/menopause/`, `/postmenopause/`, `/does-it-work/`, `/care/`, `/compare/`, `/groups/`, `/evidence/`
  - [ ] Top symptoms: `/symptoms/hot-flashes/`, `/symptoms/night-sweats/`, `/symptoms/brain-fog/`, `/symptoms/fatigue/`, `/symptoms/joint-pain/`, `/symptoms/mood-changes/`, `/symptoms/insomnia/`, `/symptoms/irregular-periods/`, `/symptoms/vaginal-dryness/`, `/symptoms/heart-palpitations/`
  - [ ] Explainer: `/treatments/fda-boxed-warning-changes/` (FDA 2025/2026 MHT boxed warning changes)
  - [ ] Doctor guides & stages: `/perimenopause/early-signs/`, `/perimenopause/questions-for-your-doctor/`, `/care/10-minute-appointment/`, `/care/second-opinion/`

- **Wave 2** (Remaining symptoms, treatments, Does It Work pages, care comparisons):
  - In progress...

- **Wave 3** (Real-life question articles, buying guides, work and relationships, special groups):
  - In progress...
