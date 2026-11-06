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

Confirmed off-limits for UI chats — asked nextecom directly, update this
section once they reply:

- `src/lib/**` (content loader, CTA engine/profiles, products/slots selection
  logic, account/db-adapter, safety/urgent-triggers, tools/logic, seo/jsonld,
  plan/keyword-map)
- `src/app/api/**`
- `content/_cta/**`, `content/_plan/**` scripts output
- `scripts/**`, `migrations/**`
- `src/test/**` (functionality owns its own test coverage; UI chats add
  component tests only inside their own lane if asked)

*(Awaiting nextecom's reply on anything else in-flight right now — check this
file again before editing `src/components/products/*`, `src/components/app/*`,
or `src/components/account/*`, since those sit closest to the CTA/account logic
nextecom owns.)*

## Lanes

| Lane | Scope (files/dirs) | Claimed by | Status |
|---|---|---|---|
| **Foundation** | `src/app/globals.css`, `src/components/ui/{button,badge,card}.tsx`, `src/components/site/site-chrome.tsx` (header/footer/breadcrumbs), `BRAND.md` (reference, don't rewrite without flagging) | this session (UI sync) | In progress |
| **A — Public shell & homepage** | `src/app/(site)/page.tsx`, `src/app/(site)/layout.tsx`, `src/app/(site)/[...slug]/page.tsx`, `src/app/(site)/search/page.tsx`, `src/app/(site)/tools/page.tsx`, `src/app/(site)/urgent-help/page.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`, `src/app/offline/page.tsx`, `src/components/site/{evidence,next-steps,email-capture,standard-notice,cookie-banner,search-box}.tsx` | *open* | Not started |
| **B — Interactive tools UI** | `src/components/tools/*` (does-it-work-checker, stage-guide, symptoms-checklist, tool-island, treatment-questions, twelve-month-counter) — markup/styling only, logic stays in `src/lib/tools/` | *open* | Not started |
| **C — Private `/app` tracker shell** | `src/app/app/**/page.tsx` (today, check-in, timeline, treatments, insights, doctor-report, settings, membership, onboarding, privacy, account), `src/components/app/{app-header,app-navigation,medical-disclaimer,pwa-install-banner,service-worker-registrar}.tsx`, `src/components/account/health-sync-consent.tsx` | *open* | Not started |

When a 4th UI chat opens, it can either sub-split one of A/B/C (note the split
here) or take on a cross-cutting pass (accessibility sweep, responsive/mobile
pass, print styles) once A–C have a first draft — note that explicitly below
rather than silently editing files inside someone else's claimed lane.

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
