import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import { visit, SKIP } from 'unist-util-visit';
import { toString as hastToString } from 'hast-util-to-string';
import type { Root as MdRoot, Text as MdText, PhrasingContent } from 'mdast';
import type { Root as HRoot, Element } from 'hast';

/**
 * Markdown → HTML on the server. No raw HTML is allowed in content
 * (remark-rehype drops it), so pages cannot smuggle in scripts or tracking.
 *
 * Content conventions:
 *  - Citations: `[@source-id]` → numbered superscript linking to #ref-N.
 *  - Urgent sections: `:::urgent` … `:::` → <aside data-urgent>. Commercial
 *    content is banned inside (validate:cta).
 *  - Doctor questions: `:::questions` … `:::` → a list with copy and print controls.
 *  - Tools: `::tool{id="symptoms-checklist"}` → an interactive island rendered in place.
 *  - Internal links to pages that aren't in this build (drafts) render as
 *    plain text, so published pages never link to drafts.
 *  - /go/ links get rel="sponsored nofollow". Other external links are followed.
 */

export interface RenderOptions {
  /** Site paths that exist in this build (with trailing slash). */
  knownPaths: Set<string>;
  /** Code-defined routes that are always valid link targets (for example /tools/). */
  staticPaths?: Set<string>;
  /** Extra rule for always-valid targets (for example anything under /app/). */
  isAlwaysValid?: (path: string) => boolean;
}

export interface LinkRecord {
  href: string;
  text: string;
  internal: boolean;
  sponsored: boolean;
  inUrgent: boolean;
  /** Internal link dropped because the target isn't in this build. */
  dropped: boolean;
}

export interface RenderResult {
  html: string;
  headings: Array<{ depth: 2 | 3; id: string; text: string }>;
  /** Source IDs in order of first citation. */
  citations: string[];
  links: LinkRecord[];
  hasH1: boolean;
  urgentSections: number;
  questionLists: number;
  /** Plain text of the body, for search and phrase checks. */
  text: string;
}

/** Interactive tools that content pages may embed with ::tool{id="..."}. */
export const TOOL_ISLAND_IDS = ['symptoms-checklist'];

/** Splits rendered HTML around tool placeholders so a page can render the islands in place. */
export function splitToolIslands(html: string): Array<{ html: string } | { tool: string }> {
  const parts: Array<{ html: string } | { tool: string }> = [];
  let last = 0;
  for (const m of html.matchAll(/<div data-tool="([a-z0-9-]+)"><\/div>/g)) {
    if (m.index! > last) parts.push({ html: html.slice(last, m.index) });
    parts.push({ tool: m[1] });
    last = m.index! + m[0].length;
  }
  if (last < html.length) parts.push({ html: html.slice(last) });
  return parts;
}

const CITE_RE = /\[@([a-z0-9]+(?:-[a-z0-9]+)*)\]/g;

function remarkCitations(citations: string[]) {
  return () => (tree: MdRoot) => {
    visit(tree, 'text', (node: MdText, index, parent) => {
      if (!parent || index === undefined || !CITE_RE.test(node.value)) return;
      CITE_RE.lastIndex = 0;
      const out: PhrasingContent[] = [];
      let last = 0;
      for (const m of node.value.matchAll(CITE_RE)) {
        const id = m[1];
        if (!citations.includes(id)) citations.push(id);
        const n = citations.indexOf(id) + 1;
        if (m.index! > last) out.push({ type: 'text', value: node.value.slice(last, m.index) });
        out.push({
          type: 'link',
          url: `#ref-${n}`,
          data: { hProperties: { className: ['cite'], 'data-source': id, 'aria-label': `Reference ${n}` } },
          children: [{ type: 'text', value: `[${n}]` }],
        } as PhrasingContent);
        last = m.index! + m[0].length;
      }
      if (last < node.value.length) out.push({ type: 'text', value: node.value.slice(last) });
      parent.children.splice(index, 1, ...out);
      return [SKIP, index + out.length];
    });
  };
}

