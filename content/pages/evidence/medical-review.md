---
title: Our medical review process
seo_title: How our medical and evidence review process works
meta_description: "How MenoVerdict verifies clinical claims against primary sources, separates editorial writing from clinician review, and handles updates."
cluster: evidence
primary_keyword: medical review process
slug: medical-review
page_type: evidence
secondary_keywords: [menopause medical review, clinical review standards]
search_intent: navigational
funnel_stage: learn
symptom_tags: []
stage_tags: [all]
audience_limits: []
reviewed_at: null
review_due: null
status: published
author: editorial-team
reviewer: null
updated_at: "2026-11-06"
change_log:
  - { date: "2026-11-06", summary: "Published medical review and honesty process page", material: true }
evidence_grade: null
claims: []
safety_flags: []
cta_profile: site_none
hub: /evidence/
sources: []
related: [/evidence/, /evidence/how-we-grade/, /evidence/editorial-policy/]
affiliate_disclosure: false
---

At MenoVerdict, we never fake or imply clinical sign-off where none has taken place. This page explains how our source verification works today, what our honesty notice means on every page, and how clinician review is cryptographically locked to page versions.

## 1. Source verification before publication

Before any health page is published, every factual claim in the article must be mapped in the page's frontmatter to a specific entry in our verified source registry and cited inline in the text. See [how we check the evidence](/evidence/) and [how we grade evidence](/evidence/how-we-grade/) for the source hierarchy we use (regulator labels and statements first, followed by medical society position statements, systematic reviews, and randomized controlled trials).

If a statistic or medical claim cannot be confirmed directly from a source we have opened and checked, we remove the claim and log it rather than guessing.

## 2. Our honesty rule on medical review

Many health websites display a "Medically reviewed" badge on pages that have not been reviewed by a named clinician, or keep the badge visible after the text has been edited. Our publishing gate forbids both:

- **When a page has not yet been reviewed by a named clinician:** The page displays a clear notice at the top stating that the article was written by the MenoVerdict editorial team from cited sources, **has not been written by a doctor**, and **has not yet been reviewed by a named clinician**. No `reviewedBy` structured data is emitted in the page's JSON-LD.
- **When a verified clinician reviews a page:** Their full name, credentials, and review date are recorded in `content/_people/people.yaml` alongside a SHA-256 hash (`approved_hash`) of the exact article text and frontmatter they approved.
- **Automatic reset on edit:** If a single sentence of a clinically reviewed article or tool is later changed, the SHA-256 hash no longer matches and the page automatically reverts to the unreviewed honesty notice until the clinician approves the updated version.

## 3. Interactive tool logic review

Each interactive tool on our [free menopause tools hub](/tools/) is governed by a plain-language specification file (`content/_tools/<id>.yaml`) that lists every input, calculation, output, safety trigger, and code file implementing the tool. Our [editorial policy](/evidence/editorial-policy/) and [commercial disclosure](/about/how-we-make-money/) set out how we keep commercial links strictly separate from clinical evidence and tool outputs.

