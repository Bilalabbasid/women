import fs from 'node:fs';
import path from 'node:path';
import { loadContent } from '../content/loader';
import { parseKeywordMap } from '../plan/keyword-map';
import { renderMarkdown } from '../content/markdown';
import { STATIC_PUBLIC_PATHS } from '../content/site-data';

export interface SiteGraphNode {
  url: string;
  title: string;
  status: string;
  primary_keyword: string;
  intent: string;
  cluster: string;
  hub: string | null;
  parent: string | null;
  symptom_tags: string[];
  page_type: string;
  stage_tags: string[];
  treatment_tags: string[];
  tool_tags: string[];
  required_links: string[];
  related: string[];
  updated_at: string;
  next_pages: string[];
  previous_pages: string[];
  canonical: string;
  redirect_from: string[];
  outgoing_links: Array<{ url: string; anchor: string; contextual: boolean }>;
  incoming_links: Array<{ url: string; anchor: string }>;
  click_depth: number;
}

export interface SiteGraph {
  generated_at: string;
  total_pages: number;
  nodes: Record<string, SiteGraphNode>;
}

export function buildSiteGraph(repoRoot: string = process.cwd()): SiteGraph {
  const store = loadContent(
    process.env.CONTENT_ROOT ? path.resolve(process.env.CONTENT_ROOT) : path.join(repoRoot, 'content')
  );
  const mapFile = path.join(repoRoot, 'content', '_plan', 'keyword-map.csv');
  const rows = fs.existsSync(mapFile) ? parseKeywordMap(fs.readFileSync(mapFile, 'utf8')).rows : [];
  const mapByUrl = new Map(rows.map((r) => [r.url, r]));

  const nodes: Record<string, SiteGraphNode> = {};

  // Add all content pages
  for (const page of store.pages) {
    const { fm } = page;
    const mapRow = mapByUrl.get(page.url);

    // Compute parent
    const segs = page.url.split('/').filter(Boolean);
    const parent = segs.length > 1 ? `/${segs.slice(0, segs.length - 1).join('/')}/` : '/';

    // Required links calculation by page type
    const required: string[] = [];
    if (fm.hub && fm.hub !== page.url) required.push(fm.hub);
    if (fm.page_type === 'symptom') {
      if (!required.includes('/symptoms/')) required.push('/symptoms/');
      const tools = (fm as unknown as { tools_recommended?: string[] }).tools_recommended ?? [];
      for (const t of tools) {
        if (!required.includes(t)) required.push(t);
      }
    } else if (fm.page_type === 'treatment') {
      if (!required.includes('/treatments/')) required.push('/treatments/');
    } else if (fm.page_type === 'hub') {
      // Hub links to its child pages
      const children = store.pages.filter((p) => p.fm.hub === page.url && p.url !== page.url).map((p) => p.url);
      required.push(...children);
    }

    nodes[page.url] = {
      url: page.url,
      title: fm.title,
      status: fm.status,
      primary_keyword: fm.primary_keyword,
      intent: mapRow?.search_intent ?? 'informational',
      cluster: fm.cluster,
      hub: fm.hub ?? null,
      parent,
      symptom_tags: fm.symptom_tags,
      page_type: fm.page_type,
      stage_tags: fm.stage_tags,
      treatment_tags: (fm as unknown as { treatment_tags?: string[] }).treatment_tags ?? [],
      tool_tags: (fm as unknown as { tools_recommended?: string[] }).tools_recommended ?? [],
      required_links: required,
      related: fm.related,
      updated_at: fm.updated_at,
      next_pages: [],
      previous_pages: [],
      canonical: page.url,
      redirect_from: [],
      outgoing_links: [],
      incoming_links: [],
      click_depth: 999,
    };
  }

  // Parse links from page bodies
  const allKnownPaths = new Set(Object.keys(nodes));
  for (const p of STATIC_PUBLIC_PATHS) allKnownPaths.add(p);

  for (const page of store.pages) {
    const node = nodes[page.url];
    if (!node) continue;

    const rendered = renderMarkdown(page.body, { knownPaths: allKnownPaths, isAlwaysValid: () => true });
    for (const link of rendered.links) {
      if (link.internal && !link.sponsored) {
        const cleanHref = link.href.split('#')[0].split('?')[0];
        node.outgoing_links.push({
          url: cleanHref,
          anchor: link.text,
          contextual: !link.inUrgent,
        });

        const targetNode = nodes[cleanHref];
        if (targetNode) {
          targetNode.incoming_links.push({
            url: page.url,
            anchor: link.text,
          });
        }
      }
    }
  }

  // BFS click depth from homepage '/'
  const queue: Array<{ url: string; depth: number }> = [{ url: '/', depth: 0 }];
  const visited = new Set<string>(['/']);

  // Homepage and site chrome (header/footer) links
  const homeLinks = [
    '/symptoms/',
    '/perimenopause/',
    '/menopause/',
    '/postmenopause/',
    '/treatments/',
    '/does-it-work/',
    '/tools/',
    '/urgent-help/',
    '/about/',
    '/about/how-we-make-money/',
    '/evidence/',
    '/evidence/how-we-grade/',
    '/evidence/updates/',
    '/privacy/',
    '/cookies/',
    '/terms/',
    '/medical-disclaimer/',
  ];
  for (const hl of homeLinks) {
    if (nodes[hl]) {
      nodes[hl].incoming_links.push({ url: '/', anchor: 'Home navigation' });
      queue.push({ url: hl, depth: 1 });
      visited.add(hl);
    }
  }

  while (queue.length > 0) {
    const { url, depth } = queue.shift()!;
    const node = nodes[url];
    if (node) {
      node.click_depth = Math.min(node.click_depth, depth);
      for (const edge of node.outgoing_links) {
        if (!visited.has(edge.url) && nodes[edge.url]) {
          visited.add(edge.url);
          queue.push({ url: edge.url, depth: depth + 1 });
        }
      }
    }
  }

  return {
    generated_at: new Date().toISOString(),
    total_pages: Object.keys(nodes).length,
    nodes,
  };
}

export function writeSiteGraph(repoRoot: string = process.cwd()): string {
  const graph = buildSiteGraph(repoRoot);
  const outPath = path.join(repoRoot, 'content', '_plan', 'site-graph.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(graph, null, 2), 'utf8');
  return outPath;
}
