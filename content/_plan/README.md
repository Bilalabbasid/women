# Keyword and content plan

`keyword-map.csv` is the site map: one row per URL, **one primary intent per URL**. It's the source of truth for what gets written, under which URL, aimed at which question, and with which CTA profile.

- `volume`, `difficulty`, `data_source` and `data_date` are **blank on purpose**. They're filled only from an export the owner supplies (see "Importing keyword data"). Nothing is estimated.
- `status` is the plan status (`planned`, `drafted`, `merged`, `dropped`). A page's publishing status lives in its own frontmatter.
- List cells (`secondary_keywords`, `questions`, `symptom_tags`, `stage_tags`) are separated by ` | `.
- `priority`: 1 = first content batch (Phases 4–5), 2 = next, 3 = later.
- US English spelling for launch (`body-odor`, `moisturizers`). UK pages come later through the locale model.

## Checks

`npm run validate:plan` fails on duplicate URLs or primary keywords, a secondary keyword that is another page's primary, unknown CTA profiles, unknown hubs, data without a source and date, and content pages that don't match their row. It warns on near-duplicate primary keywords.

## Importing keyword data

Drop CSV exports in `imports/`. Google Keyword Planner (UTF-16 TSV), Semrush and Ahrefs exports are recognised. Include the export date in the file name, for example `semrush-us-2026-11-20.csv`. Then run:

```bash
npm run plan:import
```

It fills volume and difficulty only where a keyword **exactly** matches a row's primary keyword (case and spacing ignored), records the file and date as the source, and lists unmatched keywords in `imports/unmatched-keywords.csv` for a person to review. It never overwrites a value from a newer export with an older one.

## Changes from the brief's inventory

See `merge-log.md`.
