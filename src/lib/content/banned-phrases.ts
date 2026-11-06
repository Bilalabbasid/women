/**
 * Banned phrases (AGENTS.md "Automated checks" and "Copy rules"). Matching is
 * case-insensitive on page text. A page may override a phrase only with an
 * explicit, reasoned `banned_phrase_overrides` entry, for example when quoting a
 * claim in order to debunk it.
 */
export const BANNED_PHRASES: Array<{ phrase: string; pattern: RegExp; why: string }> = [
  { phrase: 'cure', pattern: /\bcur(e|es|ed|ing)\b/i, why: 'promises a result no menopause option can guarantee' },
  { phrase: 'clinically proven', pattern: /\bclinically[- ]proven\b/i, why: 'needs a qualifying source and wording' },
  { phrase: 'balance your hormones', pattern: /\bbalanc(e|es|ing) your hormones\b/i, why: 'unscientific marketing claim' },
  { phrase: 'hormone balance', pattern: /\bhormon(e|al) balance\b/i, why: 'unscientific marketing claim' },
  { phrase: "doctors won't tell you", pattern: /\bdoctors (won['’]t|will not|don['’]t want to) tell you\b/i, why: 'manipulative copy' },
  { phrase: 'doctors hate', pattern: /\bdoctors hate\b/i, why: 'manipulative copy' },
  { phrase: 'fix your hormones', pattern: /\bfix your hormones\b/i, why: 'promises a result' },
  { phrase: 'balance your body naturally', pattern: /\bbalance your body naturally\b/i, why: 'unscientific marketing claim' },
  { phrase: 'miracle', pattern: /\bmiracle\b/i, why: 'promises a result' },
  { phrase: 'guaranteed', pattern: /\bguarantee(d|s)?\b/i, why: 'promises a result' },
  { phrase: 'limited time', pattern: /\blimited[- ]time\b|\bact now\b|\bonly \d+ left\b/i, why: 'fake urgency or scarcity' },
  { phrase: 'detox', pattern: /\bdetox(es|ing)?\b/i, why: 'unsupported health claim' },
  { phrase: 'you have', pattern: /\byou have (menopause|perimenopause|a hormone|low estrogen|an? (deficiency|imbalance))\b/i, why: 'diagnostic language' },
  { phrase: 'you should take', pattern: /\byou should (take|start|stop) \w+/i, why: 'individual prescribing language' },
];

export function findBannedPhrases(
  text: string,
  overrides: Array<{ phrase: string; reason: string }> = [],
): Array<{ phrase: string; why: string; match: string }> {
  const allowed = new Set(overrides.map((o) => o.phrase.toLowerCase()));
  const hits: Array<{ phrase: string; why: string; match: string }> = [];
  for (const b of BANNED_PHRASES) {
    if (allowed.has(b.phrase.toLowerCase())) continue;
    const m = b.pattern.exec(text);
    if (m) hits.push({ phrase: b.phrase, why: b.why, match: m[0] });
  }
  return hits;
}
