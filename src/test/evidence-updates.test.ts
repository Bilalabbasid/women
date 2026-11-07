import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseEvidenceUpdates } from '@/lib/content/updates';

describe('evidence updates log', () => {
  it('parses entries newest first with their first affected page', () => {
    const body = [
      '## 2025',
      '### November 10, 2025: Older entry',
      '- **Pages updated**: [A](/a/) and [B](/b/).',
      '## 2026',
      '### February 12, 2026: Newer entry',
      '- **What changed**: something [x](/not-this/).',
      '- **Pages updated**: [C](/c/).',
      '### Not a dated heading',
    ].join('\n');
    expect(parseEvidenceUpdates(body)).toEqual([
      { dateLabel: 'February 12, 2026', date: '2026-02-12', title: 'Newer entry', href: '/c/' },
      { dateLabel: 'November 10, 2025', date: '2025-11-10', title: 'Older entry', href: '/a/' },
    ]);
  });

  it('reads at least one entry from the real log', () => {
    const raw = fs.readFileSync(path.join(process.cwd(), 'content/pages/evidence/updates.md'), 'utf8');
    const updates = parseEvidenceUpdates(raw);
    expect(updates.length).toBeGreaterThan(0);
    for (const u of updates) expect(u.href).toMatch(/^\//);
  });
});
