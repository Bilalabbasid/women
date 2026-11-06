# Affiliate Placement Notes (Prompt 3: Amazon Product Placement)

**Date:** November 6, 2026  
**Auditor:** Antigravity Pairing Assistant  
**Subject:** Site architecture mapping, product system, disclosure review, and placement plan for the nine Amazon affiliate products.

---

## 1. Technical Framework & Content Architecture

- **Framework:** Next.js 16 (App Router with Turbopack, React 19, TypeScript, Tailwind CSS v4).
- **Rendering Model:** Static Site Generation (SSG) / Static HTML output for all public content pages (`generateStaticParams`, dynamicParams = false).
- **Article Location & Format:**
  - Content lives as Markdown files in `content/pages/` organized by cluster subdirectories (e.g., `content/pages/symptoms/`, `content/pages/treatments/`, `content/pages/perimenopause/`, `content/pages/does-it-work/`, `content/pages/care/`, `content/pages/about/`).
  - Strict YAML frontmatter adheres to `src/lib/content/schema.ts` validated at build time via `npm run validate:content`.
  - Content parsing is handled by `src/lib/content/markdown.ts` using unified/remark/rehype with custom container directives (`:::urgent`, `:::questions`, `:::note`) and custom island directives (`::tool{id="..."}`, `::product-slot{id="..."}`).
  - Article route: `src/app/(site)/[...slug]/page.tsx` maps URLs to `content/pages/` paths and handles layout, disclosures, evidence grades, JSON-LD, TOC, tool islands, product slots, doctor questions tools, and citations.

---

## 2. Existing Articles & Topic Inventory

### Current Content Pages in Codebase:
| URL | Title | Cluster | Page Type | Status |
| --- | --- | --- | --- | --- |
| `/symptoms/` | Menopause Symptoms: Evidence-Based Guides | symptoms | hub | published |
| `/symptoms/night-sweats/` | Night Sweats: Why They Happen and How to Get Sleep | symptoms | symptom | published |
| `/symptoms/hot-flashes/` | Hot Flashes: Why They Happen and What Actually Helps | symptoms | symptom | published |
| `/perimenopause/` | Perimenopause: What to Expect and How to Manage It | perimenopause | hub | published |
| `/perimenopause/early-signs/` | Early Signs of Perimenopause: 8 Changes to Watch For | perimenopause | guide | published |
| `/perimenopause/questions-for-your-doctor/` | Questions to Ask Your Doctor About Perimenopause | perimenopause | guide | published |
| `/treatments/` | Menopause Treatments: What Works, What Might, and What Doesn't | treatments | hub | published |
| `/treatments/hormone-therapy/boxed-warning/` | FDA Boxed Warning on Menopausal Hormone Therapy | treatments | treatment | published |
| `/does-it-work/` | Does It Work? Evidence Checks for Menopause Remedies | does-it-work | hub | published |
| `/does-it-work/magnesium/` | Magnesium for Menopause: What the Evidence Shows | does-it-work | does_it_work | published |
| `/tools/symptom-tracker/` | Symptom Tracker & Doctor Summary | tools | tool | published |
| `/tools/symptoms-checklist/` | Menopause Symptoms Checklist | tools | tool | published |
| `/evidence/` | How We Evaluate Evidence | evidence | evidence | published |
| `/evidence/how-we-grade/` | How We Grade Evidence: Our 5-Tier Scientific System | evidence | evidence | published |
| `/evidence/updates/` | What Changed: Menopause Science & Policy Updates | evidence | evidence | published |
| `/about/` | About Menowell | about | about | published |
| `/about/how-we-make-money/` | How We Make Money | about | about | published |
| `/medical-disclaimer/` | Medical Disclaimer | site | legal | published |
| `/privacy/` | Privacy Policy | site | legal | published |
| `/terms/` | Terms of Service | site | legal | published |
| `/cookies/` | Cookie Notice | site | legal | published |

### Mapping Prompt 3's 10 Target Topics to Existing vs. New URLs:

| Prompt 3 Target Article | Reader Question | Target URL | Existing or New | Products to Place |
| --- | --- | --- | --- | --- |
| **Vaginal dryness after menopause: what actually helps** | Why is this happening, and what can I do? | `/symptoms/vaginal-dryness/` | New (planned in `keyword-map.csv` line 50) | Replens, Revaree, Uberlube |
| **Vaginal moisturiser vs lubricant: which do you need?** | Which one should I buy? | `/care/moisturizers-and-lubricants/` | New (planned in `keyword-map.csv` line 129) | Replens, Revaree, Uberlube |
| **Painful sex in perimenopause and menopause** | Is this normal, and how do I make sex comfortable again? | `/symptoms/painful-sex/` | New (planned in `keyword-map.csv` line 51) | Uberlube, Replens |
| **Bladder leaks in menopause** | Why am I leaking, and what helps? | `/symptoms/incontinence/` | New (planned in `keyword-map.csv` line 55) | Elvie Trainer |
| **How to do pelvic floor exercises correctly** | Am I doing Kegels right? | `/care/pelvic-floor-exercises/` | New | Elvie Trainer |
| **Night sweats: how to sleep cooler tonight** | How do I stop waking up soaked? | `/symptoms/night-sweats/` | **Existing - Upgrade in place** | Cool-jams, BedJet |
| **Best sleepwear for night sweats: how to choose** | What should I wear to bed? | `/care/sleepwear-for-night-sweats/` | New | Cool-jams |
| **Cooling your bed: fans, sheets and climate systems compared** | Is a bed cooling system worth it? | `/does-it-work/cooling-products/` | New (planned in `keyword-map.csv` line 108) | BedJet |
| **Menopause books worth reading, chosen by evidence** | Which books can I trust? | `/care/menopause-books/` | New (planned in `keyword-map.csv` line 130) | All three books (Manifesto, New Menopause, Next Level) |
| **Strength training through menopause** | What exercise should I do now? | `/does-it-work/exercise/` | New (planned in `keyword-map.csv` line 107) | Next Level |

