import fs from 'node:fs';
import path from 'node:path';
import { buildSiteGraph, writeSiteGraph } from '../src/lib/seo/site-graph';
import { Report } from './lib/report';

const r = new Report('validate:graph');
const graph = buildSiteGraph();
writeSiteGraph();

const nodes = Object.values(graph.nodes);
const nodesByUrl = new Map(nodes.map((n) => [n.url, n]));

// Track anchor text patterns across pages
const anchorTargets = new Map<string, Set<string>>();
const pageIncomingAnchors = new Map<string, Map<string, number>>();

const isExempt = (t: string) => ['legal', 'about', 'evidence'].includes(t);

for (const node of nodes) {
  // Check click depth (fail if > 3 clicks from homepage, legal/site pages exempt)
  if (!isExempt(node.page_type) && node.click_depth > 3 && nodes.length > 5) {
    r.error(node.url, `click depth is ${node.click_depth} (maximum allowed is 3 clicks from homepage)`);
  }

  // Check incoming contextual links (fail if none, legal/site exempt)
  if (!isExempt(node.page_type) && node.incoming_links.length === 0 && nodes.length > 5) {
    r.error(node.url, 'orphan page: has no incoming internal links');
  }

  // Check outgoing internal links (fail if < 3, legal/site exempt)
  if (!isExempt(node.page_type) && node.outgoing_links.length < 3 && nodes.length > 5) {
    r.warn(node.url, `has only ${node.outgoing_links.length} outgoing internal link(s) (minimum recommended: 3)`);
  }

  // Hub checks: A page's hub must link to it, or it must link to its hub
  if (node.hub && node.hub !== node.url) {
    const hasLinkToHub = node.outgoing_links.some((l) => l.url === node.hub);
    const hubNode = nodesByUrl.get(node.hub);
    if (hubNode && !hasLinkToHub) {
      r.warn(node.url, `does not link to its parent hub ${node.hub}`);
    }
  }

  // Record anchor text patterns
  for (const out of node.outgoing_links) {
    const anchor = out.anchor.trim().toLowerCase();
    if (anchor.length > 3) {
      if (!anchorTargets.has(anchor)) anchorTargets.set(anchor, new Set());
      anchorTargets.get(anchor)!.add(out.url);

      if (!pageIncomingAnchors.has(out.url)) pageIncomingAnchors.set(out.url, new Map());
      const map = pageIncomingAnchors.get(out.url)!;
      map.set(anchor, (map.get(anchor) ?? 0) + 1);
    }
  }
}

// Keyword & intent duplication check
const keywordIntentMap = new Map<string, string[]>();
for (const node of nodes) {
  const key = `${node.primary_keyword.toLowerCase()}::${node.intent.toLowerCase()}`;
  keywordIntentMap.set(key, [...(keywordIntentMap.get(key) ?? []), node.url]);
}
for (const [key, urls] of keywordIntentMap) {
  if (urls.length > 1) {
    r.error(urls.join(', '), `two or more pages target the same primary keyword and intent: "${key}"`);
  }
}

// Generate reports/link-graph.csv
const reportsDir = path.join(process.cwd(), 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const csvLines = [
  'url,title,page_type,cluster,click_depth,incoming_links_count,outgoing_links_count,status',
  ...nodes.map(
    (n) =>
      `"${n.url}","${n.title.replace(/"/g, '""')}","${n.page_type}","${n.cluster}",${n.click_depth},${n.incoming_links.length},${n.outgoing_links.length},"${n.status}"`
  ),
];
fs.writeFileSync(path.join(reportsDir, 'link-graph.csv'), csvLines.join('\n'), 'utf8');

// Generate reports/seo-sync-report.md
const orphans = nodes.filter((n) => n.page_type !== 'legal' && n.incoming_links.length === 0);
const deepPages = nodes.filter((n) => n.click_depth > 3);
const weakPages = nodes.filter((n) => n.incoming_links.length <= 1);

const mdReport = `# SEO & Site Graph Sync Report
Generated: ${new Date().toISOString()}
Total indexed nodes: ${nodes.length}

## Summary
- Orphan pages: ${orphans.length}
- Pages with click depth > 3: ${deepPages.length}
- Weak pages (<= 1 incoming link): ${weakPages.length}

## Weak / Orphan Pages
${
  orphans.length === 0
    ? 'None. All published pages have incoming internal links.'
    : orphans.map((o) => `- [${o.title}](${o.url}) (depth ${o.click_depth})`).join('\n')
}

## Click Depth Distribution
- Depth 0 (Homepage): 1
- Depth 1 (Main Hubs & Primary Navigation): ${nodes.filter((n) => n.click_depth === 1).length}
- Depth 2 (Core Cluster Content): ${nodes.filter((n) => n.click_depth === 2).length}
- Depth 3 (Deep Questions & Subtopics): ${nodes.filter((n) => n.click_depth === 3).length}
- Depth > 3: ${deepPages.length}
`;
fs.writeFileSync(path.join(reportsDir, 'seo-sync-report.md'), mdReport, 'utf8');

r.finish();
