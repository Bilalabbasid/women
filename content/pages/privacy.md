---
title: "Privacy notice and health data retention policy"
seo_title: Privacy policy and health data retention notice
meta_description: "Our privacy commitments: on-device health data by default, UK GDPR special-category consent, and strict data retention schedules."
cluster: site
primary_keyword: privacy policy
slug: privacy
page_type: legal
secondary_keywords: []
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
  - { date: "2026-11-06", summary: "Legal draft for UK GDPR special category, GDPR, and US health privacy", material: true }
evidence_grade: null
claims: []
safety_flags: []
cta_profile: site_none
hub: null
sources: []
related: [/cookies/, /terms/, /medical-disclaimer/]
affiliate_disclosure: false
---

> **Notice to readers:** This is a working legal draft prepared in accordance with UK GDPR special category data rules, the EU GDPR, and US state consumer health data privacy laws (including Washington My Health My Data Act). It is scheduled for qualified legal counsel review before production database sync is activated. This notice does not constitute formal legal certification.

Your health data is sensitive and personal. Our architecture is built around a single rule: **your symptom and health tracking data stays on your personal device by default.**

## 1. Data processing principles

- **On-device storage**: The symptom tracker, symptoms checklist, and doctor reports store entries inside your browser using IndexedDB. We cannot view, access, or sell this data.
- **Reading without accounts**: You can access every article, guide, evidence grade, and core interactive tool without creating an account or providing an email address.
- **No health data in marketing or analytics**: We do not transmit health entries, symptom ticks, or severity logs to web analytics providers, advertising platforms, or tracking pixels.

## 2. Server storage and explicit consent (UK GDPR Article 9)

Under UK GDPR and EU GDPR Article 9, health data constitutes special category personal data requiring explicit, unbundled consent before server processing:

1. **Separate consent screen**: An account holds only minimal login credentials (email). Creating an account never implies consent to store health records.
2. **Mandatory retention choice**: Before server sync can occur, you must actively select a retention period of 10, 20, 30, or 90 days. No option is preselected.
3. **Automated deletion**: Records reaching their chosen retention age are permanently and irreversibly purged by an automated daily deletion task.
4. **Withdrawal of consent**: You may withdraw your consent at any time from your account settings. Withdrawing consent immediately halts sync and deletes all server-stored health records.

## 3. Data subject rights and requests

You have the following rights regarding your personal information:

- **Right of access**: Request a complete export of your account and synced health records.
- **Right to erasure**: Request permanent deletion of your account and all associated server records.
- **Right to rectification**: Update inaccurate account details.
- **Right to lodge a complaint**: You have the right to lodge a complaint with the UK Information Commissioner&apos;s Office (ICO) or your relevant EU data protection authority.

To submit a data subject request, contact our team at the address listed on our contact page.

## 4. Backups and encryption

All communications are encrypted in transit using Transport Layer Security (TLS 1.3). Any stored server data is encrypted at rest using AES-256. Database backups retain deleted records for a maximum of 30 days before full rotational overwrite.
