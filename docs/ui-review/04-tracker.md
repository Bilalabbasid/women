# Tracker (/app/*) redesign

Done first, at the owner's request (ahead of the brief's template order).
Before: `docs/ui-review/before-app/` (old tracker with 21 days of sample data, 375 + 1280 light).
After: `docs/ui-review/after-app/<screen>_<width>_<theme>.jpg`, 13 screens × 375/768/1280 × light/dark, seeded,
plus `*_empty` first-run states.

## What changed

- **Shell:** a bottom tab bar on phones (Today · Timeline · Treatments · Insights · Report, 64 px targets, safe-area aware).
  On tablet/desktop the tabs sit inside the header. The header has the real brand mark, an "On this device" chip and
  Settings. The "Not medical advice" strip has a close (×) button and doesn't print over the report.
- **Kit** (`components/app/kit.tsx`, shown on `/dev/design-system/#tracker`): AppPage, Panel, LevelPicker (5 big levels,
  a ladder glyph, no faces, radio-group semantics), Stepper (56 px −/+; fast taps all count), QuickPick, SymptomChips
  (tap to add, a 1–5 strength row opens), stats, row lists, save bar, chart styles.
- **Today:** tap a feeling to save it straight away, then "Log today". Last-7-entries stats, treatments due with one-tap
  Done, recent days (tap to edit), a "New here?" link to onboarding when nothing's logged, and the existing reminders
  (appointment, log, backup) as calm cards.
- **Log today (check-in):** feeling → hot flashes (stepper) → sleep (quick picks + fine adjust, woke at night) → bleeding →
  symptom chips with strength → optional extras and a note → sticky "Save today". Urgent guidance still shows live.
- **Timeline / Insights:** SVG charts (hot flashes per day, sleep with a 7–9 h band, symptom frequency, feeling spread),
  each with a plain-English summary and a screen-reader data table. Day-by-day cards keep Edit and Delete.
- **Treatments:** due-today cards (Mark done / Change patch, Skip, Snooze), add/edit in a bottom sheet, plain reminders
  panel, before/after comparison in a sheet ("timing, not cause").
- **Report:** filters, "Print my report", "Download PDF", a live paper-style preview, and a "Before your appointment"
  card when a date is set. Print gives one clean sheet.
- **Onboarding:** 3 skippable steps (what it does · data stays on this device · daily or weekly). The frequency choice
  now saves to the existing reminder setting, and the completion flag follows consent.
- **Install:** illustrated steps per platform (your own platform's tab first), at most 3 steps, plus "Install now" when
  the browser offers it.
- **Settings:** a new Reading panel (theme + text size). Reminders, appointment, data and install are grouped.
  Saved, Storage, Privacy, Catch-up and Membership are restyled, with jargon removed ("IndexedDB", "Deterministic",
  "Regimen", "Zero Cloud").
- **Dark mode is on for /app/*** (the temporary light pin was removed): no hard-coded colours remain in `/app` or
  `components/app`.

## Checks

- tsc clean; ESLint clean on app, site and safety components.
- Vitest: tracker-pages tests updated to the new controls (feeling levels are now `role="radio"`; Save says "Save
  today"). All pass. `content-gate › medical review honesty` still fails: a CRLF checkout of a test fixture, per the
  nextecom session, not this branch.
- Click-throughs: log a day (symptom chip → strength 4 → hot flashes → save → back to Today); rapid + taps (1 → 4 after 3
  taps); notice close persists across a reload; PDF download; add/edit/delete treatment; theme and text size from Settings
  apply site-wide.
- No horizontal overflow and no page errors on any screen at 375/768/1280 in either theme.

## Known, not changed

- Treatments' toast timers can clear a newer message early (existing logic).
- Treatment delete still uses the browser's `confirm()`.
