# Stats proposals: uncited statistics, NAMS 2023 grades, source gaps

Research only. No repo file was edited. Accessed 2026-11-07.

How sources were opened: PubMed pages return a cookie wall to automated fetches, so abstracts were read through NCBI E-utilities (efetch, the same abstract text PubMed shows). The NAMS 2023 and NAMS 2022 statements were read in full from the PDFs on menopause.org. The Appiah PMC table, the NIH ODS fact sheets and the BJGP abstract were read with a scraper. NICE NG123, DailyMed and Drugs@FDA were read with curl.

Every source id named below exists in `content/_sources/sources.yaml`, unless it is marked NOT IN REGISTRY.

---

## Task 1: the 60 uncited-stat lines

Classes: **A** = frontmatter claim that has sources; **B** = covered by a nearby citation; **C** = rendered FAQ answer; **D** = needs a source.

### Lines needing editorial attention (summary)

- **D, rewrite:** `symptoms/incontinence.md:68`, `does-it-work/magnesium.md:53` and `does-it-work/equelle.md:47`.
- **A, but the listed source does not support the number:** `care/pelvic-floor-exercises.md:29` ("up to 50%") and `symptoms/night-sweats.md:29` ("75% to 90%"). The same 75-90% figure also appears in rendered body text at `symptoms/night-sweats.md:101`. That line is not in the list because it has an inline cite, but it is wrong in the same way.
- **B, append a cite:** 17 body lines (insurance, dhea, equelle, probiotics, chemo, menopause-at-work). Every number was confirmed in the abstract.

### Full list

**content/pages/care/insurance.md:26**: A. No action. Source `chesnokova-insurance-mht-disparity-2026` exists. The numbers match the abstract.

**content/pages/care/insurance.md:36**: C. Keep. The same 10.7% vs 20.7% appears in the body (lines 45-47, cited to chesnokova; add the cite to line 47, below).

**content/pages/care/insurance.md:47**: B. Source: chesnokova-insurance-mht-disparity-2026 (cited in the intro sentence on line 45).
- New text: `- Women with **Medicaid** reported a history of MHT use at **10.7%**, compared with **20.7%** for women with **private insurance** — less than half the rate [@chesnokova-insurance-mht-disparity-2026]`
- Evidence: abstract: "10.7% [95% CI, 6.9%-16.0%] vs 20.7% [95% CI, 18.1%-23.5%]".

**content/pages/care/insurance.md:48**: B. Source: chesnokova-insurance-mht-disparity-2026.
- New text: `- After adjusting for other factors, Medicaid-insured women had significantly **lower odds of MHT use** than privately insured women (OR 0.50, 95% CI 0.28–0.87) [@chesnokova-insurance-mht-disparity-2026]`
- Evidence: abstract: "lower odds of MHT use than privately insured women (OR, 0.50 [95% CI, 0.28-0.87])".

**content/pages/care/pelvic-floor-exercises.md:29**: A, flagged. The ids `cochrane-pfmt-incontinence` and `nice-ng123-urinary-incontinence` exist, but **neither source I opened states "up to 50%".**
- The Cochrane CD005654.pub4 abstract (PMID 30288727) has no 50% figure and no bearing-down figure.
- The NICE NG123 Recommendations page has no percentage. It only says "Undertake routine digital assessment to confirm pelvic floor muscle contraction" (1.3.4).
- Proposed new text: `"NICE advises routine digital assessment to confirm a correct pelvic floor muscle contraction before starting supervised pelvic floor muscle training."` with `sources: [nice-ng123-urinary-incontinence]`.
- Alternative: keep the 50% only after a primary source is found and added (NEEDS A SOURCE).

**content/pages/care/sleepwear-for-night-sweats.md:53**: not a statistic. "100% Traditional cotton" describes fabric content. No change to the number is needed.
- Side note: the table's moisture and drying ratings have no citation. The only page source, nams-2023-nonhormone-therapy, recommends "using breathable clothing materials" but rates no fabrics, and it rates cooling techniques "Level II; not recommended".

**content/pages/care/when-your-doctor-dismisses-you.md:26**: A. No action. `jmir-online-menopause-information-2025` exists. The registry note says to use it for site planning only, which is consistent with a non-rendered claim.

