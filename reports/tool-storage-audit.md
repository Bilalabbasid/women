# Tools, local storage and tracking audit (Lanes F and D)

Date: 2026-11-06. Companion to `reports/tool-seo-audit.md` (tool-page SEO, Lane G).

## What every tool now does

| Requirement | How it works now |
|---|---|
| Saves automatically, no login | Every tool's current answers autosave to IndexedDB (Dexie, database `menowell_local_db`) about 0.4 s after each change. The save is also flushed when the tab is hidden or closed, or the tool unmounts. No account is involved anywhere. |
| Survives refresh, restart, months later | Data stays in IndexedDB until she deletes it. Saved answers are read after the page mounts, so the first render matches the server HTML. |
| Never auto-deleted | There is no age- or inactivity-based deletion of local data anywhere. Removed UI that offered "automated hard deletion after a retention window" (Settings, Onboarding); it never existed. |
| Persistent storage | `navigator.storage.persist()` is requested when she explicitly saves an entry or check-in. Manage storage shows whether it was granted and has an "Ask the browser to keep my data" button. |
| History | Each public tool has dated, optionally named saved copies she can open, update with current answers, re-date or rename, and delete, each with a two-step confirm. The 12-month counter keeps a period-start log instead. |
| Trends | Symptoms checklist: symptoms per saved list, and which symptoms appear most often. Stage guide: how the period-pattern answer changed. 12-month counter: days between logged periods. The tracker already had Timeline, Insights and Doctor report. |
| Storage management | New `/app/storage/`, linked from Settings, Privacy and every tool. It shows usage against quota, a low-space warning and persistence status. It also offers backup and restore, a list of what's stored per category with date spans, delete oldest 10 / 30 logged days or a custom range for chosen categories, delete one category, and clear everything. Every deletion previews exact counts and needs a confirm. |
| Backup / restore | One JSON file (format v2: all tables plus this site's localStorage keys). Restore checks every record, skips damaged ones and reports how many. It also accepts the older v1 export, and can merge (one check-in per day; the backup copy wins) or replace. Each restore runs as one all-or-nothing transaction. |
| Storage errors | Full disk (`QuotaExceededError`) and blocked storage (private modes, blocked site data) show a plain sentence. Before, errors were swallowed or left the UI stuck on "Saving". |
| Safe updates | Schema v2 only adds a table; v1 tables are untouched. Migration rules are written in `db.ts`. The four tools' old `localStorage` answers move into IndexedDB once; old keys are removed only after the copy succeeds, and existing data is never overwritten. |

## Tool by tool

### Symptoms checklist (`/tools/symptoms-checklist/`)
- **Fixed:** ticks lived only in page memory, so a refresh lost them. They now autosave. Dated saved lists with trends added. The "Add to my tracker" pin error is now reported instead of failing silently.
- **Tested:** in the browser, ticked 3 → reload → still ticked; saved two dated lists (one named, back-dated); trends correct (2 of 2 / 1 of 2); Open, Edit date or name, Delete with confirm; no horizontal overflow at 375 px. Unit tests: `symptoms-checklist.test.tsx`.

### Stage guide (`/tools/stage-guide/`)
- **Fixed:** single overwritten `localStorage` value → IndexedDB autosave plus dated answer sets and a pattern-over-time view. The hydration mismatch from reading `localStorage` during first render is gone.
- **Tested:** autosave, clear answers, save, reload restore, history delete (`interactive-tools.test.tsx`). In the browser, a simulated full disk showed the plain error on both autosave and history save, and saving recovered once space returned.

### Evidence checker (`/tools/does-it-work-checker/`)
- **Fixed:** shortlist and filters persist in IndexedDB, with dated shortlists. **Content corrections:** the elinzanetant summary said approval rested on trials "in 1,420 women". The source says efficacy came from OASIS 1–2 (796 women) and 1,420 was the OASIS 1–3 safety population; the source is now labelled as the manufacturer's. The supplements card now links to the black cohosh verdict instead of magnesium.
- **Tested:** shortlist autosave and clear; old `localStorage` shortlist migrated on first visit (`interactive-tools.test.tsx`).

### Treatment question builder (`/tools/treatment-questions/`)
- **Fixed:** IndexedDB autosave plus dated question sheets. It no longer pre-ticks two topics (D-006: only what she chooses is saved as hers). Print is disabled while the sheet is empty.
- **Tested:** nothing pre-ticked; crisis guidance on self-harm wording still first (`interactive-tools.test.tsx`).

### 12-month counter (`/tools/12-month-counter/`)
- **Fixed:** one overwritten date → a log of period start dates (shared `cycles` table) with edit/delete. It counts from the most recent date and shows the gaps between periods. Future dates and duplicates are rejected with a message.
- **Tested:** in the browser, logged 10 Sep and 2 Dec 2025 → 339 days elapsed and 26 to go (Nov 6, 2026), an 83-day gap (all checked by hand); future date rejected; persists after reload. Unit tests cover add, edit, delete and duplicates.

### Tracker (`/app/*`)
- **Fixed (data correctness):**
  - **Wrong day:** "today" was the UTC date everywhere. In the US evening, check-ins and doses were filed under tomorrow, and report, insight and timeline windows were shifted. All now use her local calendar day.
  - **Check-in data leaking between days:** switching to a day with no entry carried the previous day's symptoms and notes into it, and saved them. On an existing day, any field it lacked also showed the previous day's value. Each day now loads only its own data.
  - **Check-in save failures:** a failed save hung on "Saving". It now shows the storage error.
  - **Today quick feeling:** re-saving erased that day's notes, flow, lifestyle, night waking and weekly flag, and invented 7 h sleep / 0 hot flashes on a new day. Now only the feeling changes.
  - **Timeline:**
    - Was capped at 90 days; now has 6-month, 1-year and all-time views.
    - Each check-in has an Edit link that opens that day (`/app/check-in/?date=`).
    - A mistakenly logged dose can now be removed. The delete function existed but nothing in the UI reached it.
    - Delete buttons are now 44 px.
  - **Settings:** the storage-mode, cloud-retention and daily-reminder toggles only showed a "saved" toast and kept nothing. They're replaced with an honest data card, a Manage storage link, and a pointer to the real treatment reminders.
  - **Onboarding:** no fake cloud option, no pre-selected symptoms, and finishing or skipping now adds to existing pins instead of overwriting them.
  - **Privacy center:** delete-all used `localStorage.clear()` (wiping every key); it now removes only this site's keys.
- **Tested:** `tracker-pages.test.tsx` renders the real Check-in and Today pages against an in-memory IndexedDB:
  - `?date=` opens the right day, and an empty day starts blank.
  - A failed save shows its message.
  - A quick feeling keeps every other field and invents nothing.
  - A single dose can be removed.
  - Local dates are right at 23:30.

  In the browser: seeded 30 logged days → "Delete oldest 10 days" previewed Aug 1–10 (10 check-ins, 10 ratings) → deleted → 20 remain (Aug 11–30), period dates untouched. Downloaded a backup (intercepted in-page, so no file was written to disk) → cleared all data → restored → all 44 records back.

### Site-wide fixes found along the way
- **Checkbox labels (`globals.css`):** `.tap` forced `inline-flex` over the `flex` class, so short checkbox labels ran together on one line in every tool.
- **Section headings in tools (`globals.css`):** card borders ran through the bold section headings.
- **Bookmark button:** "Save for later" caused a hydration error on bookmarked pages.
- **Tool pages:** there is now a "Go straight to the tool" link, and the table of contents moved below the tool (tool top on a phone: 1,866 → 1,556 px).
- **Schema:** exactly one `WebApplication` per tool guide, including the tracker guide.
- **Content:** one invalid YAML file was returning a 500 error for every page on the site.

## Test status
- `npx vitest run`: **24 files, 148 tests, all passing** (was 22 files and 119 tests). New: `local-storage-manager.test.ts` (17), `tracker-pages.test.tsx` (6), plus rewritten tool UI tests.
- `tsc --noEmit` and ESLint: clean on every file changed.
- I did not run a fresh `next build`. Another session's dev server was using the same checkout. The Lane G fork ran a production build and `validate:seo` (0 errors) earlier today.

## Browser limitations to tell her about (shown on `/app/storage/` and every tool)
- Data lives in one browser on one device. It is not synced: other browsers, other devices and private windows won't see it. Use backup and restore to move it.
- Clearing browsing or site data, uninstalling the browser, or private browsing can remove it. Some browsers (notably Safari) may evict site storage after long inactivity unless the site was added to the home screen or persistence was granted. Persistence is requested, but browsers decide whether to grant it.
- The quota is set by the browser. Usage is shown where `navigator.storage.estimate()` exists, and a warning appears under 10% / 20 MB free.

## Not verified / open
- **Couldn't watch on screen:** the "Go straight to the tool" smooth scroll. The browser pane was hidden, so animation frames didn't run there. Its target was checked with an instant scroll. For the same reason, the tracker pages were verified by component tests rather than on screen in the last pass.
- **Not done (nextecom's file, low value):** a free-price `offers` property on WebApplication (`jsonld.ts`). It can't earn a rich result here, because ratings are banned.
- **Owner:** keyword volume and difficulty (see the SEO report); clinician review of the five updated tool specs in `content/_tools/` (all still draft).
