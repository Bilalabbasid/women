/**
 * Comparison page components: "Choose X if… / Choose Y if…" cards and a
 * responsive comparison table (cards under 600px). Server components, no
 * JavaScript. Styles: src/app/styles/hubs.css.
 *
 * ─── Wiring (for (site)/[...slug]/page.tsx) ──────────────────────────────────
 * Data source: the page's own markdown, `page.body` (already loaded there).
 *
 *   import { ChooseCards, CompareTable, extractChoices, extractTable } from '@/components/site/compare-cards';
 *
 *   const choices = fm.page_type === 'comparison' ? extractChoices(page.body) : [];
 *   const table = fm.page_type === 'comparison' || page.url === '/compare/' ? extractTable(page.body) : null;
 *
 *   // Right after {bodyNotice}, before the first prose part ("Short answer"):
 *   {choices.length >= 2 && <ChooseCards choices={choices} />}
 *   // Optional, also near the top. The same table still renders in the prose
 *   // further down, so only add this if that prose table is removed or hidden:
 *   {table && <CompareTable table={table} caption="Side by side" />}
 *
 * extractChoices reads list items of the form `- **Choose Midi if:** reason…`
 * (every head-to-head page in content/pages/compare/ has them under "Who each
 * suits"). A reason with "or" / ";" / "," between clauses is split into
 * separate ticks at " or " boundaries only when that yields 2–4 short parts;
 * otherwise it's shown whole. extractTable reads the first GFM table.
 * Both return empty results when the page has no such content: render nothing.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import '@/app/styles/hubs.css';

export interface Choice {
  /** "Midi" */
  name: string;
  /** Short reasons, in the page's own words. */
  reasons: string[];
}

export interface CompareTableData {
  columns: string[];
  rows: Array<{ name: string; cells: string[] }>;
}

/** Plain text from inline markdown: drops **bold**, _em_, `code` and link syntax. */
function inlineText(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[^\w])[_*]([^_*]+)[_*](?=[^\w]|$)/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function splitReasons(text: string): string[] {
  const clean = text.replace(/\.$/, '').trim();
  const parts = clean.split(/,\s+or\s+|;\s+|\s+or\s+(?=you\b|your\b)/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2 && parts.length <= 4 && parts.every((p) => p.length >= 12)) {
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  }
  return [clean.charAt(0).toUpperCase() + clean.slice(1)];
}

/** `- **Choose X if:** reason` items, in page order. */
export function extractChoices(markdown: string): Choice[] {
  const out: Choice[] = [];
  const re = /^\s*[-*]\s+\*\*Choose\s+(.+?)\s+if:?\*\*:?\s*(.+)$/gim;
  for (const m of markdown.matchAll(re)) {
    out.push({ name: inlineText(m[1]), reasons: splitReasons(inlineText(m[2])) });
  }
  return out;
}

/** The first GFM table in the markdown, or null. */
export function extractTable(markdown: string): CompareTableData | null {
  const lines = markdown.split(/\r?\n/);
  for (let i = 0; i < lines.length - 2; i++) {
    const head = lines[i].trim();
    const sep = lines[i + 1].trim();
    if (!head.startsWith('|') || !/^\|?\s*:?-{3,}/.test(sep)) continue;
    const cells = (l: string) =>
      l
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => inlineText(c.trim()));
    const columns = cells(head);
    const rows: CompareTableData['rows'] = [];
    for (let j = i + 2; j < lines.length && lines[j].trim().startsWith('|'); j++) {
      const c = cells(lines[j]);
      rows.push({ name: c[0] ?? '', cells: c.slice(1, columns.length) });
    }
    return rows.length ? { columns, rows } : null;
  }
  return null;
}

/** "Choose X if… / Choose Y if…": two cards side by side, stacked on phones. */
export function ChooseCards({ choices, heading = 'Which suits you?' }: { choices: Choice[]; heading?: string }) {
  if (choices.length < 2) return null;
  return (
    <section aria-labelledby="choose-heading">
      <h2 id="choose-heading" className="visually-hidden">
        {heading}
      </h2>
      <div className="choose-cards">
        {choices.map((c) => (
          <article key={c.name} className="choose-card" aria-label={`Choose ${c.name} if`}>
            <p className="choose-card-kicker">Choose</p>
            <h3 className="choose-card-name">{c.name} if…</h3>
            <ul>
              {c.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

/** A comparison table: row headers are the options; under 600px each row is a card. */
export function CompareTable({ table, caption }: { table: CompareTableData; caption?: string }) {
  const [first, ...rest] = table.columns;
  return (
    <div className="compare-table-wrap">
      <table className="compare-table">
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            <th scope="col">{first}</th>
            {rest.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r) => (
            <tr key={r.name}>
              <th scope="row">{r.name}</th>
              {rest.map((col, i) => (
                <td key={col} data-label={col}>
                  {r.cells[i] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
