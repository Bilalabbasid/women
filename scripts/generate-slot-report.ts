import fs from 'node:fs';
import path from 'node:path';
import { loadContent } from '../src/lib/content/loader';
import { loadProductSlots } from '../src/lib/products/slots';
import { parseKeywordMap } from '../src/lib/plan/keyword-map';

export function generateSlotReport(repoRoot: string = process.cwd()): string {
  const store = loadContent(
    process.env.CONTENT_ROOT ? path.resolve(process.env.CONTENT_ROOT) : path.join(repoRoot, 'content')
  );
  const slots = loadProductSlots(repoRoot);
  const mapFile = path.join(repoRoot, 'content', '_plan', 'keyword-map.csv');
  const rows = fs.existsSync(mapFile) ? parseKeywordMap(fs.readFileSync(mapFile, 'utf8')).rows : [];
  const priorityByUrl = new Map(rows.map((r) => [r.url, r.priority]));

  interface ReportEntry {
    page_url: string;
    page_title: string;
    slot_id: string;
    category: string;
    reader_need: string;
    claim_limit: string;
    priority: number;
    status: string;
  }

  const entries: ReportEntry[] = [];

  for (const page of store.pages) {
    const slotMatches = page.body.matchAll(/<ProductSlot\s+id=["']([a-z0-9-]+)["']|::product-slot\{id=["']([a-z0-9-]+)["']\}/gi);
    for (const m of slotMatches) {
      const slotId = m[1] || m[2];
      const slot = slots.get(slotId);
      if (slot) {
        entries.push({
          page_url: page.url,
          page_title: page.fm.title,
          slot_id: slotId,
          category: slot.category,
          reader_need: slot.reader_need,
          claim_limit: slot.claim_limit,
          priority: priorityByUrl.get(page.url) ?? 2,
          status: slot.status,
        });
      }
    }
  }

  // Sort by page priority (1 first, then 2, then 3)
  entries.sort((a, b) => a.priority - b.priority || a.page_title.localeCompare(b.page_title));

  const csvRows = [
    'page_url,page_title,slot_id,category,reader_need,claim_limit,priority,status',
    ...entries.map(
      (e) =>
        `"${e.page_url}","${e.page_title.replace(/"/g, '""')}","${e.slot_id}","${e.category.replace(
          /"/g,
          '""'
        )}","${e.reader_need.replace(/"/g, '""')}","${e.claim_limit.replace(/"/g, '""')}",${e.priority},"${e.status}"`
    ),
  ];

  const outPath = path.join(repoRoot, 'content', '_products', 'slot-report.csv');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, csvRows.join('\n'), 'utf8');
  return outPath;
}

if (process.argv[1]?.includes('generate-slot-report')) {
  const p = generateSlotReport();
  console.log(`Generated slot report at ${p}`);
}
