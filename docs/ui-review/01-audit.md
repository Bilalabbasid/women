# UI/UX audit: before

Captured 2026-11-07 from `ui-redesign` @ fe3c1ae (dev server, port 3001).
Screenshots: `docs/ui-review/before/<page>_<width>_<theme>.jpg` (full page) and `…_fold.jpg` (first screen).
Pages: home, `/symptoms/night-sweats/`, `/does-it-work/black-cohosh/`, `/compare/midi-vs-alloy/`,
`/tools/symptom-tracker/`, `/app/today/`, `/tools/does-it-work-checker/`, `/symptoms/` at 375 / 768 / 1280 px,
light and dark.

## The 15 biggest problems, worst first

1. **There is no dark mode.** All 48 dark-mode screenshots are identical to the light ones. At 3 a.m. with the
   screen dimmed, she gets a full-glare ivory page with pure-white cards. Nothing reads `prefers-color-scheme`,
   and there is no theme toggle.
2. **The answer starts about three phone screens down.** On `/symptoms/night-sweats/` at 375 px, the first sentence of
   the article sits about 2,100 px below the top. Before it come: the header, a two-row nav, a three-line breadcrumb,
   "Save for later", a green hero, a stats card ("Graded per option below"), the notice line, a five-item TOC
   and an affiliate disclosure box. Verdict, tool and hub pages follow the same pattern.
3. **The mobile navigation is a cut-off scrolling strip.** It shows "Perimenopause · Symptoms · Treatments" and clips the
   rest. "Does it work?", "Tools" and "Search" can only be found by sideways-scrolling a row that doesn't look
   scrollable. There's no menu, no search icon, and the header takes about 155 px.
4. **On first visit, the storage-choice banner covers half the phone screen.** It hides the homepage question, the search
   box and the popular chips. On a calm-first site, the first thing she sees is a decision about device storage.
5. **Grades have no scale.** Every grade is a small pill. Nothing shows that "Not supported" is near the
   bottom of a five-step ladder and "Strong" is at the top. Verdict pages show their headline grade inside a generic
   stats card, at the same weight as "Reading time 2 min". There is no meter and no tap-to-explain.
6. **The homepage's first phone screen doesn't do its job.** The trust badge sits above the question. There's no
   "tap what you're feeling" picker and no quiz CTA. The search placeholder is truncated ("Search symptoms, tre"),
   and below the fold the same stats repeat twice (a hero chip row, then four stat cards).
7. **No "Short answer", and everything is the same white card.** The intro paragraph, TOC, disclosure, doctor questions,
   product cards and "Where are you right now?" all share the same rounded white box. The eye can't tell
   an answer from a nav aid, from a paid link.
8. **Product cards look like editorial content.** Same card, same serif title, and "Check it on Amazon" is a solid green
   primary button, identical to the site's own CTAs ("Open the tracker", "Log first check-in"). "What it won't do"
   and "Check first" are there but look like body text.
9. **Callouts have no identity.** The doctor questions box on the verdict page has no heading at all; it's just a
   bulleted card followed by generic "Copy questions / Print this page" buttons. "Try tonight", red flags,
   "What the evidence says" and "Comfort, not treatment" don't exist as recognisable styles.
10. **Breadcrumbs take three lines on a phone.** They wrap with full page titles ("Perimenopause and menopause
    symptoms › Night Sweats: How to Sleep Cooler Tonight") and repeat the H1 right below.
11. **The evidence checker buries its own tool.** At 375 px there are about 700 px of intro text, then a safety form,
    then three native `<select>`s. Results start about 2,500 px down, and the page is 26,800 px tall. No filter chips,
    no in-place count, and no shortlist tray visible while scrolling.
12. **The comparison page hides the decision.** "Choose Midi if / Choose Alloy if" is the last bulleted list on the
    page. There are no side-by-side cards and no feature table, and the "Quick answer" is a plain bordered paragraph.
13. **The symptoms hub is a long list, not a hub.** There are no groups with icons (Sleep & temperature, Mind & mood…),
    no filter chips and no on-page search. The hero has a second "On this page" box and the "We are not doctors"
    link inside it, so the hub's own list starts about 1,450 px down.
14. **The decorative motion fights "calm".** Spinning conic-gradient borders on cards, drifting blurred orbs, a
    light sweep that "scans" the verdict cards, and rotating icon watermarks. These read as a tech-startup landing
    page, not a library, and they cost paint time on low-end phones.
15. **`/app/today` feels like a dev dashboard, not a calm app.** It uses jargon ("Stored on this device (IndexedDB)",
    "Deterministic calculations", "Regimens"). The logo is a different mark ("MV" tile). The bottom tab bar covers the
    "Recent logs" card. The 5 feeling buttons are small number+word boxes, and there's no first-run onboarding.

Also noted: no text-size control. The honesty notice appears in three different styles on one page (hero link,
notice line, footer box). The desktop "Contents" sidebar doesn't stick while reading. Tables scroll sideways
on phones instead of becoming cards.

## Already good: keep

- The **18 px body minimum**, about 68-character measure, and 1.65–1.8 line height in `.prose`.
- The **deep green #1F5A4C** as the anchor, and the warm-paper (not clinical-white) base.
- **Grade pills always carry a text label** (dot + word), so colour is never the only signal. The grade
  vocabulary and colours are a sound base for the meter.
- The **desktop homepage hero composition**: the question on the left, live verdict cards on the right, and search
  in the hero.
- **Visible focus rings**, the skip link, 44 px `.tap` targets, the reduced-motion handling and the existing print stylesheet.
- The **plain, honest copy**: "We are not doctors — here's how this site works", "Grades are set before we
  check for any commission".
- Behaviour that the nextecom session owns and must not regress: `CONSENT_PAINT_SCRIPT` and `.consent-set`
  (LCP), `ToolLoader`'s `next/dynamic` imports (keeps Dexie off articles), and `HonestyNotice`/`honesty.ts`.