**content/pages/does-it-work/dhea.md:63**: B. Source: lemos-intravaginal-dhea-meta-analysis-2026 (cited in the intro on line 61).
- New text: `- A **significant improvement in vaginal dryness** (mean difference -0.23, 95% CI -0.35 to -0.11) [@lemos-intravaginal-dhea-meta-analysis-2026]`
- Evidence: abstract: "vaginal dryness with a mean difference of -0.23 (95% CI, -0.35 to -0.11)".

**content/pages/does-it-work/dhea.md:64**: B. Source: lemos-intravaginal-dhea-meta-analysis-2026.
- New text: `- A **significant improvement in dyspareunia** (painful sex) (mean difference -0.40, 95% CI -0.66 to -0.15) [@lemos-intravaginal-dhea-meta-analysis-2026]`
- Evidence: abstract: "dyspareunia of -0.40 (95% CI: -0.66 to -0.15)".

**content/pages/does-it-work/equelle.md:26**: A. No action. `aso-s-equol-hot-flash-trial-2012` exists. Its numbers match the abstract.

**content/pages/does-it-work/equelle.md:36**: C. Keep. The same -58.7% vs -34.5% (p=0.009) appears in the body at line 53 (add the cite there, below).

**content/pages/does-it-work/equelle.md:47**: D. The page's only source, Aso 2012, gives no producer percentage. **The 20-30% figure is not supported by any source I opened.** The phrase "smaller share of non-Asian populations" is also unsupported, and confusingly worded.
- A registry source does give a figure. nams-2023-nonhormone-therapy says: "Only 35% of North American women can metabolize the soy isoflavone daidzein to equol."
- Proposed new text: `Only about 35% of North American women have gut bacteria that can convert daidzein, a compound in soy, into **S-equol**, which has estrogen-like activity [@nams-2023-nonhormone-therapy]. People who don't produce it naturally are called "equol non-producers." Equelle's premise is to supply S-equol directly, bypassing the need for that gut conversion — which is why the key trial specifically recruited women who don't make it naturally.`
- Also add `nams-2023-nonhormone-therapy` to the page's frontmatter `sources:` list.
- Optional: NAMS adds that producer tests "are not commercially available to the public or healthcare professionals". That is useful for the "Am I likely an equol non-producer?" question on line 72.

**content/pages/does-it-work/equelle.md:53**: B. Source: aso-s-equol-hot-flash-trial-2012 (cited in the intro on line 51).
- New text: `- Hot flush frequency dropped **58.7%** in the S-equol group versus **34.5%** with placebo — a statistically significant difference (p=0.009) [@aso-s-equol-hot-flash-trial-2012]`
- Evidence: abstract: "-1.9±1.8/day, -58.7%, vs. -1.0±2.0/day, -34.5%, p=0.009".

**content/pages/does-it-work/magnesium.md:53**: D, **NEEDS A SOURCE**. No registry entry covers magnesium bioavailability. The page cites only nams-2023-nonhormone-therapy, which does not address magnesium forms.
- Proposed new text: `4. **Magnesium Oxide**: Small studies suggest it is absorbed less completely than more soluble forms such as citrate, chloride, aspartate and lactate. Primarily used as an inexpensive laxative or antacid.` This drops the "4% to 5%" figure and the "minimal systemic absorption" phrase.
- Candidate source to add to the registry (NOT IN REGISTRY; opened): NIH ODS, Magnesium Health Professional Fact Sheet, https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/. It says forms that dissolve well "are more completely absorbed", and small studies found aspartate, citrate, lactate and chloride "more bioavailable than magnesium oxide". It gives no percentage for oxide.

**content/pages/does-it-work/omega-3.md:26**: A. No action. `cohen-omega3-vms-rct-2014` exists. NAMS 2023 also reports the same MsFLASH result (177 vs 178, no significant VMS difference).

**content/pages/does-it-work/probiotics.md:26**: A. No action. `wang-probiotics-bone-health-metaanalysis-2024` exists. Its numbers match the abstract.

**content/pages/does-it-work/probiotics.md:49**: B. Source: wang-probiotics-bone-health-metaanalysis-2024 (cited in the intro on line 47).
- New text: `- A **statistically significant increase in lumbar spine BMD** (standardized mean difference 0.60, 95% CI 0.14–1.05) [@wang-probiotics-bone-health-metaanalysis-2024]`
- Evidence: abstract: "lumbar spine (standardized mean difference [SMD] = 0.60, 95% confidence interval [CI] 0.14 to 1.05)".