function remarkDirectivesToHtml() {
  return (tree: MdRoot) => {
    visit(tree, (node, index, parent) => {
      if (node.type === 'textDirective' && parent && index !== undefined) {
        // Prose like "ratio 1:example" is parsed as a text directive; put the original text back.
        const d = node as unknown as { name: string; children?: Array<{ value?: string }> };
        const inner = (d.children ?? []).map((c) => c.value ?? '').join('');
        (parent.children as unknown[]).splice(index, 1, { type: 'text', value: `:${d.name}${inner ? `[${inner}]` : ''}` });
        return;
      }
      if (node.type === 'leafDirective') {
        // ::tool{id="symptoms-checklist"} marks where an interactive tool island goes.
        const d = node as unknown as { name: string; attributes?: Record<string, string>; data?: Record<string, unknown> };
        if (d.name !== 'tool') throw new Error(`Unknown content directive "::${d.name}" (allowed: ::tool)`);
        const id = d.attributes?.id ?? '';
        if (!TOOL_ISLAND_IDS.includes(id)) throw new Error(`Unknown tool "${id}" (allowed: ${TOOL_ISLAND_IDS.join(', ')})`);
        const data = (d.data ??= {});
        data.hName = 'div';
        data.hProperties = { 'data-tool': id };
        return;
      }
      if (node.type !== 'containerDirective') return;
      const d = node as unknown as { name: string; data?: Record<string, unknown> };
      const data = (d.data ??= {});
      if (d.name === 'urgent') {
        data.hName = 'aside';
        data.hProperties = { className: ['urgent'], 'data-urgent': 'true', role: 'note', 'aria-label': 'Urgent: when to get help now' };
      } else if (d.name === 'questions') {
        data.hName = 'div';
        data.hProperties = { className: ['doctor-questions'], 'data-questions': 'true' };
      } else if (d.name === 'note') {
        data.hName = 'aside';
        data.hProperties = { className: ['note'] };
      } else {
        throw new Error(`Unknown content directive ":::${d.name}" (allowed: urgent, questions, note)`);
      }
    });
  };
}

function rehypeLinksAndCollect(opts: RenderOptions, result: Omit<RenderResult, 'html' | 'text' | 'citations'>) {
  return () => (tree: HRoot) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName === 'h1') result.hasH1 = true;
      if ((node.tagName === 'h2' || node.tagName === 'h3') && typeof node.properties?.id === 'string') {
        result.headings.push({ depth: node.tagName === 'h2' ? 2 : 3, id: node.properties.id, text: hastToString(node) });
      }
      if (isFlag(node, 'urgent')) result.urgentSections++;
      if (isFlag(node, 'questions')) result.questionLists++;

      if (node.tagName !== 'a' || typeof node.properties?.href !== 'string') return;
      const href = node.properties.href;
      if (href.startsWith('#')) return;

      const inUrgent = hasUrgentAncestor(tree, node);
      const text = hastToString(node);
      const sponsored = href.startsWith('/go/');
      const internal = href.startsWith('/') && !sponsored;

      if (sponsored) {
        node.properties.rel = ['sponsored', 'nofollow'];
        result.links.push({ href, text, internal: false, sponsored: true, inUrgent, dropped: false });
        return;
      }
      if (internal) {
        const pathOnly = href.split('#')[0].split('?')[0];
        const exists = opts.knownPaths.has(pathOnly) || opts.staticPaths?.has(pathOnly) || opts.isAlwaysValid?.(pathOnly);
        result.links.push({ href, text, internal: true, sponsored: false, inUrgent, dropped: !exists });
        if (!exists && parent && index !== undefined) {
          // Rule: never link a published page to a draft or missing page. Keep the words.
          parent.children.splice(index, 1, ...node.children);
          return [SKIP, index];
        }
        return;
      }
      result.links.push({ href, text, internal: false, sponsored: false, inUrgent, dropped: false });
    });
  };
}

/** hast may keep data attributes as `data-x` or camelCase `dataX`, depending on the source. */
function isFlag(node: Element, name: 'urgent' | 'questions'): boolean {
  const props = node.properties ?? {};
  const camel = `data${name[0].toUpperCase()}${name.slice(1)}`;
  return props[`data-${name}`] === 'true' || props[camel] === 'true' || props[camel] === true;
}

function hasUrgentAncestor(tree: HRoot, target: Element): boolean {
  let found = false;
  visit(tree, 'element', (node: Element) => {
    if (found || !isFlag(node, 'urgent')) return;
    visit(node, 'element', (child: Element) => {
      if (child === target) found = true;
    });
  });
  return found;
}

export function renderMarkdown(markdown: string, opts: RenderOptions): RenderResult {
  const citations: string[] = [];
  const partial = { headings: [], links: [], hasH1: false, urgentSections: 0, questionLists: 0 } as Omit<
    RenderResult,
    'html' | 'text' | 'citations'
  >;

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkDirectivesToHtml)
    .use(remarkCitations(citations))
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeLinksAndCollect(opts, partial))
    .use(rehypeStringify);

  const html = String(processor.processSync(markdown));
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  return { ...partial, html, text, citations };
}
