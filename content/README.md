# Content

Pages are Markdown files with YAML frontmatter. The file path is the URL: `pages/symptoms/hot-flashes.md` → `/symptoms/hot-flashes/`, and `pages/symptoms/index.md` → `/symptoms/`.

| Folder | What it holds |
|---|---|
| `pages/` | Every content page. The schema is in `src/lib/content/schema.ts`. All 29 required fields must be present |
| `_sources/sources.yaml` | The source registry. Add a source only after opening it and confirming the key finding (`verified: true`) |
| `_people/people.yaml` | Authors and reviewers. Never add a person who hasn't agreed, and never invent credentials |
| `_review/` | `unverified-claims.md` (claims left out), `link-suggestions.md` (generated) |
| `_plan/` | Keyword map and keyword-tool imports (Phase 3) |

## Writing conventions

- **Citations:** `[@source-id]` renders as a numbered reference. Every cited ID must be in the page's `sources` list and in the registry.
- **Urgent sections:** wrap them in `:::urgent` … `:::`. Commercial links are banned inside.
- **Doctor questions:** wrap a list in `:::questions` … `:::` to get copy and print buttons.
- **No H1 in the body:** the title is the H1.
- **Links to drafts are dropped automatically** in builds where the target isn't published. The words stay, but the link doesn't render.
- **Affiliate links** go through `/go/{partner}/` and need `affiliate_disclosure: true`.

## Status and approval

Medical pages go `draft` → `evidence_checked` → `clinician_approved` → `published` → `review_due`. Non-medical pages (legal, about, evidence method) go `draft` → `owner_approved` → `published`.

After the named clinician has reviewed **this exact version**:

```bash
npm run content:approve -- content/pages/symptoms/hot-flashes.md --reviewer <person-id>
```

That command stamps a hash of the content. Any later edit withholds the page from production until it is approved again.

## Checks

```bash
npm run validate
```

This runs content, links, CTA, then build, then SEO, accessibility and privacy. CI runs the same.