**content/pages/does-it-work/probiotics.md:50**: B. Source: wang-probiotics-bone-health-metaanalysis-2024.
- New text: `- A **statistically significant increase in hip BMD** (standardized mean difference 0.74, 95% CI 0.15–1.33) [@wang-probiotics-bone-health-metaanalysis-2024]`
- Evidence: abstract: "the hip (SMD = 0.74, 95%CI 0.15 to 1.33)".

**content/pages/does-it-work/red-clover.md:27**: A. No action. `lethaby-cochrane-phytoestrogens-2013` exists.

**content/pages/does-it-work/red-clover.md:30**: A. No action. `lethaby-cochrane-phytoestrogens-2013` exists.

**content/pages/does-it-work/relizen.md:29**: A. No action. `relizen-own-site-2026` exists. Its key_finding quotes the 75% and 70% figures and the 4,925-customer survey footnote.

**content/pages/does-it-work/soy-isoflavones.md:30**: A. No action. `lethaby-cochrane-phytoestrogens-2013` exists.

**content/pages/groups/chemotherapy-induced-menopause.md:27**: A. No action. `overbeek-chemotherapy-ovarian-function-2017` exists. Its numbers match the abstract.

**content/pages/groups/chemotherapy-induced-menopause.md:37**: C. Keep. The "0% to 83%" figure is cited in the body at line 46.

**content/pages/groups/chemotherapy-induced-menopause.md:48**: B. Source: overbeek-chemotherapy-ovarian-function-2017 (cited in the intro on line 46).
- New text: `- Patients on **MVPP protocols** (used for some lymphomas): **39–79%** developed amenorrhoea [@overbeek-chemotherapy-ovarian-function-2017]`
- Evidence: abstract: "MVPP protocols were at highest risk for amenorrhoea (39-79%)".
- Side note: the registry key_finding merges the two ranges into "39-80%". The page's split figures are the accurate ones.

**content/pages/groups/chemotherapy-induced-menopause.md:49**: B. Source: overbeek-chemotherapy-ovarian-function-2017.
- New text: `- **Breast cancer survivors on cyclophosphamide-containing regimens**: **40–80%** developed amenorrhoea [@overbeek-chemotherapy-ovarian-function-2017]`
- Evidence: abstract: "cyclophosphamide-containing regimens, in whom the prevalence of amenorrhoea was 40-80%".

**content/pages/groups/early-menopause.md:27**: A. No action. `appiah-menopause-age-trends-2021` exists.
- Confirmed in the PMC full-text table: early menopause was "16.7 (13.9-19.50)" in 1959-1962 and "11.8 (8.6-15.1)" in 2015-2018.
- Side note: 16.7% is not in the registry key_finding. Consider adding it.

**content/pages/groups/early-menopause.md:51**: C. Keep. Both 11.8% and 16.7% appear in the body at line 54, cited to appiah (both confirmed above).

**content/pages/groups/menopause-at-work.md:26**: A. No action. `kapoor-vms-workplace-survey-2026` exists. All numbers match the abstract.

**content/pages/groups/menopause-at-work.md:36**: C. Keep.
- "More than a third" and "about a third" restate the 36% and 32% in body lines 47-48 (add the cites there, below).
- "Over 80%" and "almost 80%" restate body line 52, which is cited to kapoor.

**content/pages/groups/menopause-at-work.md:38**: C. Keep, provided body lines 60-61 get their cite (below). The accommodations part of this answer has no numbers.

**content/pages/groups/menopause-at-work.md:47**: B. Source: kapoor-vms-workplace-survey-2026 (cited in the intro on line 45).
- New text: `- **36%** reported some degree of activity impairment at work [@kapoor-vms-workplace-survey-2026]`
- Evidence: abstract: "Activity impairment, absenteeism, and presenteeism were reported by 36%, 6%, and 32%".

**content/pages/groups/menopause-at-work.md:48**: B. Source: kapoor-vms-workplace-survey-2026. Same evidence as line 47.
- New text: `- **32%** reported presenteeism (being at work but functioning below capacity) [@kapoor-vms-workplace-survey-2026]`

**content/pages/groups/menopause-at-work.md:49**: B. Source: kapoor-vms-workplace-survey-2026. Same evidence as line 47.
- New text: `- **6%** reported absenteeism (missing work entirely) [@kapoor-vms-workplace-survey-2026]`

