# MenoVerdict Brand Guidelines (`BRAND.md`)

**Brand Name:** `MenoVerdict` (always one word, capital `M` and capital `V`)  
**Domain:** `https://menoverdict.com`  
**Default Tagline:** `"Menopause answers, graded by evidence."`  
*(The site owner may override this tagline at any time via the `SITE_TAGLINE` environment variable or in `src/lib/site/config.ts`.)*

---

## 1. Brand Voice & Positioning

- **Calm, adult, and editorial:** Written for women aged 40–65 who want direct, rigorous medical answers without patronising wellness clichés.
- **Evidence-first:** Every medical option carries a clear, text-labelled evidence grade (`Strong evidence`, `Moderate evidence`, `Limited evidence`, `Not supported`, `Harm concern`) linked directly to our methodology (`/evidence/how-we-grade/`).
- **Strict honesty:** We never invent studies, quotes, or credentials, never show fake "medically reviewed" labels, and never place affiliate products in urgent, bleeding, cancer, or crisis sections.

---

## 2. Color Palette & CSS Variables (`src/app/globals.css`)

Our visual style is modeled on classic print journalism and clinical monographs: warm archival paper, crisp charcoal ink, and a deep botanical forest green accent. We explicitly avoid pink gradients, glowing pastel blobs, and stock-photo clichés. All text combinations meet or exceed **WCAG 2.2 AA** (and mostly AAA) contrast ratios.

| Token | Hex | Contrast on Paper (`#F7F6F2`) | Usage |
|---|---|---|---|
| `--color-paper` | `#F7F6F2` | — | Primary page background (warm archival paper) |
| `--color-paper-raised` | `#FFFFFF` | — | Cards, tables, product blocks, and callout surfaces |
| `--color-ink` | `#1C2321` | `15.4 : 1` (AAA) | Primary body text, headings, and wordmark |
| `--color-ink-muted` | `#48514E` | `7.9 : 1` (AAA) | Secondary metadata, dates, captions, and notices |
| `--color-rule` | `#DCDAD2` | — | Hairline borders, dividers, and table rules |
| `--color-accent` | `#1F5A4C` | `7.4 : 1` (AAA) | Brand mark, primary buttons, focus rings, and active badges |
| `--color-accent-soft` | `#E6EFEB` | — | Soft callout backgrounds and subtle highlights |
| `--color-link` | `#1D4F7A` | `8.0 : 1` (AAA) | Inline editorial and reference links |
| `--color-urgent` | `#8A1F1F` | `8.2 : 1` (AAA) | Urgent care alerts and crisis banners |
| `--color-urgent-soft` | `#FFF4F3` | — | Background surface for urgent medical alerts |

---

## 3. Typography & Spacing

- **Headings (`--font-serif`):** `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif`
  - Line-height: `1.25`, `text-wrap: balance`.
- **Body & UI (`--font-sans`):** `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
  - **Mobile & Desktop Body Minimum (`--text-base`):** `1.125rem` (`18px`) with `1.65`–`1.7` line-height and `68ch` max reading measure.
  - **Secondary Text (`--text-sm`):** `1.0625rem` (`17px`).
  - **Labels & Metadata (`--text-xs`):** `1rem` (`16px`).
- **Tap Targets (`.tap`):** Minimum `44px × 44px` on all interactive links, buttons, and form controls.

---

## 4. Logo & Icon System

### The Mark (`public/favicon.svg`, `public/logo-mark.svg`)
- An original editorial monogram and verification seal: a rounded archival square in deep botanical green (`#1F5A4C`) containing a crisp serif **`M`** paired with an integrated evidence-verdict checkmark stroke in warm paper (`#F7F6F2`).
- Designed to remain unmistakable at `16×16 px` in browser tabs while scaling cleanly to `512×512 px` on iOS and Android home screens.
- Works on both light backgrounds (deep green `#1F5A4C` container with `#F7F6F2` glyphs) and dark backgrounds (outlined or inverted).

### The Wordmark (`public/logo.svg` & Header Component)
- Combines the SVG mark with the serif wordmark **MenoVerdict** (`Meno` in `#1C2321` ink, `Verdict` in `#1F5A4C` deep green).

### Favicon & Manifest Asset Set
All generated from the master mark and served from `public/` with HTTP `200`:
- `/favicon.ico` — Multi-resolution ICO container (`16×16`, `32×32`, and `48×48` px)
- `/favicon.svg` — Scalable vector icon (`any` size)
- `/apple-touch-icon.png` — `180×180` px iOS Home Screen icon
- `/icons/icon-192.png` — `192×192` px standard web app icon
- `/icons/icon-512.png` — `512×512` px high-resolution web app icon & Organization schema logo
- `/icons/icon-maskable-512.png` — `512×512` px maskable icon with safe-zone padding for Android adaptive launchers
- `/og-default.png` — `1200×630` px default Open Graph social card carrying the MenoVerdict mark, wordmark, and tagline (`"Menopause answers, graded by evidence."`).

