# DECISIONS.md

Each decision below is the sensible default chosen so work can continue. Anything marked **Owner** needs the owner to confirm or replace it. Evidence is in [AUDIT.md](AUDIT.md).

| ID | Date | Decision | Why | Status |
|---|---|---|---|---|
| D-001 | 2026-11-06 | **Keep the Next.js 16 / React 19 / Tailwind / Dexie stack. No framework migration.** | App Router static generation meets the server-rendered HTML requirement. The gap is a missing content layer, not the framework (AUDIT §1) | Decided |
| D-002 | 2026-11-06 | **Content lives in `content/` as Markdown with YAML frontmatter, validated by a schema at build time.** Rendered by server components (remark/rehype), not MDX | Plain Markdown keeps article pages free of client JS (100 KB budget) and makes bulk drafting and validation simple. Interactive parts are separate tool components | Decided, with dependencies added in Phase 2 |
| D-003 | 2026-11-06 | **Move the private tracker app under one prefix, `/app/`** (`/app/today/`, `/app/check-in/`, `/app/timeline/`, `/app/treatments/`, `/app/insights/`, `/app/doctor-report/`, `/app/settings/`). All `noindex` and robots-disallowed. Public, indexable guide pages live at `/tools/{tool}/` and link into the app | The brief reserves `/treatments/` and `/tools/` for content hubs. One private prefix makes noindex, robots and service-worker rules simple. No users yet, so moving is free | Decided |
| D-004 | 2026-11-06 | **Trailing-slash URLs** (`trailingSlash: true`), lowercase, hyphenated | Matches the brief's URL style (`/perimenopause/`). Next.js issues **308** permanent redirects, which search engines treat like 301. If a literal 301 is required, it can be set at the host or edge | Decided |
| D-005 | 2026-11-06 | **Placeholders become one site config file** (`SITE_NAME`, `DOMAIN`, `CONTACT_EMAIL`, `LEGAL_ENTITY`, `EMAIL_PROVIDER`, reviewer). Working values: name "MenoWell", domain unset. **A production build fails while any placeholder is still unfilled** | Nothing invented, and no risk of shipping `{{LEGAL_ENTITY}}`. `menowell.app` appears in old files but ownership isn't confirmed | **Owner**: fill the values |
| D-006 | 2026-11-06 | **Stop auto-seeding demo data into the real journal.** Example data stays only for tests and an explicit, labelled "preview with sample data" mode that uses a *separate* IndexedDB database | Auto-seeding writes hormone regimens and doses she never entered into her doctor report (AUDIT §5, High) | Decided |
| D-007 | 2026-11-06 | **`/pricing` is unlinked and `noindex` at launch.** `src/lib/config/pricing.ts` is kept, not deleted | It advertises unbuilt features at real-looking prices. The brief says no fake products or prices at launch | Decided (reversible) |
| D-008 | 2026-11-06 | **Proposed tagline change:** "Your body isn't our business model" → wording about *data* (for example "Your health data isn't our business model"), plus a link to "How we make money" | The site will earn affiliate commission, so the current line could mislead. Not changed yet | **Owner**: approve wording |
| D-009 | 2026-11-06 | The research brief exists only as the "research starts here" section of AGENTS.md. `menopause-research-plan.md` and `research/` are empty. **That section is treated as the strategy brief, and every figure in it is re-verified before use** | The brief names a file that doesn't exist. Its figures include brand-sourced and search-listing numbers it flags as unchecked | Decided |
| D-010 | 2026-11-06 | **Commit the existing uncommitted MenoWell work as a baseline snapshot on a new branch `site-rebuild`**, then commit the audit separately. All later work goes on that branch in small commits | Only the create-next-app commit exists, so without a baseline none of the rebuild can be reviewed as a diff. Branching keeps `master` untouched | Decided |
| D-011 | 2026-11-06 | **AGENTS.md overrides PLAN.md where they conflict.** PLAN.md is kept as the product history. Deferred from PLAN.md: free-tier ads (the brief says no ads at launch), Gemini AI over health data, and cloud sync (rule 9 says stop and flag for legal review before any health data leaves the device) | PLAN.md predates the build prompt | Decided |
| D-012 | 2026-11-06 | **Tracker wording stays custom** (no Menopause Rating Scale, Greene or MENQOL items) and makes **no validated-score claim** | Licences aren't confirmed. The existing symptom list is already custom | Decided until licences are confirmed |
| D-013 | 2026-11-06 | **Audits use Lighthouse 13.6.0 via `npx` against a local production build.** Lab results are labelled as lab results, never as field Core Web Vitals | No deployment or traffic yet | Decided |
| D-014 | 2026-11-06 | **No medical page publishes until a named clinician exists.** Everything is drafted as `draft`/`evidence_checked`, and the production build excludes it | Rules 3 and 4 | **Owner**: appoint a reviewer |

## Open questions for the owner

1. Fill the placeholders: site name, domain, clinical reviewer name and credentials, email provider, legal entity and contact email (D-005).
2. Who is the clinical reviewer, and when can they start? Nothing medical goes live without them (D-014).
3. Approve the tagline wording (D-008).
4. Do you hold licences for the Menopause Rating Scale or the Greene scale, or should we stay with the custom log (D-012)?