**content/pages/groups/menopause-at-work.md:60**: B. The section intro (line 58) has no cite, but the section reports results from the survey cited on lines 45 and 52.
- New text: `- **Controlling the temperature** around them (71.0%) [@kapoor-vms-workplace-survey-2026]`
- Evidence: abstract: "Top coping mechanisms at work were temperature control (71.0%)".
- Alternative: cite the intro instead: `The most common coping strategies reported in the same survey were [@kapoor-vms-workplace-survey-2026]:`.

**content/pages/groups/menopause-at-work.md:61**: B. Source: kapoor-vms-workplace-survey-2026.
- New text: `- **Wearing layered, breathable clothing** (46.0%) [@kapoor-vms-workplace-survey-2026]`
- Evidence: abstract: "wearing layered, breathable clothing (46.0%)".

**content/pages/groups/menopause-at-work.md:65**: B. Source: kapoor-vms-workplace-survey-2026.
- New text: `- **Changes to benefit packages** (27.9%) — such as insurance coverage for menopause-related care [@kapoor-vms-workplace-survey-2026]`
- Evidence: abstract: "changes to benefit packages (27.9%)".
- Caveat: the gloss "such as insurance coverage..." is the page's own example, not the abstract's wording.

**content/pages/groups/menopause-at-work.md:66**: B. Source: kapoor-vms-workplace-survey-2026.
- New text: `- **More general workplace awareness** (25.7%) — so symptoms aren't misread or stigmatized [@kapoor-vms-workplace-survey-2026]`
- Evidence: abstract: "creating more workplace awareness (25.7%)". The "misread or stigmatized" gloss is the page's own.

**content/pages/groups/menopause-at-work.md:67**: B. Source: kapoor-vms-workplace-survey-2026.
- New text: `- **More flexible working arrangements** (23.2%) — such as remote options on difficult days or flexible start times after a disrupted night [@kapoor-vms-workplace-survey-2026]`
- Evidence: abstract: "more flexible working arrangements (23.2%)". The examples are the page's own.

**content/pages/menopause/age.md:32**: A. No action. `appiah-menopause-age-trends-2021` exists. 11.8% is confirmed in the PMC table.

**content/pages/perimenopause/age.md:29**: A. No action. `appiah-menopause-age-trends-2021` exists. 11.8% is confirmed.

**content/pages/perimenopause/age.md:44**: C. Keep. 11.8% is cited in the body at line 53.

**content/pages/perimenopause/contraception.md:26**: A. No action. `cagnacci-contraception-over-40-consensus-2025` exists.

**content/pages/perimenopause/year-by-year.md:29**: A. No action. `kravitz-swan-postmenopause-depression-2022` exists. Abstract: "OR = 1.49, 95% CI, 1.09-2.04".

**content/pages/postmenopause/sexual-health.md:26**: A. No action. `trento-postmenopausal-sexual-function-2021` exists. Abstract: "(243/64%) ... at risk of sexual dysfunction".

**content/pages/postmenopause/sexual-health.md:29**: A. No action. `silva-sexual-counseling-metaanalysis-2022` exists.

**content/pages/postmenopause/sexual-health.md:39**: C. Keep. 380 women and 64% are cited in the body at line 48.

**content/pages/symptoms/breast-tenderness.md:26**: A. No action. `hubbard-breast-pain-assessment-2020` exists. The BJGP abstract confirms "≤70% of women" and "two-thirds of patients with true mastalgia".

**content/pages/symptoms/breast-tenderness.md:29**: A. No action. `hubbard-breast-pain-assessment-2020` exists. "PPV under 3%" is in the registry key_finding. I could not reread it myself because the full text is paywalled.

**content/pages/symptoms/breast-tenderness.md:42**: C. Keep.
- 70% is cited in the body at line 47.
- "Two-thirds" is in body line 53, which has no inline cite. Optionally append `[@hubbard-breast-pain-assessment-2020]` there; the BJGP abstract confirms it.

**content/pages/symptoms/breast-tenderness.md:44**: C. Keep. "Under 3%" (body line 47) and "6 weeks" (body line 60) are both cited to hubbard in the body.
- Caveat: I could not open the full text (paywalled), and the registry key_finding does not mention the 6-week nipple-discharge threshold. Reverify the 6 weeks against the full article or NICE NG12.

