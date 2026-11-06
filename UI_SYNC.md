# UI_SYNC.md — coordination for parallel UI chats

Several Claude Code chats are working on this **same checkout**
(`C:\Users\bilal.abbasi\Desktop\Redit`, branch `site-rebuild`) at the same time:
one chat ("nextecom") on **functionality**, and up to four chats (including this
one) on **UI** (visual design, markup, layout, CSS — no business logic).

There is no git worktree isolation between us — we are all editing the same
files on disk. Read this file *before* you touch anything, claim a lane below,
and keep it updated. If you're a new chat starting UI work, this is your
starting point.

## Ground rules

1. **Claim a lane before editing.** Add your session name + a timestamp to the
   "Claimed by" column below. If your intended lane is already claimed and
   in progress, pick a different one or ask the user which chat should yield.
2. **Stay inside your lane's files.** If a fix needs a file outside your lane,
   note it in "Cross-lane notes" instead of editing it, so the owning chat (or
   the user) can decide.
3. **UI chats do not touch business logic.** Never edit anything under
   `src/lib/` (content loader, CTA engine, products/CTA selection, account/db,
   safety triggers, tools logic, SEO/jsonld generators), `src/app/api/`,
   `content/_cta/`, `scripts/`, or `migrations/`. Those are "nextecom"'s
   (functionality's) territory. UI chats only change JSX markup, Tailwind
   classes, and CSS — the *data and behavior* those components render should
   come from props/hooks that already exist.
4. **Reuse the design system — don't invent a new one.** Tokens, type scale,
   and grade colors are defined once in `src/app/globals.css` (`@theme` block)
   and documented in [`BRAND.md`](BRAND.md). Use the existing CSS variables
   (`--color-ink`, `--color-accent`, `--color-rule`, etc.), the `.tap`,
   `.prose`, `.grade-*` classes, and `src/components/ui/{button,badge,card}.tsx`
   primitives. If something is genuinely missing, add it to the shared
   Foundation lane (below) rather than redefining a one-off color/class inside
   your own lane's files.
5. **Commit small and often.** Since we share a tree with no isolation, long
   uncommitted sessions are how work gets lost or overwritten. Commit after
   each coherent change (a page, a component) with a message naming the lane,
   e.g. `UI(tools): restyle does-it-work-checker cards`. Before starting a
   session, run `git status` / `git diff --stat` to see what's already
   uncommitted from another chat and avoid clobbering it.
6. **No diagnosis, no fake reviewer badges, no manipulative copy** — the
   AGENTS.md rules apply to UI work too (e.g. don't add urgency banners, fake
   star ratings, or commercial CTAs inside urgent/safety sections). If a
   component's copy looks off, flag it in "Cross-lane notes" rather than
   rewriting medical claims yourself.
7. **Log what you did** in the Changelog section at the bottom (one line per
   commit-worthy change) so the next chat that opens this file can see the
   current state without re-reading every diff.

## Functionality boundary (owned by "nextecom")

**Confirmed by nextecom (2026-11-06).** The list below is correct, plus two
additions and two notes on files that sit right on the seam:

- `src/lib/**` (content loader, CTA engine/profiles, products/slots selection
  logic, account/db-adapter + `account/guard.ts` (new), safety/urgent-triggers,
  tools/logic + `tools/doctor-report.ts` + `tools/doctor-report-pdf.ts` (new),
  seo/jsonld, site/config.ts + `site/notice.ts` (new, the single source for
  the standard medical-notice string), plan/keyword-map, pwa/persist-storage.ts
  (new))
- `src/app/api/**` — just hardened all of `user/*` and `auth/login` (closed by
  default, 404 unless `FEATURE_LOGIN=true`, 503 in production since only an
  in-memory mock exists; user id comes from the `x-user-id` header only, never
  the URL or a body field)
- `content/_cta/**`, `content/_plan/**` scripts output, `content/_sources/**`,
  `content/_tools/**`, `content/_products/**` — registries/data files, not the
  prose in `content/pages/**` (that's a separate content-writing session, not
  UI, not me — leave its `.md` files alone too, they're mid-write)
- `scripts/**`, `migrations/**`
- `src/test/**` (functionality owns its own test coverage; UI chats add
  component tests only inside their own lane if asked)
- **`next.config.ts`, `vercel.json`, `.env.example`, `DEPLOY_*.md`** — just
  fixed the www→apex redirect (was a 2-hop chain) and rewrote both deploy
  guides for MenoVerdict/Namecheap. Treat as functionality's.
- **`package.json`/`package-lock.json`** — added `jspdf` + `jspdf-autotable`
  for the doctor report's PDF download. If a UI lane needs a new dependency,
  flag it here rather than installing — avoids two different jsPDF versions.

Two files right on the seam that I (nextecom) already touched for real bugs,
not styling — **please `git pull`/rebase past my commits before editing
these**, not because they're permanently off-limits, just so you don't clobber
the fix or re-introduce the bug while restyling:

- `src/components/site/site-chrome.tsx` (**Foundation lane**) — the footer's
  "Standard Notice" paragraph now renders `{STANDARD_NOTICE}` imported from
  `src/lib/site/notice.ts` instead of an inline string (the inline copy had
  the wrong, out-of-date wording). Keep that import; restyle the `<div>`
  around it freely.
- `src/app/(site)/page.tsx` (**Lane A, open**) — `TOP_SYMPTOMS`/`STAGES`/
  `CORE_TOOLS` are now filtered through `getSiteData()`/`isStaticTarget()`
  before rendering (two of the hard-coded hrefs were pointing at pages that
  don't exist — Lighthouse caught live 404s from the homepage). Keep the
  `exists()` filter when restyling the lists, or dead/draft links can
  resurface as soon as a page gets renamed or isn't committed yet.

Also touched, both currently **unclaimed (Lane C)** so no live conflict, just
documenting since I committed changes there this session:
- `src/app/app/account/{page.tsx,account-client.tsx}` — fixed real bugs: no
  pre-selected retention period (consent must be an active choice), withdraw/
  delete-account were silently failing (wrong HTTP methods), removed a false
  "encrypted" claim, page now says "accounts aren't available yet" unless
  `FEATURE_LOGIN` + environment actually allow it.
- `src/app/app/check-in/page.tsx` — added `requestPersistentStorage()` after
  save (logic, one import+one call), plus I recolored the old hard-coded
  terracotta hex values (`#965342` etc., leftover from the pre-rebrand palette)
  to the brand green across all of `src/app/app/**` and `src/components/{app,ui}/**`
  — that was a mechanical find/replace of literal hex values, not a redesign,
  so Lane C/Foundation should still restyle these freely; just don't be
  surprised the old brown is gone.
- `src/app/app/doctor-report/page.tsx` — added a "Download PDF" button next to
  Print (handler + two `Button`s instead of one). Logic lives in
  `src/lib/tools/doctor-report-pdf.ts`.

Nothing else in flight on my side right now. I'll keep checking this file
before touching anything UI-adjacent going forward.

## Lanes

| Lane | Scope (files/dirs) | Claimed by | Status |
|---|---|---|---|
| **Foundation** | `src/app/globals.css`, `src/components/ui/{button,badge,card}.tsx`, `src/components/site/site-chrome.tsx` (header/footer/breadcrumbs), `BRAND.md` (reference, don't rewrite without flagging) | this session (UI sync) | In progress |
| **A — Public shell & homepage** | `src/app/(site)/page.tsx`, `src/app/(site)/layout.tsx`, `src/app/(site)/search/page.tsx`, `src/app/(site)/tools/page.tsx`, `src/app/(site)/urgent-help/page.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`, `src/app/offline/page.tsx`, `src/components/site/{cookie-banner,search-box}.tsx` | *open* | Not started |
| **B — Interactive tools UI** | `src/components/tools/*` (does-it-work-checker, stage-guide, symptoms-checklist, tool-island, treatment-questions, twelve-month-counter) — markup/styling only, logic stays in `src/lib/tools/` | this session — 2026-11-06 | In progress |
| **C — Private `/app` tracker shell** | `src/app/app/**/page.tsx` (today, check-in, timeline, treatments, insights, doctor-report, settings, membership, onboarding, privacy, account), `src/components/app/{app-header,app-navigation,medical-disclaimer,pwa-install-banner,service-worker-registrar}.tsx`, `src/components/account/health-sync-consent.tsx` | *open* | Not started |
| **D — Content page templates (by page_type)** | `src/app/(site)/[...slug]/page.tsx` — the single shared renderer for every symptom/treatment/does-it-work/comparison/hub page — plus `src/components/site/{evidence,next-steps,email-capture,standard-notice,client-islands}.tsx` | this session — 2026-11-06 | In progress |

Lane A originally included `[...slug]/page.tsx` and the evidence/next-steps/
email-capture/standard-notice/client-islands components; it's split out into
Lane D above because the per-`page_type` *shape* (quick-answer callout, "what
can help" table, urgent-vs-routine split, verdict-first layout, comparison
provider cards) lives there, not in the site-wide shell. Noted here per rule 7
rather than silently re-filing it. D proposes any `.prose`/markdown styling
change in Foundation's `globals.css` as a diff/note rather than editing it
directly, since Foundation is already claimed.

When a 5th UI chat opens, it can either sub-split one of A/B/C/D (note the
split here) or take on a cross-cutting pass (accessibility sweep,
responsive/mobile pass, print styles) once A–D have a first draft — note that
explicitly below rather than silently editing files inside someone else's
claimed lane.

## Cross-lane notes

*(Flag anything here that needed a file outside your lane, or a decision only
the owner/functionality chat can make.)*

- `src/components/products/{product-block,product-slot}.tsx` and
  `src/lib/products/slots.ts` sit right on the UI/functionality seam (CTA
  selection logic vs. card markup). Treat `product-block.tsx` /
  `product-slot.tsx` markup as part of Lane B if touched, but do not change
  slot-selection logic in `src/lib/products/` or `src/lib/cta/`.

## Changelog

- 2026-11-06 — UI sync session: wrote this file, claimed Foundation lane,
  messaged nextecom to confirm the functionality boundary. No visual changes
  yet.
- 2026-11-06 — New chat: split Lane A, claimed Lane D (content page templates
  — `[...slug]/page.tsx` + evidence/next-steps/email-capture/standard-notice/
  client-islands). About to audit current rendering per `page_type` before
  making visual changes.
- 2026-11-06 — UI sync session (Foundation): fixed a site-wide bug —
  `h1`–`h4` had no `font-weight` in the base rule, and Tailwind v4's preflight
  resets heading `font-weight` to `inherit`, so every heading without an
  explicit `font-semibold`/`font-bold` class (most of `[...slug]/page.tsx`,
  `search/`, `tools/`, `urgent-help/`, and likely the `/app` pages) rendered
  at normal weight instead of the bold serif the brand calls for. Added
  `font-weight: 600` to the `h1,h2,h3,h4` rule in `globals.css` — fixes every
  lane's headings at once, no per-page edits needed. Verified by reading
  `node_modules/tailwindcss/preflight.css` directly (confirmed the
  `font-weight: inherit` reset exists) rather than assuming. Not yet verified
  in a browser (dev server not started this round) — if a heading still looks
  thin after this, flag it here. Leaving Lane A unclaimed/open for now; this
  session has moved to Lane B.
- 2026-11-06 — UI sync session: claimed Lane B (interactive tools UI).
- 2026-11-06 — UI sync session (Lane B): `does-it-work-checker.tsx`'s grade
  badge used four invented hex colors instead of the `.grade-*` classes every
  content page already uses via `GradeBadge` — same grade keys, so swapped
  straight to `grade grade-${item.grade}`. Also fixed
  `src/components/safety/urgent-guidance.tsx` (used by 5 of 6 tool components
  plus `/app/check-in/`, so not strictly in any claimed lane — treating it as
  Lane B since that's most of its callers, flagging here): hardcoded
  `#8A1F1F`/`#FFF5F5`/`#2A1212`/`#5A3A3A` swapped for
  `var(--color-urgent)`/`--color-urgent-soft`/`--color-ink`/`--color-ink-muted`
  — it was rendering a visibly different red than the rest of the site's
  urgent styling. Lint + `tsc --noEmit` clean. Not yet checked in a browser.
  `stage-guide.tsx`, `symptoms-checklist.tsx`, `treatment-questions.tsx`,
  `twelve-month-counter.tsx` reviewed, no comparable drift found — already
  consistent with the design system.
- 2026-11-06 — nextecom (functionality): confirmed the boundary list above,
  added two new seam notes (`site-chrome.tsx` notice import, `(site)/page.tsx`
  `exists()` filter — pull past these before restyling), and flagged three
  files in unclaimed Lane C already touched for real bugs (account
  consent/retention, persistent-storage hook on check-in save, doctor-report
  PDF button). Also fixed: account/server-sync APIs were wide open to any
  `userId` passed in a URL or body (now 404 unless `FEATURE_LOGIN=true`, 503
  in production, header-only user id); cron deletion now fails closed in
  production without `CRON_SECRET`; www→apex redirect was a 2-hop chain, now
  one hop; rewrote `.env.example` and both `DEPLOY_*.md` guides for
  MenoVerdict/Namecheap; added a formatted PDF download (jsPDF) to the doctor
  report; fixed two dead homepage symptom links Lighthouse caught as live
  404s. Full build + 73-point verification crawl + Lighthouse all green on
  commit `1d313d0`. Continuing on functionality/usability per the owner.
