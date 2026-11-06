import fs from 'node:fs';
import path from 'node:path';
import { loadContent } from '../src/lib/content/loader';
import { loadProductSlots } from '../src/lib/products/slots';
import { loadAmazonProducts } from '../src/lib/products/products';
import { parseKeywordMap } from '../src/lib/plan/keyword-map';

export function generateSlotReport(repoRoot: string = process.cwd()): string {
  const store = loadContent(
    process.env.CONTENT_ROOT ? path.resolve(process.env.CONTENT_ROOT) : path.join(repoRoot, 'content')
  );
  const slots = loadProductSlots(repoRoot);
  const amazonProducts = loadAmazonProducts(repoRoot);
  const mapFile = path.join(repoRoot, 'content', '_plan', 'keyword-map.csv');
  const rows = fs.existsSync(mapFile) ? parseKeywordMap(fs.readFileSync(mapFile, 'utf8')).rows : [];
  const priorityByUrl = new Map(rows.map((r) => [r.url, r.priority]));

  interface ReportEntry {
    page_url: string;
    page_title: string;
    slot_id: string;
    category: string;
    planned_partners: string;
    network: string;
    placement_rules: string;
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
          planned_partners: slot.planned_partners.join('; ') || 'Owner choice',
          network: slot.network ?? 'TBD',
          placement_rules: slot.placement_rules ?? `Clusters: ${slot.allowed_clusters.join(', ')}`,
          reader_need: slot.reader_need,
          claim_limit: slot.claim_limit,
          priority: priorityByUrl.get(page.url) ?? 2,
          status: slot.status,
        });
      }
    }

    const prodMatches = page.body.matchAll(/<(?:Product|ProductBlock)\s+id=["']([a-z0-9-]+)["']|::(?:product|product-block)\{id=["']([a-z0-9-]+)["']\}/gi);
    for (const m of prodMatches) {
      const prodId = m[1] || m[2];
      const prod = amazonProducts.get(prodId);
      if (prod) {
        entries.push({
          page_url: page.url,
          page_title: page.fm.title,
          slot_id: prodId,
          category: `amazon: ${prod.brand}`,
          planned_partners: `${prod.name} (ASIN ${prod.asin})`,
          network: `Amazon Associates (${prod.tracking_id})`,
          placement_rules: `Allowed topics: ${prod.allowed_topics.join(', ')}`,
          reader_need: prod.best_for,
          claim_limit: prod.what_it_wont_do,
          priority: priorityByUrl.get(page.url) ?? 2,
          status: 'filled',
        });
      }
    }
  }

  // Also append planned partner target pages that are ready for owner partner links
  const plannedPartnerMatrix: Array<{
    page_url: string;
    page_title: string;
    slot_id: string;
    category: string;
    planned_partners: string;
    network: string;
    placement_rules: string;
    reader_need: string;
    claim_limit: string;
    priority: number;
  }> = [
    {
      page_url: '/compare/',
      page_title: 'Best menopause telehealth: compared by situation',
      slot_id: 'telehealth-consultation',
      category: 'menopause telehealth',
      planned_partners: 'Midi; Allara; Hers; Alloy',
      network: 'Impact',
      placement_rules: 'Ranked by clinician credentials, cost, and insurance—never commission',
      reader_need: 'Connecting with a certified menopause specialist when local care is delayed',
      claim_limit: 'Medical access facilitator, does not guarantee specific prescriptions',
      priority: 1,
    },
    {
      page_url: '/care/',
      page_title: 'Getting Menopause Care: Options, Guides, and Daily Support',
      slot_id: 'finding-care-directory',
      category: 'finding care & cash-pay doctor visits',
      planned_partners: 'Sesame Care; Midi; Allara',
      network: 'Impact',
      placement_rules: 'Finding care and appointment booking guides only',
      reader_need: 'Booking transparent cash-pay or insurance-covered menopause consultations',
      claim_limit: 'Appointment booking facilitator, not emergency care',
      priority: 1,
    },
    {
      page_url: '/symptoms/mood-changes/',
      page_title: 'Mood changes, irritability and anxiety in perimenopause',
      slot_id: 'cbt-sleep-programme',
      category: 'CBT and mood support',
      planned_partners: 'Blossom Health',
      network: 'Impact',
      placement_rules: 'Mood pages only (strictly excluded from crisis or self-harm sections)',
      reader_need: 'Evidence-based cognitive behavioural therapy and psychiatric support for midlife mood changes',
      claim_limit: 'Outpatient mental health support only, never a crisis line',
      priority: 1,
    },
    {
      page_url: '/symptoms/incontinence/',
      page_title: 'Bladder Leaks in Menopause: Causes, Types, and What Actually Helps',
      slot_id: 'incontinence-products',
      category: 'bladder leak support',
      planned_partners: 'Uresta; Elvie (FlexOffers)',
      network: 'Impact / FlexOffers',
      placement_rules: 'Bladder leaks and pelvic floor pages only',
      reader_need: 'Mechanical bladder support for stress leaks and biofeedback PFMT training',
      claim_limit: 'Supports stress incontinence management, does not treat UTI or urge incontinence',
      priority: 1,
    },
    {
      page_url: '/care/sleepwear-for-night-sweats/',
      page_title: 'Best Sleepwear for Night Sweats: How to Choose',
      slot_id: 'moisture-wicking-sleepwear',
      category: 'sleepwear',
      planned_partners: 'Lusome (Awin); Cool-jams direct',
      network: 'Awin / Direct',
      placement_rules: 'Sleepwear buying guides and night sweats pages',
      reader_need: 'Moisture-wicking sleepwear to prevent post-sweat chills',
      claim_limit: 'Overnight comfort only, does not stop vasomotor symptoms',
      priority: 1,
    },
    {
      page_url: '/symptoms/hot-flashes/',
      page_title: 'Hot flashes in perimenopause: why they happen and what helps',
      slot_id: 'bedside-cooling-fans',
      category: 'personal cooling & hot flash relief',
      planned_partners: 'OPAL COOL (Impact); BedJet (CJ)',
      network: 'Impact / CJ',
      placement_rules: 'Hot flashes and cooling product pages only',
      reader_need: 'Immediate surface cooling during vasomotor surges',
      claim_limit: 'Immediate surface cooling comfort only, does not treat hot flashes',
      priority: 1,
    },
  ];

  for (const pm of plannedPartnerMatrix) {
    const alreadyPresent = entries.some(
      (e) => e.page_url === pm.page_url && e.slot_id === pm.slot_id && e.planned_partners === pm.planned_partners
    );
    if (!alreadyPresent) {
      entries.push({ ...pm, status: 'planned_partner_pending_owner_link' });
    }
  }

  entries.sort((a, b) => a.priority - b.priority || a.page_url.localeCompare(b.page_url));

  const csvRows = [
    'page_url,page_title,slot_id,category,planned_partners,network,placement_rules,reader_need,claim_limit,priority,status',
    ...entries.map(
      (e) =>
        `"${e.page_url}","${e.page_title.replace(/"/g, '""')}","${e.slot_id}","${e.category.replace(
          /"/g,
          '""'
        )}","${e.planned_partners.replace(/"/g, '""')}","${e.network.replace(/"/g, '""')}","${e.placement_rules.replace(
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
