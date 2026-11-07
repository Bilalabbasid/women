/**
 * Site search engine: small, dependency-free, runs on the device.
 *
 *  - Normalises text (lower case, apostrophes and punctuation removed).
 *  - Fuzzy token matching: exact, prefix (≥3 letters), or a small edit distance
 *    (1 typo for 4–6 letters, 2 for 7+), so "flahses", "menapause", "insomina" match.
 *  - Scores title ×3, keywords ×2, description ×1. Every meaningful query word must
 *    match somewhere; if nothing does, it falls back to "close matches" (most words).
 *  - Everyday phrasing ("hot at night", "can't sleep", "angry all the time") maps to
 *    the right guides via SEARCH_PHRASES and is shown first as "Suggested".
 */

export interface SearchEntry {
  url: string;
  title: string;
  description: string;
  section: string;
  keywords: string[];
}

interface Prepared {
  e: SearchEntry;
  title: string[];
  keys: string[];
  desc: string[];
}

export interface SearchResult {
  entry: SearchEntry;
  score: number;
}

export interface SearchOutput {
  suggested: SearchEntry[];
  results: SearchResult[];
  /** True when not every word matched and these are partial matches. */
  close: boolean;
}

const STOP = new Set([
  'a', 'an', 'and', 'the', 'of', 'to', 'in', 'on', 'at', 'for', 'is', 'it', 'my', 'i', 'im', 'me', 'do', 'does', 'with',
  'what', 'how', 'why', 'can', 'all', 'time', 'get', 'be', 'am', 'are', 'or', 'so', 'too', 'very', 'really', 'about',
]);

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const tokens = (s: string) => normalize(s).split(' ').filter(Boolean);

/** Damerau-Levenshtein distance with an early exit once it exceeds `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev2 = new Array(b.length + 1).fill(0);
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev2[j] = prev[j];
    prev = cur;
  }
  return prev[b.length];
}

/** How well one query word matches one document word: 0 (no) to 1 (exact). */
function wordMatch(q: string, w: string): number {
  if (q === w) return 1;
  if (q.length >= 3 && w.startsWith(q)) return 0.85;
  if (w.length >= 4 && q.startsWith(w)) return 0.7; // "flashes" vs "flash"
  const max = q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0;
  if (max === 0) return 0;
  return editDistance(q, w, max) <= max ? 0.6 : 0;
}

function bestIn(q: string, words: string[]): number {
  let best = 0;
  for (const w of words) {
    const m = wordMatch(q, w);
    if (m > best) best = m;
    if (best === 1) break;
  }
  return best;
}

export function prepare(index: SearchEntry[]): Prepared[] {
  return index.map((e) => ({
    e,
    title: tokens(e.title),
    keys: tokens(e.keywords.join(' ')),
    desc: tokens(`${e.description} ${e.section}`),
  }));
}

/* ------------------------------------------------------------------ everyday phrasing */

