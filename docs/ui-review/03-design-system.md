# Design system: direction A "Reading Room", plus B's touches

Live page: **`/dev/design-system/`** (noindex). Screenshots: `docs/ui-review/design-system/` at 375 / 768 / 1280 px,
light and dark.

## What's in it

| Piece | Where | Notes |
|---|---|---|
| Tokens (light + dark) | `src/app/tokens.css` | `--ink --ink-muted --paper --paper-raised --paper-sunk --accent --link --rule --urgent --brass`, grade fills, inks and softs. Dark: deep green-black `#141B19`, parchment text `#E6E1D6` (no pure black or white). Follows the OS, or `html[data-theme]`. |
| Type | `src/app/layout.tsx` (next/font, self-hosted, subset) | Newsreader (headings, optical sizes), Atkinson Hyperlegible Next (body). 18 px body on phones, 19 px desktop, line height 1.7, 68 ch measure. |
| Component styles | `src/app/ds-components.css` | In `@layer components`, so a utility still wins. |
| Theme + text size | `lib/site/display.ts`, `ui/display-controls.tsx` | System / Light / Dark and A / A+ / A++. Applied before paint (no flash). Kept in localStorage only with preferences consent, otherwise for the visit. Added to `PREFERENCE_KEYS` so "Essential only" clears it. |
| Grade meter, badge, explain popover | `ui/grade.tsx` | 5 steps, Harm concern → Strong. Icon + word, never colour alone. "What does … mean?" is a native `[popover]` (zero JS), rendered once per page by `<GradeExplainers/>` in the site layout. |
| Callouts | `ui/callout.tsx` | Short answer (B's serif pull-quote), Try tonight (brass, B's italic numerals), See a doctor if… (red flag), Ask your doctor (Copy + Print), What the evidence says, Comfort not treatment, Who should be careful. Plus `.urgent-block`. |
| Notice | `site/honesty-notice.tsx` (restyled) | Index card with a stamp and a double rule. Copy is still only in `lib/site/honesty.ts`. |
| Product card | `.product-card` (CSS + sample on the DS page) | Dashed frame on sunk paper, "Paid link" tag, grade, "What it won't do", "Check first". The real `products/*` components are not changed yet (content owned by the nextecom session). |
| Citation popover | `ui/citation.tsx` | Native `[popover]`; the number still links to References. |
| Tables → cards < 600 px | `.prose table:has(td[data-label])` | Needs `data-label` on cells (the markdown pipeline adds it in the article step). |
| Accordion, tabs, step list, progress (bar, dots), toast, bottom sheet, mini-TOC (rail + sheet) | `ds-components.css`, `ui/interactive.tsx` | Sheet = `<dialog>`; reading progress = CSS scroll-driven (no JS). |
| Illustrations + diagrams | `ui/illustrations.tsx` | 6 line illustrations (no faces), accessible transition timeline (with a "you are around here" marker), and a "how a hot flash happens" step diagram. |

States shown on the page: default, hover/focus/active (live), disabled, loading (`aria-busy` spinner), error
(`aria-invalid` + message), and empty/skeleton.

Motion: 150–250 ms, and everything stops under `prefers-reduced-motion`. The old spinning card borders, drifting
orbs and scanning sweeps are switched off (audit #14).

`/app/*` is pinned to the light theme (`.app-shell` in tokens.css) until those screens are redesigned, because
they still hard-code light colours in about 500 places.

## Contrast (WCAG 2.2 AA), computed from the tokens

Text needs 4.5:1; UI boundaries and meter fills need 3:1.

| Pair | Needs | Light | Dark |
|---|---|---|---|
| `--ink` on `--paper` | 4.5:1 | 14.0 | 13.4 |
| `--ink` on `--paper-raised` | 4.5:1 | 15.2 | 12.2 |
| `--ink-muted` on `--paper` | 4.5:1 | 7.0 | 8.0 |
| `--ink-muted` on `--paper-raised` | 4.5:1 | 7.6 | 7.3 |
| `--ink-faint` on `--paper` (decorative only) | 3:1 | 4.4 | 5.1 |
| `--link` on `--paper` | 4.5:1 | 7.7 | 9.7 |
| `--link` on `--paper-raised` | 4.5:1 | 8.3 | 8.8 |
| `--accent` on `--paper` | 3:1 | 7.1 | 8.6 |
| `--on-accent` on `--accent` | 4.5:1 | 7.7 | 8.5 |
| `--brass` on `--brass-soft` | 4.5:1 | 5.3 | 8.3 |
| `--urgent` on `--urgent-soft` | 4.5:1 | 6.9 | 7.6 |
| `--urgent` on `--paper` | 4.5:1 | 7.0 | 8.2 |
| grade inks on their soft backgrounds (6 grades) | 4.5:1 | 7.1–7.7 | 8.6–9.8 |
| grade inks on `--paper-raised` (5 grades) | 4.5:1 | 8.1–8.9 | 8.4–9.7 |
| grade meter fills on empty segments (5 grades) | 3:1 | 3.7–4.9 | 5.5–6.7 |
| `--rule-strong` (input/chip borders) on `--paper-raised` | 3:1 | 3.7 | 3.4 |
| `--focus` ring on `--paper` | 3:1 | 7.1 | 10.4 |

Two pairs failed on the first pass and were fixed: the light "Limited" meter fill (2.8 → 3.8) and input/chip
borders (2.1 → 3.7 light, 2.0 → 3.4 dark).

## Also in this step

- The tracker's top "Not medical advice…" strip has a close (×) button (requested by the owner). The strip stays in
  the server HTML (`validate:honesty`), and the full notice stays in the tracker footer. It's remembered with
  preferences consent (`menoverdict_notice_dismissed`), otherwise for the visit.

## Known issues

- `src/test/content-gate.test.ts` has 2 failing tests ("fails when a required field is missing", "determines medical
  review honesty correctly"). They're in the content loader, which this branch doesn't touch, so they predate this work.
