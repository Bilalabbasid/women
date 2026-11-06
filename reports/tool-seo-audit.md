# Tool-page SEO audit (Lane G)

Date: 2026-11-06. Scope: the six tool guides in `content/pages/tools/` and the `/tools/` hub (`src/app/(site)/tools/page.tsx`).

Commits: `cbbec89` (checklist, stage guide, 12-month counter), `cd060d0` (tracker, evidence checker, HRT questions), `4646fac` (tools hub).

## Method and limits

- **SERP evidence:** I looked at live US web results (WebSearch) for 2 to 3 queries per tool on 2026-11-06. Firecrawl was out of credits, so I had no People Also Ask boxes, ranking positions or SERP features. Search results tell me which kinds of pages rank and what they offer. They don't tell me where any page ranks.
- **Volumes and difficulty: not measured.** No keyword tool export was available, and AGENTS.md forbids estimating them. Every volume/difficulty cell in `content/_plan/keyword-map.csv` is still blank. See "Owner data still needed" below.
- **FAQ questions** come from questions that recur in the competing results, from the page's own search intent, and from gaps those results leave. They don't come from scraped PAA boxes.
- **Medical claims:** every new medical statement cites a source that is already in `content/_sources/sources.yaml` and marked `verified: true` (STRAW+10, NICE NG23, NHS, The Menopause Society 2022/2023, FDA 2025/2026, Bayer/FDA Lynkuet approval, SWAN Avis 2015, Appiah 2021). I added no new sources. I also avoided multi-source citation brackets (`[@a; @b]`), because the renderer currently prints them as raw text (bug logged in UI_SYNC.md).
- **Primary keywords are unchanged.** `validate:plan` requires them to match `keyword-map.csv`, which belongs to the plan owner. I changed titles, descriptions, H1s (where intent clearly improved), body, FAQs and frontmatter secondary keywords only. No URLs or slugs changed.

## Changes common to every tool page

- **Tool first:** each page opens with a 68 to 80-word stand-alone answer, then the tool. Explanation, how-to, method, example and limits come after the tool.
- **How it works:** each page now has numbered how-to steps, how the tool gets its result (or what it covers), and a worked example where one makes sense.
- **Saved data:** each page explains that entries are saved in this browser on this device with dated history, with no account, and what clearing browser data does. This matches Lane F's storage work. It makes no cloud claims.
- **FAQs:** five page-specific questions per page, with no question repeated on another page. They render as visible content, and the existing renderer emits `FAQPage` JSON-LD for them. **Rich results are unlikely:** since August 2023 Google shows FAQ rich results only for well-known, authoritative government and health sites. The markup is accurate to the visible content, which is why it's kept (AGENTS.md: "without assuming it will earn a rich result").
- **Internal links:** 6 to 11 contextual links per page, to sibling tools and live articles. Anchor text is varied, because the link audit already flags several tool anchors as overused elsewhere on the site. All targets were checked against published pages (0 dead links).
- **Change log:** a material entry was added on each page. `updated_at` stays 2026-11-06.

## Tool by tool

### 1. Perimenopause symptoms checklist — `/tools/symptoms-checklist/`

- **Primary:** perimenopause symptoms checklist (unchanged). **Secondary:** menopause symptoms checklist printable, free perimenopause checklist.
- **SERP evidence:** printable PDFs from public bodies (Jean Hailes, NSW Government, whose version is based on the Greene Climacteric Scale, and Health Translations Victoria), paid creator downloads (Payhip, Gumroad), "34 symptoms" listicles, and email-gated freebies. The intent is a tickable list to take to an appointment. **Gap:** an interactive list with no email gate or download, links from each symptom to its explainer, urgent-symptom flags, and saved dated copies.
- **Title:** "Perimenopause symptoms checklist you can print" → "Perimenopause symptoms checklist: save & print" (60 chars with site name).
- **Description:** rewritten to cover the tick, save and print steps, plus "free, no sign-up, no score" (152 chars).
- **H1:** unchanged ("Perimenopause symptoms checklist").
- **Outline:** How to use the checklist / What's on the list, and why (H3 What it can't do) / A worked example / How clinicians usually identify perimenopause / When to get help now / Questions to take to your appointment / Your saved lists stay on this device / Related tools and guides.
- **New content:** 4-step how-to; an honest answer to the "34 symptoms" lists (NICE describes groups, not a count); how this differs from validated scored scales; a worked NICE example at age 47.
- **FAQs:** How many symptoms do I need to tick to be in perimenopause? / Is there an official list of 34 perimenopause symptoms? / Do I need a blood test to know if I'm in perimenopause? / Is this the Greene Climacteric Scale or the Menopause Rating Scale? / Can I save my checklist and compare it later?
- **Schema:** MedicalWebPage, BreadcrumbList, FAQPage, WebApplication (the last emitted because the tool renders on the page).