/** Everyday phrases → the guides that answer them. URLs not in this build are dropped. */
export const SEARCH_PHRASES: Array<{ phrases: string[]; urls: string[] }> = [
  { phrases: ['hot at night', 'sweating at night', 'sweaty at night', 'night sweat', 'waking up soaked', 'drenched'], urls: ['/symptoms/night-sweats/'] },
  { phrases: ['hot flush', 'hot flash', 'flushing', 'overheating', 'sudden heat', 'burning up'], urls: ['/symptoms/hot-flashes/'] },
  { phrases: ['cant sleep', 'cannot sleep', 'no sleep', 'sleepless', 'trouble sleeping', 'insomnia'], urls: ['/symptoms/insomnia/', '/symptoms/waking-at-3am/'] },
  { phrases: ['waking at 3', 'wake at 3', 'waking in the night', 'wake up at night', '3am'], urls: ['/symptoms/waking-at-3am/', '/symptoms/insomnia/'] },
  { phrases: ['angry all the time', 'angry', 'rage', 'snapping', 'short tempered', 'irritable', 'losing my temper'], urls: ['/symptoms/irritability/'] },
  { phrases: ['anxious', 'anxiety', 'worry all the time', 'on edge', 'nervous'], urls: ['/symptoms/anxiety/', '/symptoms/panic-attacks/'] },
  { phrases: ['panic', 'panic attack'], urls: ['/symptoms/panic-attacks/', '/symptoms/anxiety/'] },
  { phrases: ['sad', 'low mood', 'depressed', 'crying', 'tearful', 'feel flat'], urls: ['/symptoms/depression/'] },
  { phrases: ['brain fog', 'cant think', 'cant concentrate', 'foggy', 'fuzzy head'], urls: ['/symptoms/brain-fog/', '/symptoms/memory-problems/'] },
  { phrases: ['forgetful', 'forgetting things', 'memory', 'losing words', 'cant remember'], urls: ['/symptoms/memory-problems/', '/symptoms/brain-fog/'] },
  { phrases: ['tired', 'exhausted', 'no energy', 'worn out', 'fatigue'], urls: ['/symptoms/fatigue/'] },
  { phrases: ['itchy', 'itchy skin', 'dry skin', 'crawling skin'], urls: ['/symptoms/dry-itchy-skin/'] },
  { phrases: ['itchy down there', 'dry down there', 'vaginal dryness', 'sore down there'], urls: ['/symptoms/vaginal-dryness/', '/symptoms/painful-sex/'] },
  { phrases: ['periods heavy', 'heavy periods', 'heavy bleeding', 'flooding', 'clots'], urls: ['/perimenopause/heavy-periods/'] },
  { phrases: ['irregular periods', 'missed period', 'periods all over', 'late period', 'skipped period'], urls: ['/perimenopause/irregular-periods/'] },
  { phrases: ['bleeding after menopause', 'bleeding after periods stopped', 'spotting after menopause'], urls: ['/postmenopause/bleeding/'] },
  { phrases: ['low sex drive', 'no sex drive', 'no libido', 'dont want sex', 'lost interest in sex'], urls: ['/symptoms/low-libido/'] },
  { phrases: ['sex hurts', 'painful sex', 'pain during sex'], urls: ['/symptoms/painful-sex/', '/symptoms/vaginal-dryness/'] },
  { phrases: ['aching joints', 'joint pain', 'stiff joints', 'achy', 'sore joints'], urls: ['/symptoms/joint-pain/'] },
  { phrases: ['racing heart', 'heart pounding', 'heart flutters', 'palpitations', 'skipped beats'], urls: ['/symptoms/heart-palpitations/'] },
  { phrases: ['weight gain', 'belly fat', 'gaining weight', 'middle spread'], urls: ['/symptoms/weight-gain/'] },
  { phrases: ['leaking', 'leaking urine', 'peeing when i laugh', 'bladder', 'always need to pee'], urls: ['/symptoms/incontinence/', '/symptoms/bladder-urgency/'] },
  { phrases: ['hair loss', 'thinning hair', 'losing hair'], urls: ['/symptoms/hair-thinning/'] },
  { phrases: ['headache', 'migraine'], urls: ['/symptoms/headaches/', '/symptoms/migraines/'] },
  { phrases: ['hrt', 'hormone therapy', 'hormones', 'estrogen'], urls: ['/treatments/hormone-therapy/'] },
  { phrases: ['patch or pill', 'patch vs pill', 'hrt patch'], urls: ['/treatments/hormone-therapy/patch-vs-pill/'] },
  { phrases: ['without hormones', 'non hormonal', 'no hormones'], urls: ['/treatments/nonhormonal/'] },
  { phrases: ['am i in perimenopause', 'is it perimenopause', 'what stage', 'where am i', 'is this menopause'], urls: ['/tools/stage-guide/', '/perimenopause/early-signs/'] },
  { phrases: ['does it work', 'supplements', 'natural remedies', 'herbal'], urls: ['/does-it-work/'] },
  { phrases: ['doctor wont listen', 'doctor dismissed me', 'not taken seriously', 'dismissed'], urls: ['/care/when-your-doctor-dismisses-you/'] },
  { phrases: ['questions for my doctor', 'what to ask my doctor', 'appointment'], urls: ['/tools/treatment-questions/', '/perimenopause/questions-for-your-doctor/'] },
  { phrases: ['track symptoms', 'symptom diary', 'log symptoms', 'tracker'], urls: ['/tools/symptom-tracker/'] },
];

