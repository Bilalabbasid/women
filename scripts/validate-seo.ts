/**
 * npm run validate:seo   (run after `npm run build`)
 *
 * Reads the prerendered HTML, which is exactly what a crawler gets without
 * JavaScript, and checks:
 *  - public pages: one <h1>, a <title>, a meta description, an absolute
 *    canonical with a trailing slash, and JSON-LD that parses
 *  - no duplicate titles, descriptions or canonicals across public pages
 *  - no Review / AggregateRating / Product schema anywhere
 *  - the private tracker (/app/) and /search/ are noindex
 *  - production builds (getSiteEnv() === "production") are indexable; other builds are noindex
 *  - title and description lengths (warnings: about 60 and 155 characters)
 */
import { builtPages } from './lib/built-pages';
import { getSiteEnv } from '../src/lib/site/config';
import { Report } from './lib/report';
import fs from 'node:fs';
import path from 'node:path';
import { getContent } from '../src/lib/content/loader';

const r = new Report('validate:seo');
const pages = builtPages();
if (pages.length === 0) {
  r.error('.next', 'no prerendered pages found: run `npm run build` first');
  r.finish();
  process.exit();
}

// Same rule as the site itself (src/lib/site/config.ts), so the two can never disagree.
const prod = getSiteEnv() === 'production';
// Pages whose frontmatter sets noindex: true. They stay live and linked but out of search and the sitemap.
const intentionallyNoindex = new Set(getContent().pages.filter((pg) => pg.fm.noindex).map((pg) => pg.url));
const sitemapFile = path.join(process.cwd(), '.next', 'server', 'app', 'sitemap.xml.body');
const sitemapXml = fs.existsSync(sitemapFile) ? fs.readFileSync(sitemapFile, 'utf8') : '';
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
const attr = (html: string, re: RegExp) => {
  const m = re.exec(html);
  return m ? decode(m[1]) : null;
};

const seen = { title: new Map<string, string>(), desc: new Map<string, string>(), canon: new Map<string, string>() };
const isPrivate = (p: string) => p.startsWith('/app/') || p === '/app/' || p === '/offline/' || p === '/search/';

for (const { path: p, html, file } of pages) {
  const robots = attr(html, /<meta name="robots" content="([^"]+)"/) ?? '';
  const noindex = /noindex/.test(robots);

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const json = JSON.stringify(JSON.parse(m[1]));
      if (/"@type":"(Review|AggregateRating|Rating|Product)"|"aggregateRating"|"review"/.test(json)) {
        r.error(p, 'banned review/rating schema');
      }
    } catch {
      r.error(p, 'JSON-LD does not parse');
    }
  }

  if (isPrivate(p)) {
    if (!noindex) r.error(p, 'private or utility page must be noindex');
    continue;
  }

  // A page may opt out of search on purpose (frontmatter noindex: true), e.g. single-brand
  // reviews without first-hand evidence. Anything else noindexed in production is a mistake.
  if (prod && noindex && !intentionallyNoindex.has(p)) r.error(p, 'public page is noindex in a production build');
  if (intentionallyNoindex.has(p) && sitemapXml.includes(p)) r.error(p, 'noindex page is listed in the sitemap');
  if (!prod && !noindex) r.error(p, 'non-production build must be noindex');

  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) r.error(p, `${h1s} <h1> elements (need exactly 1)`);

  const title = attr(html, /<title>([^<]*)<\/title>/);
  const desc = attr(html, /<meta name="description" content="([^"]*)"/);
  const canon = attr(html, /<link rel="canonical" href="([^"]*)"/);
  if (!title) r.error(p, 'missing <title>');
  if (!desc) r.error(p, 'missing meta description');
  if (!canon) r.error(p, 'missing canonical');
  else {
    if (!/^https?:\/\//.test(canon)) r.error(p, `canonical is not absolute: ${canon}`);
    if (!canon.endsWith('/')) r.error(p, `canonical lacks the trailing slash: ${canon}`);
    if (prod && !canon.startsWith('https://')) r.error(p, `production canonical must be https: ${canon}`);
    if (new URL(canon).pathname !== p) r.error(p, `canonical ${canon} does not match the page path`);
  }
  if (!/<script type="application\/ld\+json">/.test(html)) r.warn(p, 'no JSON-LD');
  if (!/property="og:title"/.test(html)) r.error(p, 'missing Open Graph tags');

  if (title && title.length > 65) r.warn(p, `title is ${title.length} characters (aim for 60 or fewer)`);
  if (desc && desc.length > 160) r.warn(p, `meta description is ${desc.length} characters (aim for 155 or fewer)`);

  for (const [k, v] of [['title', title], ['desc', desc], ['canon', canon]] as const) {
    if (!v) continue;
    const prev = seen[k].get(v);
    if (prev) r.error(p, `duplicate ${k === 'desc' ? 'meta description' : k} (also on ${prev})`);
    else seen[k].set(v, p);
  }
  void file;
}

r.note(`checked ${pages.length} prerendered page(s) as a ${prod ? 'production' : 'non-production'} build`);
r.finish();