### 2. Perimenopause stage guide — `/tools/stage-guide/`

- **Primary:** am i in perimenopause quiz (unchanged). **Secondary:** perimenopause quiz (new), perimenopause test online, what stage of menopause am i in.
- **SERP evidence:** commercial quizzes dominate (GoodRx, Natural Cycles, Knix, The Pause Life, which scores you, Jotform quizzes and others). Most score you or collect an email, and few show the criteria they use. Authoritative STRAW+10 explanations sit in clinical outlets (Healio, Pharmaceutical Journal). **Gap:** a quiz that shows the actual published criteria behind its answer, with no score and no email.
- **Title:** "Perimenopause stage guide (STRAW+10 explained)" → "Am I in perimenopause? Free stage quiz (STRAW+10)" (63).
- **H1:** "Where am I? Perimenopause stage guide" → "Am I in perimenopause? Stage guide", which uses the searcher's own question.
- **Outline:** How the stage guide reads your answers (H3 A worked example; H3 When the guide can't place you) / How the STRAW+10 staging criteria work / Why blood tests are rarely used at 45 and over / When to get help now / Your answers stay on this device / Next steps.
- **New content:** a table mapping each period-pattern answer to its STRAW+10 stage; why age and hot flashes matter (NICE); a worked example at 46 with 24- and 35-day cycles; when the guide can't place you; links to `/perimenopause/stages/`, `/perimenopause/vs-menopause/` and `/perimenopause/irregular-periods/`. The `/perimenopause/stages/` article keeps "stages of perimenopause" as its primary keyword, and this page keeps the quiz intent.
- **FAQs:** Can a perimenopause quiz tell me for sure…? / What are the stages of perimenopause? / Why doesn't this quiz give me a score? / What if I have a Mirena IUD or had a hysterectomy? / Can I see how my answers change over time?
- **Schema:** as for the checklist.

### 3. 12-month counter — `/tools/12-month-counter/`

- **Primary:** 12 months no period menopause (unchanged). **Secondary:** how long without a period is menopause, menopause calculator last period (new), 12 month no period counter (new).
- **SERP evidence:** mostly low-quality "menopause age calculators" (many scraped mirror sites) that try to predict an age; question pages (Ubie, Vichy, HealthTap); one outlier (A.Vogel) that says two years. **Gap:** a credible counter based on NICE and STRAW+10 that handles resets and bleeding safety, and honestly says it can't predict. The age-prediction intent was deliberately not targeted, because AGENTS.md bans age predictors. The page answers it in a section instead.
- **Title:** "12-month no-period menopause counter & guide" → "12 months without a period? Menopause day counter" (63).
- **H1:** "12-month counter" → "12 months without a period: menopause counter".
- **Outline:** How the 12-month count is calculated / Why the clock resets, and long gaps before the final period / When the 12-month rule doesn't apply / Can it predict when you'll reach menopause? / When to get help now / Your period dates stay on this device / Next steps.
- **New content:** the counter's calculation, with a dated reset example; contraception, HRT, hysterectomy and under-40 limits; average US age at natural menopause (49.9 years in 2015 to 2018; 11.8% at 40 to 45; Appiah 2021) to explain why no calculator can predict your date; links to `/postmenopause/bleeding/`, `/menopause/diagnosis/` and `/menopause/age/`.
- **FAQs:** How long without a period is menopause? / If I get a period at month 10 or 11…? / What if I spot or bleed after reaching 12 months…? / Does the count work if I'm on the pill, have a hormonal IUD or take HRT? / Can this counter predict when I'll reach menopause?
- **Depends on Lane F:** the example says logged period dates "stay listed so you can see the gaps between them". That assumes Lane F's saved-history list ships for this tool. If it doesn't, soften that sentence.

### 4. Symptom tracker and doctor report — `/tools/symptom-tracker/`

- **Primary:** menopause symptom tracker (unchanged). **Secondary:** unchanged.
- **SERP evidence:** paid printables (Etsy, Payhip, Gumroad), free PDFs (Healthline, Queen Mary University of London HR, Quest), and dozens of new app-store apps, several of which make "no account, on-device" claims. **Gap:** free, nothing to install, no account, a doctor report, and a backup file.
- **Title:** "Menopause symptom tracker with a printable doctor report" (68 chars with site name, over the 65 limit) → "Free menopause symptom tracker & doctor report" (60).
- **H1:** "Symptom tracker and doctor report" → "Menopause symptom tracker and doctor report".
- **Outline:** How it works / What you can record / Daily or weekly / Your doctor report / Edit, delete or back up your entries / What the tracker doesn't do / When to get help now / Your privacy.
- **New content:** 3-step how-to, worded to match the current app (edit a past day by choosing its date in check-in; delete it from the timeline); why weeks of records help (SWAN: frequent hot flashes and night sweats lasted a median of 7.4 years); the backup, range-delete and "never auto-deleted" policy; a link to the HRT question builder.
- **FAQs:** Do I need to download an app? / Is this a validated menopause rating scale? / Where are my entries stored? / What happens to my entries if I clear my browser or change phone? / Can I log once a week instead of every day?
- **Schema gap:** the page has no `::tool` marker (the tracker lives at `/app/`), so the renderer emits no `WebApplication` for it. See proposed diff B.

### 5. Evidence checker — `/tools/does-it-work-checker/`

- **Primary:** menopause treatment evidence (unchanged). **Secondary:** menopause supplement checker, which menopause treatments work (new). "do menopause supplements work" was avoided because it is `/does-it-work/`'s primary keyword.
- **SERP evidence:** results are dominated by old material (a 2004 NAMS summary on AAFP, 2022 UPI/HealthDay coverage, CBS), GoodRx, and a 2022 Spanish Menopause Society statement that dissents on black cohosh. One summary still says paroxetine is the only approved non-hormonal drug. **Gap:** a current, graded and sourced lookup that includes fezolinetant and the October 2025 elinzanetant approval.
- **Title:** "Menopause treatment & supplement evidence checker" → "Which menopause treatments work? Evidence checker" (63).
- **H1:** "Does it work? Evidence checker" → "Does it work? Menopause treatment evidence checker".
- **Outline:** How to use the evidence checker / What the evidence grades mean / Why a lot of hot flash advice online is out of date / Detailed verdicts you can read next / When to get help now / Your shortlist stays on this device.
- **New content:** 4-step how-to with a filter example; "grade the use, not the product"; an out-of-date-advice section; more links to verdicts (black cohosh, soy, fezolinetant, elinzanetant, is HRT right for me, the non-hormonal hub). Fixed a multi-citation bracket that rendered as raw `[@…; @…]` text.
- **FAQs:** Which non-hormonal treatments have the best evidence for hot flashes? / Do menopause supplements like black cohosh work for hot flashes? / Why are most menopause supplements graded not recommended…? / Does Strong evidence mean a treatment is right for me? / Does anyone pay to be listed or graded higher?

### 6. HRT and treatment question builder — `/tools/treatment-questions/`

- **Primary:** questions to ask about hrt (unchanged). **Secondary:** added questions to ask about hormone therapy.
- **SERP evidence:** a BMJ patient leaflet, NHS trust material, Abbott, Pfizer (AU) and Theramex printables, clinic blogs (BodyLogicMD and others), and Payhip kits. The common question themes are suitability, type and route, risks, side effects, duration and stopping, alternatives, blood tests and review timing. **Gap:** picks only the topics you choose, covers the 2025–26 FDA label change, prints, and saves dated sheets per appointment. Kept separate from `/perimenopause/questions-for-your-doctor/` (perimenopause intent).
- **Title:** "Questions to ask your doctor about HRT & treatment" → "Questions to ask your doctor about HRT (printable)" (64).
- **H1:** "Treatment conversation builder" → "Questions to ask your doctor about HRT and menopause treatment".
- **Outline:** How to use the question builder / What the questions cover, and why / How to pair this sheet with your symptom log / When to get help now / Your question sheets stay on this device.
- **New content:** a 4-step how-to; what each topic covers, with sources (NAMS 2022 timing, FDA Nov 2025 request and Feb 2026 approvals, NAMS 2023, Veozah liver monitoring, GSM, NICE NG123); links to is HRT right for me, patch vs pill, boxed warning, non-hormonal, and the evidence checker.
- **FAQs:** What questions should I ask my doctor before starting HRT? / What should I bring to a menopause or HRT appointment? / What changed with the FDA boxed warning on HRT? / Does this tool recommend which hormone therapy…? / Are my notes sent to a server? (The old answer said "localStorage", which is out of date now that Lane F is moving storage to IndexedDB.)

### Tools hub — `/tools/`

- **Title:** "Free menopause tools: tracker, checklist & stage guide" → "Menopause tools: tracker, checklist & stage quiz" (62). **Description:** 155 chars, names all six tools.
- **H1:** "Free private menopause tools" → "Free menopause and perimenopause tools".
- **Layout:** tools are grouped by the question readers arrive with ("Wondering whether it could be perimenopause", "Keeping track over weeks and months", "Weighing up treatment"), each with a one-line "use it when". Unknown future tool pages fall into "More tools". Added a section on how the tools store data and a "Read next" list (perimenopause, symptoms, treatments, does-it-work). Still a server component.
- **Schema:** removed a duplicate tracker `WebApplication` that pointed at the noindexed `/app/today/`. It now emits BreadcrumbList plus one `WebApplication` per tool guide.

## Technical checks

| Check | Result |
|---|---|
| Rendered through the site's own loader/renderer (`renderPage`) | Tool appears after a 68–80-word intro on every page that has one; 0 dead internal links; 0 raw citation brackets |
| Titles (with " \| MenoVerdict") | 60–64 chars, all unique |
| Descriptions | 146–155 chars, all unique |
| `validate:content` | 0 errors on tool pages (17 site-wide errors are all on pages other sessions are mid-writing: `care/*`, `symptoms/{bloating,breast-tenderness,dry-itchy-skin,hair-thinning}`, `postmenopause/heart-health`, `evidence/products-we-wont-recommend`) |
| `validate:links` | 0 errors; tool-page anchors varied (other pages still overuse "treatment conversation builder", 24×) |
| `validate:plan` | 0 errors |
| `validate:graph` | 0 errors on tool pages (4 click-depth errors on `/perimenopause/{heavy-periods,how-long,in-your-30s,pregnancy}`, not mine) |
| `validate:cta` | 0 errors |
| `keyword-plan` + `content-gate` tests | pass |
| `interactive-tools.test.tsx` | 2 failures in StageGuide/DoesItWorkChecker. These render the components Lane F is rewriting (uncommitted), not these pages |
| `next build` (production) | succeeded; all six tool pages and `/tools/` are static/SSG |
| `validate:seo` (118 prerendered pages) | 0 errors; no warnings on any tool page or `/tools/` (48 site-wide title-length warnings are on other pages) |
| Prerendered tool HTML | exactly one H1 each; `index, follow`; JSON-LD parses (MedicalWebPage, BreadcrumbList, FAQPage, WebApplication; tracker guide has no WebApplication, see B); FAQs visible; tool markup server-rendered |
| Canonicals | absolute, trailing slash |
| Mobile (375×812) | tool starts about 2.3 screens down because of the renderer's header stack; see A |

**Dev server note:** `getSiteData()` caches content in a module-level variable with no invalidation, so the shared `next dev` server keeps serving the old Markdown until it restarts. I checked the rendered output through the same pipeline in a script instead of restarting another session's server.

## Proposed code changes (outside Lane G's files)

**A. Show the tool before the table of contents on tool pages** (`src/app/(site)/[...slug]/page.tsx`, Lane D). This is the biggest remaining tool-page issue. Measured at 375×812 on `/tools/stage-guide/`, the tool starts **1,878 px down, about 2.3 screens**. Above it sit the site nav, breadcrumbs, H1, review line, medical notice (216 px), audience-limits box (291 px) and table of contents (280 px). The owner's brief says the tool must be "immediately accessible". Suggested change, which saves about 300 px:

```diff
-        <SavedCopyNotice reviewedAt={approved ? fm.reviewed_at : null} isMedical={page.isMedical} />
-        <Toc headings={rendered.headings} />
+        <SavedCopyNotice reviewedAt={approved ? fm.reviewed_at : null} isMedical={page.isMedical} />
+        {fm.page_type !== 'tool' && <Toc headings={rendered.headings} />}
```

On tool pages, also consider moving the audience-limits box to just after the tool island. It belongs to the result, and the tool already shows tailored guidance for those situations. A "Skip to the tool" link under the H1 would also help. Neither should move the safety content: urgent guidance already renders inside each tool, ahead of its results.

**B. WebApplication schema for the tracker guide** (`[...slug]/page.tsx`). It has no tool island, so it gets no `WebApplication` today:

```diff
-    ...toolIds.filter((id) => isToolLive(id)).map(() => webApplicationLd({ name: fm.title, path: page.url, description: fm.meta_description })),
+    ...(fm.page_type === 'tool' && (toolIds.some((id) => isToolLive(id)) || page.url === '/tools/symptom-tracker/')
+      ? [webApplicationLd({ name: fm.title, path: page.url, description: fm.meta_description })]
+      : []),
```

(This also stops a page with two islands from emitting two identical WebApplication blocks.)

**C. Free-price `offers` on WebApplication** (`src/lib/seo/jsonld.ts`, nextecom). This is accurate and harmless. Google's software-app rich result also needs ratings, which are banned here, so don't expect a rich result:

```diff
     isAccessibleForFree: true,
+    offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
```

**D. Evidence-checker catalogue accuracy** (`src/components/tools/does-it-work-checker.tsx`, Lane B/F):
- The elinzanetant entry says "Phase 3 OASIS 1–3 randomized trials in 1,420 women". The source says efficacy came from OASIS 1 and 2 (796 women) and safety from OASIS 1–3 (1,420). Suggested wording: "approved in October 2025; efficacy from 12 weeks of OASIS 1 and 2 (796 women), safety from OASIS 1–3 (1,420 women)".
- The over-the-counter supplements entry links to `/does-it-work/magnesium/`. `/does-it-work/black-cohosh/` (now live) matches the entry better.

## Owner data still needed

Paste a keyword-tool export (Semrush, Ahrefs or Google Keyword Planner) into `content/_plan/imports/` and the plan merge script will fill in volume and difficulty. Rows to fill:

```csv
url,primary_keyword,candidate_secondaries,volume,difficulty,data_source,data_date
/tools/symptoms-checklist/,perimenopause symptoms checklist,menopause symptoms checklist printable | free perimenopause checklist,,,,
/tools/stage-guide/,am i in perimenopause quiz,perimenopause quiz | perimenopause test online | what stage of menopause am i in,,,,
/tools/12-month-counter/,12 months no period menopause,how long without a period is menopause | menopause calculator last period | 12 month no period counter,,,,
/tools/symptom-tracker/,menopause symptom tracker,perimenopause symptom tracker | menopause symptom diary | menopause app,,,,
/tools/does-it-work-checker/,menopause treatment evidence,menopause supplement checker | which menopause treatments work,,,,
/tools/treatment-questions/,questions to ask about hrt,hrt questions for doctor | menopause treatment questions | questions to ask about hormone therapy,,,,
```

The plan owner may also want to add the new secondaries to `keyword-map.csv`, which I didn't edit. "perimenopause quiz" may deserve to be the stage guide's primary keyword, but only once volume data supports it.
