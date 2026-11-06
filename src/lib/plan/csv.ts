/**
 * Small RFC 4180 CSV/TSV reader and writer. Handles quoted fields, escaped
 * quotes, CRLF, UTF-8 BOM and UTF-16 (Google Keyword Planner exports TSV in UTF-16LE).
 */

export function decodeText(buf: Buffer): string {
  if (buf[0] === 0xff && buf[1] === 0xfe) return buf.subarray(2).toString('utf16le');
  if (buf[0] === 0xfe && buf[1] === 0xff) {
    const swapped = Buffer.from(buf.subarray(2));
    swapped.swap16();
    return swapped.toString('utf16le');
  }
  const s = buf.toString('utf8');
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/** Picks the delimiter from the first few lines (Keyword Planner puts a title and date line above the header). */
type Delimiter = ',' | '\t' | ';';

export function detectDelimiter(head: string): Delimiter {
  const counts: Record<Delimiter, number> = { ',': 0, '\t': 0, ';': 0 };
  for (const ch of head) if (ch in counts) counts[ch as Delimiter]++;
  const best = (Object.entries(counts) as Array<[Delimiter, number]>).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : ',';
}

export function parseDelimited(text: string, delimiter?: string): string[][] {
  const delim = delimiter ?? detectDelimiter(text.split(/\r?\n/).slice(0, 5).join('\n'));
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"' && field === '') quoted = true;
    else if (ch === delim) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Rows as objects keyed by header. Skips preamble lines before the header (Keyword Planner adds two). */
export function parseTable(text: string, headerMatch?: (cells: string[]) => boolean): Array<Record<string, string>> {
  const rows = parseDelimited(text);
  const headerIdx = headerMatch ? rows.findIndex(headerMatch) : 0;
  if (headerIdx < 0) return [];
  const header = rows[headerIdx].map((h) => h.trim());
  return rows.slice(headerIdx + 1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

export function toCsv(columns: readonly string[], rows: Array<Record<string, string>>): string {
  const cell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return `${[columns.join(','), ...rows.map((r) => columns.map((c) => cell(r[c] ?? '')).join(','))].join('\n')}\n`;
}