**content/pages/symptoms/burning-mouth.md:26**: A. No action. `baharvand-burning-mouth-syndrome-2013` exists.

**content/pages/symptoms/facial-hair.md:26**: A. No action. `kamp-menopause-hair-disorders-2022` exists.

**content/pages/symptoms/facial-hair.md:39**: C. Keep. "About 50%" is cited in the body at line 44.

**content/pages/symptoms/frozen-shoulder.md:26**: A. No action. `reinke-frozen-shoulder-hrt-2026` exists.
- Side note: the registry says 7.65% were women *not* on hormone therapy and 3.95% were women *on* HT. The page and FAQ say only "one group" and "another", which is vague. Consider naming the groups.

**content/pages/symptoms/frozen-shoulder.md:36**: C. Keep. 7.65% vs 3.95% is cited in the body at line 45. The same "name the groups" suggestion applies.

**content/pages/symptoms/hair-thinning.md:35**: A. No action. `kamp-menopause-hair-disorders-2022` exists.

**content/pages/symptoms/incontinence.md:68**: D, **NEEDS A SOURCE** for the 50%. The page's sources are cochrane-pfmt-incontinence, nice-ng123-urinary-incontinence and nams-2020-gsm. Neither the Cochrane abstract nor the NICE NG123 recommendations state a 50% figure.
- Proposed new text: `For muscle training to work, exercises must be performed correctly: lifting upward and inward rather than pushing outward or bearing down. NICE advises a routine internal (digital) check to confirm a correct pelvic floor contraction before starting supervised training [@nice-ng123-urinary-incontinence].`
- Evidence: NICE NG123 1.3.4: "routine digital assessment to confirm pelvic floor muscle contraction".

**content/pages/symptoms/night-sweats.md:29**: A, flagged. `nams-2022-hormone-therapy` exists, but **the source does not say 75% to 90%.** NAMS 2022 (full PDF) says therapy reduced "weekly symptom frequency by 75% (95% CI, 64.3-82.3)" compared with placebo. For severity it gives an OR of 0.13, not a percentage.
- Proposed new text: `"Compared with placebo, systemic estrogen therapy (alone or with a progestogen) reduced weekly hot flash frequency by about 75% and significantly reduced severity."`
- The same fix applies to rendered body line 101: `Reduces hot flash frequency by about 75% compared with placebo in randomized trials [@nams-2022-hormone-therapy].` Line 101 says "night sweats and daytime hot flashes", but the source reports VMS overall.

**content/pages/tools/12-month-counter.md:41**: A. No action. `appiah-menopause-age-trends-2021` exists.
- 11.8% is confirmed in the PMC table.
- I did not pull the 49.9-year mean myself; it rests on the registry key_finding.

**Count check:** 60 lines, each listed above in file order.
- A: 27 (2 of them flagged: pelvic-floor-exercises:29 and night-sweats:29).
- B: 17.
- C: 12.
- D: 3 (incontinence:68, magnesium:53, equelle:47).
- Not a statistic: 1 (sleepwear:53).

---

## Task 2: grades in the NAMS 2023 nonhormone statement

Registry id: `nams-2023-nonhormone-therapy` (DOI 10.1097/GME.0000000000002200, PMID 37252752).

I read the full text from https://menopause.org/wp-content/uploads/professional/2023-nonhormone-therapy-position-statement.pdf (Menopause 30(6):573-590). The LWW page returned 403. The levels are defined as: Level I "good and consistent scientific evidence"; Level II "limited or inconsistent scientific evidence"; Level III "consensus and expert opinion".

| Therapy | Grade in the statement | Short quote |
|---|---|---|
| (a) CBT | Level I; recommended | "CBT alleviates bothersome VMS ... (Level I; recommended)" |
| (b) Clinical hypnosis | Level I; recommended | hypnosis arm "significantly lower hot flash frequency (74% vs 17%" |
| (c) SSRIs/SNRIs | Level I; recommended | "associated with mild to moderate improvements in VMS" |
| (d) Gabapentin | Level I; recommended | "900 mg to 2,400 mg per day in divided doses. (Level I; recommended)" |
| (e) Oxybutynin | **Levels I-II; recommended** | "significantly improved moderate to severe VMS" |
| (f) Fezolinetant | Level I; recommended (in the abstract and the Recommendations section) | "recommends CBT, clinical hypnosis, SSRIs, SNRIs, gabapentin, fezolinetant (Level I)" |
| (g) Cooling techniques | Level II; not recommended | "no strong evidence that lifestyle changes such as cooling techniques" |
| (h) Paced respiration | Level I; not recommended | "Paced respiration is unlikely to provide any benefit for hot flashes" |
| (i) Exercise (and yoga) | Level II; not recommended | "insufficient or poor evidence to consider exercise or yoga" |
| (j) Supplements/herbal remedies overall | Levels I-II; not recommended | "these remedies are not recommended" |
| Black cohosh | Level I; not recommended | "insufficient evidence to support the use of black cohosh for VMS" |
| Soy foods and soy extracts | Level II; not recommended | "mixed evidence for soy foods, soy extracts, and the soy metabolite equol" |
| Equol | Level II; not recommended | same quote as soy |