/** Starter suggestions shown before she types. */
export const STARTER_PHRASES = ['Hot at night', "Can't sleep", 'Angry all the time', 'Brain fog', 'Heavy periods', 'Low sex drive'];

function phraseMatches(qNorm: string, qTokens: string[], phrase: string): boolean {
  const p = normalize(phrase);
  if (qNorm.includes(p)) return true;
  const pt = p.split(' ').filter((t) => !STOP.has(t));
  if (pt.length === 0) return false;
  // Every meaningful phrase word appears (fuzzily) in the query.
  return pt.every((w) => qTokens.some((q) => wordMatch(q, w) >= 0.6 || wordMatch(w, q) >= 0.6));
}

/* ------------------------------------------------------------------ search */

export function search(prepared: Prepared[], query: string, limit = 20): SearchOutput {
  const qNorm = normalize(query);
  const all = qNorm.split(' ').filter(Boolean);
  const meaningful = all.filter((t) => !STOP.has(t));
  const qTokens = meaningful.length ? meaningful : all;
  if (qTokens.length === 0) return { suggested: [], results: [], close: false };

  const byUrl = new Map(prepared.map((p) => [p.e.url, p.e]));
  const suggestedUrls: string[] = [];
  for (const row of SEARCH_PHRASES) {
    if (row.phrases.some((ph) => phraseMatches(qNorm, all, ph))) {
      for (const u of row.urls) if (byUrl.has(u) && !suggestedUrls.includes(u)) suggestedUrls.push(u);
    }
  }
  const suggested = suggestedUrls.slice(0, 3).map((u) => byUrl.get(u)!);

  const scored = prepared.map((p) => {
    let score = 0;
    let matched = 0;
    for (const q of qTokens) {
      const t = bestIn(q, p.title);
      const k = bestIn(q, p.keys);
      const d = bestIn(q, p.desc);
      const s = t * 3 + k * 2 + d;
      if (t || k || d) matched++;
      score += s;
    }
    // A phrase match anywhere in the title is a strong signal.
    if (qTokens.length > 1 && normalize(p.e.title).includes(qTokens.join(' '))) score += 4;
    return { entry: p.e, score, matched };
  });

  let pool = scored.filter((s) => s.matched === qTokens.length && s.score > 0);
  let close = false;
  if (pool.length === 0 && qTokens.length > 1) {
    const need = Math.ceil(qTokens.length / 2);
    pool = scored.filter((s) => s.matched >= need && s.score > 0);
    close = pool.length > 0;
  }
  const results = pool
    .filter((s) => !suggestedUrls.slice(0, 3).includes(s.entry.url))
    .sort((a, b) => b.score - a.score || a.entry.title.length - b.entry.title.length)
    .slice(0, limit)
    .map(({ entry, score }) => ({ entry, score }));

  return { suggested, results, close };
}

/* ------------------------------------------------------------------ index loading */

let cache: Promise<Prepared[]> | null = null;

/** Fetches /search-index.json once per page load (lazily, on first use). */
export function loadIndex(): Promise<Prepared[]> {
  if (!cache) {
    cache = fetch('/search-index.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((d: SearchEntry[]) => prepare(Array.isArray(d) ? d : []))
      .catch(() => {
        cache = null;
        return [];
      });
  }
  return cache;
}
