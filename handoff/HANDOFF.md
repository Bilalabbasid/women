# MenoVerdict handoff (2026-11-08)

You are picking up the MenoVerdict site rebuild. Your job: **finish the work in progress, make the
build pass with every check green, merge the redesign branch, and push `site-rebuild`.** Read this
whole file before changing anything.

- Repo: `C:\Users\bilal.abbasi\Desktop\Redit` (GitHub `Bilalabbasid/women`), branch **`site-rebuild`**.
- Stack: Next.js 16 App Router (read `node_modules/next/dist/docs/` before using unfamiliar APIs),
  TypeScript, Tailwind, vitest, content as Markdown in `content/pages/**.md` with strict zod
  frontmatter (`src/lib/content/schema.ts`).
- Vercel does not auto-deploy this branch; the owner deploys manually after you push.
- Owner: Umer. Contact address on the site: contact@menoverdict.com.

## 0. First: repair node_modules
A worktree cleanup deleted part of `node_modules` (`.bin` is gone). Run, from the repo root:

```bash
npm ci
```

## 1. What state the branch is in

Pushed or committed and verified (build + all validators + tests passed at `ba51eaf`; later
commits passed tsc/vitest/validate-content):

| Commit | What |
| --- | --- |
| 3265b93 | PWA: offline tracker (SW precaches /app/* + scripts), manifest (start_url /app/today/, shortcuts, screenshots), install banner (30-day dismissal), /app/install/, in-app log reminders + weekly .ics, appointment mode, backup reminder, /app/saved/, homepage "last log X days ago", Recent evidence updates |
| a85d69a | Merge of `free-site`: all commerce removed; postbuild `validate-free` blocks it coming back |
| 65dc600 | POST /api/subscribe (newsletter + contact) via Resend, honeypot, 3 s minimum, 5/10 min hashed-IP limit, no storage/logging; on-device PDFs (checklist, 10-minute appointment kit) |
| c550b5f | Telehealth prices cite each company's pricing page; "Prices checked on" wherever a $ price appears; unsourced cooling-product prices removed |
| ba51eaf | Byline "Compiled by the MenoVerdict editorial team · Not reviewed by a doctor · Last checked {date}" (validated by validate-honesty), JSON-LD author = editorial team; "What readers told us" from `content/_quotes.yaml` (empty = hidden) |
| c96bb90 | Article body styling: rehype step wraps each H2 section in `section.prose-section`, `ul.kv-list/li.kv` label panels, `td[data-label]`; `src/app/article.css` |
| 08c64f2 | `src/lib/site/start-here.ts` (4 start-here paths + `STAGE_QUIZ_CTA`) as data for the homepage |
| 18fe5de | `:::try` directive ("Try tonight" box, CSS lives on the redesign branch) and roomier article text on phones |

The **last commit ("WIP …", on top of 18fe5de) is NOT verified.** It contains everything that was in the
working tree when all agents were stopped mid-task:
- Content edits by ~20 agents on many `content/pages/**.md` files (see section 3).
- The stage-quiz rebuild in progress: `src/components/tools/stage-guide.tsx`, new `src/lib/tools/stage-quiz.ts`,
  `src/components/tools/tool-loader.tsx`, `content/_tools/stage-guide.yaml`, tests
  `src/test/stage-quiz.test.ts`, `src/test/stage-guide.test.tsx`, `src/test/interactive-tools.test.tsx`.
- Files other sessions had left uncommitted: `.gitignore`, `content/_plan/*`, `reports/*`,
  `src/lib/tools/logic.ts`, `content/_review/`. Check `git diff 18fe5de -- <file>` for each and keep only
  what makes sense (logic.ts holds the tool approval/live logic: be careful).
- `handoff/` (this file, the agents' briefs, pending sources).

**Expect `npm run build` to fail at first**: pages cite source ids that are not yet in
`content/_sources/sources.yaml` (they are in `handoff/pending-sources/`).

## 2. Hard rules (non-negotiable, from the owner's brief)
- Never invent medical facts, statistics, citations, studies, people, credentials, prices or company
  details. A claim without a source that says it gets removed (or listed as "needs a source").
- No database, no accounts, no analytics, pixels, A/B tools, third-party embeds/CDNs at page load, no
  server logging of submissions/IPs. Health data never leaves the device (no URLs, emails, requests).
  The only outgoing data is an email (+ contact message) typed into a form, sent to the owner via Resend.
- No commerce of any kind (affiliate, product picks, "buy"); `validate-free` enforces it.
- No founder names, personas, "medically reviewed", or reviewer claims. Byline says "Not reviewed by a
  doctor" unless a verified clinician approved that exact version.
- No diagnosis or individual prescribing. US-first crisis numbers (911, 988); UK on its own line
  "If you're in the UK:" (999, NHS 111, Samaritans 116 123). US spelling.
- Grades only via `:grade{id="..."}` from `content/_grades/grades.json`; never hand-typed.
- Login and the AI chatbot stay hidden. Don't add them.
- Storage consent banner stays (owner overrode the brief: consent is required).
- Owner prefers ONE push at the end of a batch, not per step.

## 3. Finish the content work
Brief every agent followed: `handoff/briefs/content-brief.md` (+ ADDENDUM A–F at its end: plain words,
2–3 sentence opening with no links, sentence-case titles/H2s, calm "other causes", one `:::try` box for
safe sourced self-care steps, no product links inside advice) and `handoff/briefs/sweep-brief.md`.
Verified research notes: `handoff/briefs/stats-proposals.md`.

### 3a. Merge pending sources
`handoff/pending-sources/new-sources-*.yaml` hold new registry entries the agents verified (each says what
it was checked against). For each entry: skip duplicates (same id, URL or DOI already in
`content/_sources/sources.yaml`; g5 and g6 may both have added CDC clot/stroke pages, so keep one id and
update citations), sanity-check the URL opens and supports the `key_finding`, then append to
`sources.yaml`. Then `npx tsx scripts/validate-content.ts` must show 0 errors.

### 3b. Status of the 20 priority pages (agents were stopped; review each diff)
| Pages | Status when stopped |
| --- | --- |
| symptoms/hot-flashes, night-sweats (g1) | First pass done; was applying ADDENDUM. Review fully. |
| symptoms/waking-at-3am, brain-fog (g2) | Stopped mid-way; brain-fog NOT edited yet. |
| symptoms/anxiety, weight-gain (g3) | Edits done, was validating. Check the crisis box (988/911 first). |
| symptoms/joint-pain, perimenopause/early-signs (g4) | Done except final re-read; only unknown-source errors. |
| perimenopause/vs-menopause, treatments/hormone-therapy/index (g5) | Done, waiting on link audit. |
| hormone-therapy/patch-vs-pill, boxed-warning (g6) | **Finished** (reported). New sources cdc-vte-about, cdc-stroke-signs. Many unsupported claims removed; boxed-warning now matches FDA wording (label changes began 2003, not 2002). |
| nonhormonal/fezolinetant, elinzanetant (g7) | **First pass finished** (FDA labels; new source `lynkuet-prescribing-information`). Was applying ADDENDUM A–D to fezolinetant when stopped. Then switch `grades.json` `elinzanetant-vms` source to the label (owner OK needed; see 6). |
| does-it-work/black-cohosh, magnesium (g8) | Done except final re-read. Magnesium-for-sleep grade question: see 6. |
| does-it-work/ashwagandha, cooling-products (g9) | Ashwagandha done; cooling-products edits were in progress. |
| tools/symptom-tracker, symptoms-checklist (g10) | **Finished** (reported); facts match the code. |

### 3c. Site-wide sweep of the other ~140 pages (all stopped partway)
Lists per group: `handoff/briefs/sweep-s1.txt` … `sweep-s9.txt`. Pages already touched are the modified
`content/pages` files in the WIP commit that are not in the table above. Finish the rest with the sweep
brief: US-first crisis numbers, US spelling, colon rule (a paragraph ending ":" must be followed by a list,
table, blockquote or `:::` box), cite or remove statistics, plain first sentence, "When to see a doctor" on
symptom pages, no commerce, descriptive link text. Legal/about pages: only spelling, crisis numbers,
colon rule and link text.

## 4. Finish the stage quiz (brief section 6)
Goal: `/tools/stage-guide/` becomes a 6–8 question quiz mapped to STRAW+10 / NICE NG23 (sources already
in the registry), one question per screen, large radio targets, progress, Back/Next, red-flag answers show
the existing `UrgentGuidance`, result = stage it resembles + plain explanation + what it can't tell you +
links (relevant pages, /tools/symptom-tracker/, /app/install/ when the tracker is live), saved on device,
Print and Download PDF (`quizSummaryPdf` + `downloadSimplePdf` in `src/lib/tools/simple-pdf.ts`). Never
asks for an email. Logic lives in `src/lib/tools/stage-quiz.ts`, the component stays thin.
- Check the in-progress files compile and tests pass. **Check `content/_tools/stage-guide.yaml`**: tools
  have a clinician-approval hash (see `src/lib/tools/logic.ts`, `isToolLive`); if the yaml change breaks
  that, the tool stops rendering in production. Restore the hash logic rather than faking an approval.
- Also update `content/pages/tools/stage-guide.md` so its text describes the quiz.
- The homepage hero CTA and four "Start here" cards render `src/lib/site/start-here.ts` (built on the
  redesign branch).

## 5. Merge the redesign branch, build, verify, push
1. `ui-redesign` is at **008640b** and is **pushed to GitHub as its own branch, `origin/ui-redesign`**
   (also checked out locally in the worktree `C:\Users\bilal.abbasi\Desktop\Redit-ui`). You MUST merge it:
   it holds all of the redesign chat's work, and none of it is in `site-rebuild` yet. Get it with
   `git fetch origin` and merge `origin/ui-redesign` (step 2). The commerce-removal chat's branch
   (`free-site`) is already merged into `site-rebuild`; nothing to do for it.
   - Verified at 6a8d5ec: design system (tokens, components, `/dev/design-system`), site-wide dark mode,
     full tracker redesign; article template 7220fcd.
   - WIP, tsc-clean but not build-verified: new header (menu sheet, fuzzy search), homepage (uses
     start-here.ts), hubs, symptoms directory, verdict hero, comparison cards, tool pages, urgent-help, 404,
     offline, print.css, compact storage banner, tracker fixes, `ui-*.test.tsx`.
   - Not wired yet: `VerdictHero` + `BetterEvidenceCards` (does_it_work pages) and `ChooseCards`
     (comparison pages) into `src/app/(site)/[...slug]/page.tsx`; instructions are in the header comments
     of `src/components/site/verdict-hero.tsx` and `compare-cards.tsx`.
   - It owns `[...slug]/page.tsx` layout, site-chrome, homepage and globals.css; this branch owns
     behaviour (sw.js, manifest, /api/subscribe, markdown.ts rehype step, article.css, start-here.ts).
2. On `site-rebuild`, run `git fetch origin` then `git merge origin/ui-redesign` (resolve conflicts
   keeping both: behaviour from site-rebuild, visuals from ui-redesign). It already contains site-rebuild
   up to ba51eaf, so expect conflicts only from the later commits (c96bb90 onwards and the WIP commit),
   mostly in `src/app/(site)/[...slug]/page.tsx`, `src/components/tools/*`, `email-capture.tsx` and
   `content/pages/**`. The redesign worktree also has one uncommitted file, `AGENTS.md`; ignore it unless
   the owner says otherwise.
3. Run everything; all must pass with 0 errors:
   ```bash
   npm run validate:source
   ```
   ```bash
   npm run build
   ```
   ```bash
   npm run validate:build
   ```
   ```bash
   npx vitest run
   ```
   ```bash
   npx tsc --noEmit -p .
   ```
   Known test gotcha: fixtures may check out as CRLF; tests must match `\r?\n`.
   validate-seo treats `/dev/*` as private (design-system preview is noindex on purpose).
4. Regenerate the plan/graph reports (`npm run validate:links`, `npm run validate:graph`) and commit them.
5. Check in a browser (`PORT=3100 npm run start`; `next start -p` is rejected by the wrapper):
   home, an article (section cards, Try-tonight box, byline), a does-it-work page, a comparison page,
   /tools/stage-guide/, /app/today/, /app/install/, /contact/ form, dark mode, 375px width.
   Offline check script: `handoff/briefs/swcheck.mjs` (headless Chrome via CDP: run `online`, stop the
   server, run `offline`). Manifest screenshots script: `handoff/briefs/shots.mjs`.
   Perf: articles were 185 KB gzipped JS at 6a8d5ec vs a 90 KB budget; investigate if time allows.
6. Commit, then `git push origin site-rebuild` once. Tell the owner to deploy on Vercel.
7. Write `reports/launch-qa.md` (was not written): storage audit (every localStorage/IndexedDB key vs
   cookies.md/privacy.md), network audit (every fetch; no third parties at page load), JSON-LD sample check
   (no Review/AggregateRating/Product; author = editorial team; no reviewedBy), honesty grep, Lighthouse
   mobile for home/article/tracker, removed-claims list (from agent diffs/change_logs), and the list below.

## 6. [NEED FROM UMER] (owner decisions/inputs; never make these up)
- Vercel env: `RESEND_API_KEY`, `FORMS_NOTIFY_TO`, `FORMS_NOTIFY_FROM` (e.g. forms@menoverdict.com), and the
  DNS records Resend shows for menoverdict.com (MX + SPF TXT on `send`, DKIM TXT at `resend._domainkey`,
  optional `_dmarc`). Until set, both forms show "Something went wrong — email us at contact@menoverdict.com".
- `GSC_VERIFICATION` (Search Console HTML-tag code).
- Data controller name for the privacy page.
- Grade decisions: magnesium-for-sleep is "Limited" but its source may not support it; minoxidil set to
  Moderate; switch `elinzanetant-vms` grade source to the FDA label once that source is merged.
- A named clinician reviewer if he wants "Checked by" bylines (otherwise they stay "Not reviewed by a doctor").
- Real reader quotes (with permission) for `content/_quotes.yaml`.

## 7. Where things live
- Honesty wording (single source): `src/lib/site/honesty.ts`; checks: `scripts/validate-honesty.ts`.
- Storage consent: `src/lib/storage/consent.ts`; banner `src/components/site/cookie-banner.tsx`.
- Service worker: `src/app/sw.js/route.ts`; app routes + offline shell list: `src/lib/routes.ts`.
- Reminders/appointment/backup logic: `src/lib/tracker/nudges.ts`; Today cards
  `src/components/app/today-nudges.tsx`; settings `src/components/app/log-reminder-settings.tsx`.
- Forms: `src/lib/forms/subscribe.ts`, `src/app/api/subscribe/route.ts`, `src/components/site/email-capture.tsx`.
- PDFs: `src/lib/tools/simple-pdf.ts`, doctor report `src/lib/tools/doctor-report-pdf.ts`.
- Markdown pipeline + directives (`:::urgent`, `:::questions`, `:::note`, `:::try`, `::tool`, `:grade`):
  `src/lib/content/markdown.ts`.
- Grades registry: `content/_grades/grades.json` + `src/lib/grades/`.
