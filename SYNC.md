# UI build sync — 4 parallel chats

A separate chat owns backend/functionality work directly on `site-rebuild` in the
main checkout. These four chats own **UI only**, each in its own git worktree so
no two chats can overwrite the same file on disk. Merge back to `site-rebuild`
in small, reviewable PRs/commits — don't work for days unmerged.

| Lane | Branch | Worktree path | Owns |
|---|---|---|---|
| A — Design system & chrome | `ui/design-system` | `.claude/worktrees/ui-design-system` | `src/components/ui/*` (button, card, badge, future primitives), `src/app/globals.css`, Tailwind theme/tokens, `src/app/layout.tsx`, `src/components/site/site-chrome.tsx`, `src/components/site/cookie-banner.tsx`, `src/components/site/standard-notice.tsx` |
| B — Content templates | `ui/content-templates` | `.claude/worktrees/ui-content-templates` | `src/app/(site)/[...slug]/page.tsx` and the page-type templates it renders (symptom, does-it-work, treatment, comparison, hub), `src/components/site/evidence.tsx`, `src/components/site/next-steps.tsx`, `src/components/site/email-capture.tsx`, `src/components/site/search-box.tsx`, `src/components/products/*` |
| C — Tools UI | `ui/tools` | `.claude/worktrees/ui-tools` | `src/app/(site)/tools/*`, `src/components/tools/*` (stage-guide, treatment-questions, twelve-month-counter, symptoms-checklist, does-it-work-checker, tool-island), `src/components/safety/urgent-guidance.tsx` |
| D — App dashboard UI | `ui/app-dashboard` | `.claude/worktrees/ui-app-dashboard` | `src/app/app/*` pages (today, check-in, timeline, treatments, insights, doctor-report, settings, membership, onboarding) — presentation only, not the API routes or `account-client.tsx` logic (that's the functionality chat's), `src/components/app/app-header.tsx`, `src/components/app/app-navigation.tsx`, `src/components/app/pwa-install-banner.tsx`, `src/components/app/medical-disclaimer.tsx` |

Lane A is foundational — the other three lanes consume its primitives and tokens.
Pull/rebase `ui/design-system`'s merged commits into your lane soon after they land
on `site-rebuild`, rather than re-inventing a button or color locally.

## How to join a lane

In the new chat, point it at the lane's worktree path above (or say
"work in `.claude/worktrees/ui-tools`" etc.) instead of the repo root. Each
worktree is already on its own branch, branched from `site-rebuild` at commit
`9012162`.

## Protocol

1. **Stay inside your lane's file list.** If a page needs a change outside it
   (e.g. a content template needs a new design-system primitive), say so in this
   file under "Cross-lane requests" instead of editing it directly — or ask Lane A.
2. **Commit small and often**, on your own branch, with real messages. Don't let
   work sit uncommitted — that's the whole reason each lane has its own worktree.
3. **Before editing a shared/foundational file** (`globals.css`, `tailwind` config,
   anything under `src/components/ui/`), check this file's "In progress" log below
   — if another lane is already touching it, coordinate before duplicating work.
4. **Merging back to `site-rebuild`**: open a PR or ask the owner before merging;
   don't force-push or merge another lane's branch yourself.
5. Functionality (API routes, auth, data, account logic) stays with the other
   chat — UI lanes change presentation, not request handlers or data shape. If a
   UI change needs a data/shape change, log it under "Cross-lane requests".

## In progress (update when you start/finish touching a shared file)

- Lane A — `src/components/ui/{badge,button,card}.tsx` — 2026-11-06 — done: replaced
  hardcoded hex (several off-brand/drifted, including a peach badge border not in
  BRAND.md's palette) with the `--color-*` tokens from `globals.css`. No API/props
  changes, so nothing else needs to adjust call sites. PR: https://github.com/Bilalabbasid/women/pull/1
- Lane A — `src/app/(site)/page.tsx` ("Latest articles & evidence updates") —
  2026-11-06 — done: the homepage's recent-updates feed only excluded
  `page_type: legal`, so the two `page_type: about` pages (About us, How we make
  money) showed up next to real evidence content. Added `about` to the same
  exclusion. Owner-requested ("remove these blogs they are useless"). Not
  live-verified in a browser — port 3000's dev server belongs to another session
  (root checkout, PID visible in Next's own lock message), so didn't want to
  kill it; lint is clean and the fix is a one-line filter addition matching the
  existing `legal` exclusion pattern.

## Cross-lane requests

- **Heads up for lanes B/C/D:** there's a second, older coordination file,
  `UI_SYNC.md` (not this one), under which several other chats have been
  working directly in the root checkout (`C:\Users\bilal.abbasi\Desktop\Redit`,
  no worktree isolation) with their own "Foundation"/Lane A–E split — not the
  same lanes as this file's A–D. Local `site-rebuild` already has 15+ commits
  from that scheme not yet pushed to origin. Before doing substantial work in
  your lane's file list, check `UI_SYNC.md` in the root checkout for whether
  the same files/components are already being worked there, to avoid the kind
  of duplicate fix Lane A hit (see "In progress" above — flagged in both docs,
  logged in `UI_SYNC.md` commit `4f204d2`). If you merge `site-rebuild` into
  your worktree branch, diff carefully against anything in your lane's scope
  before committing on top of it.
