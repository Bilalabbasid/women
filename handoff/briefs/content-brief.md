# Content quality pass: shared brief for every content agent

Repo: C:\Users\bilal.abbasi\Desktop\Redit (Next.js site "MenoVerdict", perimenopause/menopause info).
Each page is content/pages/<path>.md: strict zod frontmatter (src/lib/content/schema.ts) + Markdown body.
You edit ONLY the two page files you were given. Other agents are editing other pages at the same time.

## Hard rules (break none of these)
1. Never invent medical facts, statistics, citations, studies, people, credentials, prices or company details.
   Every factual or numeric claim must be backed by a source that actually says it. If a claim has no
   source that supports it, REMOVE the claim (and list it in your report under "Removed claims").
2. Citations are `[@source-id]` (several: `[@a; @b]`) and must refer to ids in content/_sources/sources.yaml,
   or to a NEW source you verified yourself (rule 3). Citations render only as the References list at the
   end; they don't show inline, so place them right after the sentence they support.
3. New sources: you may add one only if you opened the page/PDF and it really says what you cite it for
   (use WebFetch / web search tools; PubMed abstracts can be read via NCBI E-utilities efetch).
   DO NOT edit content/_sources/sources.yaml (shared file). Instead write each new entry, in the same YAML
   shape as existing entries (id, title, authors, publisher, year, type, url, doi, accessed: "2026-11-08",
   population, key_finding, funding_conflict, verified: true, notes), to your own file:
   C:\Users\BILAL~1.ABB\AppData\Local\Temp\claude\d9c62d21aecadcae\f93a1d68-eb5f-44cf-a4a0-27d9140defc5\scratchpad\new-sources-<your-group>.yaml
   Reuse an existing id when the registry already has the source. Check for duplicates by URL/DOI first.
   validate-content will report your new ids as unknown until the lead merges them: that is expected.
4. Evidence grades: never type a grade in prose ("Strong evidence", "Limited" etc. as a verdict).
   Use the text directive `:grade{id="<registry-id>"}` with ids from content/_grades/grades.json.
   Don't change grades.json. Don't change the page's `evidence_grade` frontmatter.
5. No diagnosis or individual prescribing advice ("you should take X mg"). Describe what guidelines/labels say.
6. No founder names, personas, personal stories, "our doctor", "medically reviewed", or reviewer claims.
   Do not add or change `reviewer`/`reviewed_at`. No commerce: no affiliate/buy links, no product picks,
   no words "affiliate", "commission", "sponsored", no amazon links.
7. US English spelling (estrogen, color, randomized, pediatric). Plain, warm, direct; reading level ~grade 8.
8. Crisis/urgent info: US first (911 for emergencies; 988 Suicide & Crisis Lifeline). UK resources only as a
   separate line labeled "If you're in the UK:" (999, NHS 111, Samaritans 116 123).
9. Raw HTML in Markdown is dropped by the renderer. Allowed directives only: `:::urgent`, `:::questions`,
   `:::note` (containers), `::tool{id}`, `::sources-list`, `:grade{id}`. Do not add images, SVG or HTML.
10. A paragraph that ends with a colon must be followed directly by a list, table, blockquote or `:::` box.
11. Don't change: slug, file name, primary_keyword, cluster, page_type, hub, cta_profile, status, author,
    reviewer, internal link targets that work. Only link to pages that exist under content/pages/.
12. Don't add an email signup, waitlist, or "download" offers (the template handles one email box per page).

## What "improved" means for each page
- First sentence answers the page's question plainly (the "quick answer"). Keep the H1/title as is.
- Every claim cited (rule 2). Fix or remove weak/uncited statistics.
- A clear safety section near the end, e.g. "## When to see a doctor" (and an `:::urgent` box for red flags
  where relevant: e.g. bleeding after menopause, chest pain, suicidal thoughts, signs of liver injury
  for supplements, blood clot symptoms for hormone therapy). Use only sourced red flags.
- Scannable structure: H2 sections in a sensible order; lists of options written as
  "- **Label**: one or two sentences" (these render as labelled panels).
- Supplements/does-it-work pages: say what the best evidence found, typical studied doses only if a source
  states them (as "studies used", not advice), interactions/safety, and who should avoid it, all cited.
- Keep the page roughly the same length or modestly longer; cut filler and repetition.
- Update frontmatter: `updated_at: "2026-11-08"`, and prepend a change_log entry:
  `- { date: "2026-11-08", summary: "<what changed, one line>", material: true }`
  If you add a source id to the body, also add it to the page's `sources:` list. Keep `claims:` entries
  consistent: if you remove a claim from the body that is listed in `claims:`, remove it there too; if a
  claim's text changes materially, update it and its `sources`.

## Check your work (do NOT run `npm run build` or the dev server: other agents share the checkout)
- `npx tsx scripts/validate-content.ts 2>&1 | grep -E "<your page paths>|error"`  (0 errors for your pages,
  apart from "unknown source" for ids in your new-sources file)
- `npx tsx scripts/link-audit.ts 2>&1 | grep -E "<your page paths>"`
- Re-read your final files once.

## Report back (your final message, concise)
- Pages changed, and in one or two lines each what improved.
- Removed claims (quote each, with page) and "needs a source" items you could not verify.
- New sources file path and the ids in it (or "none").
- Anything you were unsure about.

## ADDENDUM (from a reader review, applies to every page)
A. Plain words. Replace jargon with everyday words; give the technical term in brackets once at most.
   Examples to avoid: "destabilizes the temperature-control center", "thermoregulatory neurons",
   "sympathetic nervous system surges", "sleep architecture", "dilate peripheral blood vessels",
   "nocturnal hypoglycemia", "hematologic conditions". Never use made-up-sounding terms.
B. The opening paragraph renders as the page's "Short answer". Make it 2-3 plain sentences (about 40-50
   words): what it is, one thing to try or know now, and what has the strongest evidence. No internal links
   and no "as outlined in our ..." plugs in it.
C. Titles and headings in sentence case ("Night sweats: how to sleep cooler tonight"), not Title Case.
   Only change capitalization of `title`/H2s, not their words (keep primary keyword).
D. "Other causes" sections: a plain bulleted list in calm wording ("A doctor can check for other causes,
   such as ..."), not a stack of alarm boxes. Keep the real red flags in ONE :::urgent box, specific and calm.
E. Self-care steps someone can do tonight go in a box: `:::try` ... `:::` containing a short numbered
   list (sourced, safe, general). Use it on symptom pages where there are such steps; one per page.
F. Keep links to product-type pages (cooling products, sleepwear, moisturizers) out of the advice
   itself; at most one "related" link at the end of a section.
