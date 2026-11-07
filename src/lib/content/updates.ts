/**
 * Reads the evidence updates log (content/pages/evidence/updates.md) so the
 * newest entries can be listed elsewhere. Each entry is a level-3 heading of the
 * form "### Month D, YYYY: What happened", followed by a list whose "Pages
 * updated" item links to the affected pages.
 */
export const UPDATES_URL = '/evidence/updates/';

export interface EvidenceUpdate {
  /** As written in the log, e.g. "February 12, 2026". */
  dateLabel: string;
  /** ISO date (YYYY-MM-DD) for sorting and <time>. */
  date: string;
  title: string;
  /** First page the entry says it updated, if any. */
  href: string | null;
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

function toIso(label: string): string | null {
  const m = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(label.trim());
  if (!m) return null;
  const month = MONTHS.indexOf(m[1].toLowerCase());
  if (month < 0) return null;
  return `${m[3]}-${String(month + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

export function parseEvidenceUpdates(body: string): EvidenceUpdate[] {
  const out: EvidenceUpdate[] = [];
  const blocks = body.replace(/\r\n/g, '\n').split(/^### /m).slice(1);
  for (const block of blocks) {
    const [heading, ...rest] = block.split('\n');
    const sep = heading.indexOf(':');
    if (sep < 0) continue;
    const dateLabel = heading.slice(0, sep).trim();
    const date = toIso(dateLabel);
    if (!date) continue;
    const title = heading.slice(sep + 1).trim();
    const pagesLine = rest.find((l) => /\*\*Pages updated\*\*/.test(l)) ?? '';
    const link = /\]\((\/[^)\s]*)\)/.exec(pagesLine);
    out.push({ dateLabel, date, title, href: link ? link[1] : null });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}