### Hub Page "Further Reading" Additions:
- `/perimenopause/` -> Add recommendation for *The Menopause Manifesto* by Dr Jen Gunter.
- `/treatments/` (HRT) -> Add recommendation for *The New Menopause* by Dr Mary Claire Haver.
- `/symptoms/` -> Add recommendation for *The Menopause Manifesto* by Dr Jen Gunter.
- `/does-it-work/exercise/` -> Recommends *Next Level* by Dr Stacy Sims.

---

## 3. Product & Affiliate Component Review

- **Current Implementation:**
  - `content/_products/slots.yaml`: defines category slots (`vaginal-moisturizer`, `water-silicone-lubricant`, `pelvic-floor-trainer`, `moisture-wicking-sleepwear`, `bedside-cooling-fans`, `cooling-bedding`, `menopause-guidebook`, `home-strength-equipment`, etc.).
  - `src/lib/products/slots.ts`: loads slots and product items.
  - `src/components/products/product-slot.tsx`: renders editorial fallback when empty, and generic partner cards when filled.
- **Upgrades Required for Prompt 3:**
  1. Create a central product catalog `content/_products/products.yaml` storing all 9 Amazon affiliate products with ASIN, exact Amazon URL, short link, Situation line ("Best for"), clinical justification ("Why we included it"), explicit limitation ("What it won't do"), and precautions ("Who should check first").
  2. Implement a dedicated reusable product block component conforming exactly to Prompt 3:
     - Clear product title (no prices, ratings, review counts, stars, or copied Amazon photos).
     - **Best for:** situatie context.
     - **Why we included it:** 1-2 objective, evidence-based sentences.
     - **What it won't do:** 1 honest limitation sentence.
     - **Who should check first:** clinical precautions.
     - Direct button: "Check it on Amazon" pointing straight to the unshortened, uncloaked Amazon URL (no `/go/` redirects).
     - Attributes: `rel="sponsored nofollow noopener" target="_blank"`.
     - Direct label: "Paid link: we may earn a commission. We aren't doctors. Read the product label and ask a doctor or pharmacist if you're unsure it suits you."
  3. Support both `<Product id="..." />` and `<ProductSlot id="..." />` inside content markdown via `src/lib/content/markdown.ts`.

---

## 4. Disclosures, Legal Pages & Site Chrome

- **Existing Disclosures:**
  - `content/pages/about/how-we-make-money.md`: Documents affiliate revenue, editorial separation, and no pay-for-play policy.
  - `src/components/site/site-chrome.tsx`: Footer currently contains standard clinical notice, links to `/about/how-we-make-money/`, `/medical-disclaimer/`, `/privacy/`, `/terms/`, `/cookies/`.
  - `src/app/(site)/[...slug]/page.tsx`: Contains an affiliate disclosure bar if `fm.affiliate_disclosure: true`.
- **Upgrades Required for Amazon & FTC Compliance:**
  1. Add mandatory Amazon Associates statement: `"As an Amazon Associate we earn from qualifying purchases."`:
     - Displayed on every page containing an Amazon product block, positioned near the top of the article.
     - Displayed permanently in the site footer (`src/components/site/site-chrome.tsx`).
     - Stated prominently in `content/pages/about/how-we-make-money.md`.
  2. Verify that no Amazon links exist in printable reports or doctor summaries (`src/app/app/doctor-report/`).
  3. Ensure zero banned words ("cure", "miracle", "clinically proven", "balance your hormones") in product copy.

---

## 5. Site Graph, Sitemap & Structured Data Architecture

- **Site Graph:** `content/_plan/site-graph.json` generated from page frontmatter and `keyword-map.csv`. Build gate `scripts/validate-graph.ts` enforces:
  - Max click depth ≤ 3 from homepage.
  - No orphan pages.
  - Outgoing internal links ≥ 3 per content article.
  - Anchor text diversity and canonical alignment.
- **Sitemap:** `src/app/sitemap.ts` dynamically traverses all publishable pages from `getSiteData().pages`.
- **Structured Data:** `src/lib/seo/jsonld.ts` generates schema.org `Article`, `MedicalWebPage`, `BreadcrumbList`, and `FAQPage`.
- **Integrity Plan:**
  - All new articles must be linked from at least 2 existing pages and to their cluster hub.
  - Existing hub pages and related articles will be updated to link bidirectionally.
  - Run `npm run validate:source`, `npm test`, and `npm run build` after all additions.

---

## 6. Tracking IDs Notice

- **Replens Long-Lasting Vaginal Moisturizer:** Tracking ID is `blackxpace05-20`.
- **Other 8 Products:** Tracking ID is `buynow01c3-20`.
- **Note:** Both IDs will be preserved exactly as provided in Prompt 3, and documented in `AFFILIATE_PLACEMENT_REPORT.md` for the owner.