**Is oxybutynin recommended?** Yes. The statement recommends oxybutynin at **Levels I-II**: the evidence is good to limited, not uniformly Level I. It comes with a caution: "long-term use may be associated with cognitive decline" in older adults. The usual side effects are dry mouth and urinary difficulties.

**Does the statement mention black cohosh liver toxicity?** Yes. It says "Reports of possible hepatotoxicity started to appear after 2000," and that a US Pharmacopeial Convention committee "found 30 reports possibly related to black cohosh." It also reproduces the USP warning to stop use if liver symptoms develop (abdominal pain, dark urine, jaundice).

Two other points from the statement:
- Elinzanetant is described as "found to be more beneficial than placebo within 2 weeks of use". In 2023 it was still "in development", so it has no grade.
- The registry key_finding for this source matches the abstract. One addition worth making: the statement also lists suvorexant and "calibration of neural oscillations" as Level II, not recommended.

---

## Task 3: source gaps

### (a) FDA label for elinzanetant (Lynkuet)

**Not in the registry.** The only Lynkuet entry is `lynkuet-approval-bayer-2025`, a Bayer press release, and its funding_conflict field itself says "Replace with the FDA label". Two official labels exist, and I opened both:

- **Drugs@FDA original label (NDA 219469):** https://www.accessdata.fda.gov/drugsatfda_docs/label/2025/219469s000lbl.pdf (PDF, HTTP 200, opened). Highlights: "LYNKUET (elinzanetant) capsules ... Initial U.S. Approval: 2025". It is indicated "for the treatment of moderate to severe vasomotor symptoms due to menopause." Dose: "120 mg (two 60 mg capsules) orally once daily at bedtime".
- **DailyMed current label:** https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=f42884ff-7dff-419c-8a0c-affe2ed73818 (opened).
  - Packager: Bayer HealthCare Pharmaceuticals Inc. NDA219469. The label reads "Revised: 8/2026", while the page header says "Updated June 16, 2026".
  - Warnings and Precautions: 5.1 CNS depressant effect and daytime impairment; 5.2 hepatic transaminase elevations; 5.3 risk of pregnancy loss; 5.4 risk of seizure (recent major change, 08/2026).
  - Liver testing: "Do not start therapy if serum transaminase concentration is equal to or exceeds two times the" ULN.
  - Nervous system effects: "occurred in 11.9% of patients on LYNKUET compared to 3.5%" on placebo.
  - **Prefer the DailyMed current label as the citation.** The 2025 PDF predates the 5.4 seizure warning.

### (b) Black cohosh liver safety source

**Not in the registry.** No registry entry is about black cohosh. The only liver mentions are for fezolinetant and elinzanetant. The closest registry source is `nams-2023-nonhormone-therapy`, which does discuss black cohosh hepatotoxicity (Task 2 above), so it can be cited now.

- **NIH Office of Dietary Supplements, Black Cohosh Health Professional Fact Sheet:** https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional/ (opened through the scraper; curl got 403).
  - It reports "at least 83 cases of liver damage", then adds "there is no evidence of a causal relationship".
  - Some cases may be due to impurities, adulterants or the wrong Actaea species.
  - In 2008 the US Pharmacopeia recommended a cautionary label: stop use and see a clinician if you have a liver disorder or develop liver symptoms.
  - Australia has required a warning label since 2007.
  - "the U.S. Food and Drug Administration does not require such a warning".
- **LiverTox (NBK548647):** could not open. The NCBI Bookshelf served a browser-check/reCAPTCHA page, and the scraper also failed. Not verified; do not cite it until it has been read.
