/**
 * Optional, neutral question starters for the doctor report.
 *
 * These are prompts she can choose to add. Nothing is pre-filled, because a
 * pre-filled question assumes facts about her (for example, that she uses HRT).
 * None of these imply a diagnosis, a drug or a dose.
 *
 * STATUS: draft. Needs clinician review before launch (see DECISIONS.md D-014).
 */
export const DOCTOR_QUESTION_STARTERS: readonly string[] = [
  'Could these symptoms be related to perimenopause or menopause, and what else should we rule out?',
  'Which treatment options, hormonal and non-hormonal, might suit my situation, and what are the risks for someone with my health history?',
  'Are any tests useful for me, and what would the results change?',
  'Which changes in my symptoms should prompt me to come back sooner or seek urgent care?',
  'When should we review how things are going?',
] as const;
