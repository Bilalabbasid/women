# Site-wide quality sweep: shared brief

Repo: C:\Users\bilal.abbasi\Desktop\Redit ("MenoVerdict", perimenopause/menopause information site).
Pages are content/pages/<path>.md (strict zod frontmatter in src/lib/content/schema.ts + Markdown).
You edit ONLY the pages in your list file. Many other agents edit other pages and code at the same time.
Read the full rules in the main brief too, they all apply:
C:\Users\BILAL~1.ABB\AppData\Local\Temp\claude\d9c62d21aecadcae\f93a1d68-eb5f-44cf-a4a0-27d9140defc5\scratchpad\content-brief.md
(including: never invent facts/numbers/citations/people/prices; never edit content/_sources/sources.yaml,
put verified new sources in scratchpad\new-sources-<your-group>.yaml; never type grades, use :grade{id};
no HTML; no commerce; no reviewer claims; don't run `npm run build` or a dev server).

## This is a sweep, not a rewrite. For every page in your list, fix:
1. Crisis / urgent numbers: US first (911 emergencies; 988 Suicide & Crisis Lifeline, call or text).
   UK resources only on their own line starting "If you're in the UK:" (999, NHS 111, Samaritans 116 123).
   Remove any other country's numbers presented as primary.
2. US spelling everywhere in prose (estrogen not oestrogen, gynecologist, anemia, color, behavior,
   randomized, center, pediatric, ...). Don't change source titles, quotes or proper names (e.g. "NICE",
   "British Menopause Society", a cited paper's title), and don't change URLs.
3. The colon rule: a paragraph ending with ":" must be immediately followed by a list, table,
   blockquote, or a `:::` box. Fix by rewording or restructuring.
4. Numbers and statistics: every percentage, count, dose, risk figure or date-bound fact must have a
   `[@id]` citation that supports it. If the registry has a source that supports it, cite it (and add the id
   to `sources:`). If not and you can't verify a new source, remove or soften the claim to what is
   supported, and list it under "Removed claims".
5. First sentence: answers the page's question plainly. Improve it only if it is vague or salesy.
6. Symptom/condition pages with no safety guidance: add a short "## When to see a doctor" section using only
   sourced points (or reuse wording/sources already on the page).
7. Leftover commerce or marketing: "buy", "best product", affiliate/commission wording, brand pushes,
   "sponsored". Remove (comparison pages may name telehealth companies factually; keep their cited facts).
8. Accessibility in text: link text must say where it goes (no "click here"/"here"/"this page");
   headings in order (no skipping from H2 to H4); no all-caps shouting.
9. Lists of options written "- **Label**: text" render as labelled panels: use that form where a list
   already pairs a name with an explanation (don't force it elsewhere).

Legal/about pages (privacy, terms, cookies, medical-disclaimer, contact, about/*): ONLY items 1, 2, 3, 8.
Never change what they promise or disclose. evidence/updates.md: only items 2 and 3.

If you change a page: set `updated_at: "2026-11-08"` and prepend to change_log
`- { date: "2026-11-08", summary: "<one line>", material: <true if meaning changed, else false> }`.
Keep `claims:` frontmatter consistent with body edits. Don't touch slug, page_type, cluster, hub, status,
reviewer, author, cta_profile, primary_keyword.

## Check (for your pages only)
`npx tsx scripts/validate-content.ts 2>&1 | grep -E "error|<a distinctive part of your paths>"` → no errors
for your pages (except "unknown source" for ids in your new-sources file).
`npx tsx scripts/link-audit.ts 2>&1 | grep -E "<your paths>"` → no new problems.

## Report (final message, concise)
- Pages changed (path + one line each). Pages left unchanged.
- Removed claims (quote + page) and needs-a-source items.
- New sources file and ids, or "none".
