/**
 * npm run validate:privacy
 *
 * Rule 9: health inputs stay on the device. This check fails when:
 *  - source code uses a network API (fetch, XMLHttpRequest, sendBeacon, WebSocket,
 *    EventSource) outside the reviewed allow-list
 *  - a third-party analytics, ads, session-replay or error SDK is a dependency
 *  - built HTML loads any script, stylesheet, image, font or frame from another origin
 *  - server code (API routes, route handlers) imports the local health database
 *  - the production CSP stops restricting connect-src/script-src to 'self'
 * It also prints an inventory of browser storage keys and network calls for the privacy page.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Report } from './lib/report';

const r = new Report('validate:privacy');
const root = process.cwd();
const rel = (f: string) => path.relative(root, f).replace(/\\/g, '/');

function walk(dir: string, re: RegExp): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' || e.name === 'test' ? [] : walk(p, re);
    return re.test(e.name) ? [p] : [];
  });
}

// 1. Network APIs in source. Each allowed call is reviewed: what is sent, and why it holds no health data.
const NETWORK = /\b(fetch\s*\(|XMLHttpRequest|sendBeacon|new WebSocket|new EventSource|navigator\.share\s*\()/;
const ALLOWED: Record<string, string> = {
  'src/components/site/search-box.tsx': "GET /search-index.json (static file; the query is never sent)",
  'src/app/sw.js/route.ts': 'service worker re-fetches same-origin pages and assets; never reads IndexedDB',
};
const sourceFiles = walk(path.join(root, 'src'), /\.(tsx?|jsx?)$/);
for (const f of sourceFiles) {
  const text = fs.readFileSync(f, 'utf8');
  if (!NETWORK.test(text)) continue;
  if (ALLOWED[rel(f)]) r.note(`network call (allowed): ${rel(f)}: ${ALLOWED[rel(f)]}`);
  else r.error(rel(f), 'uses a network API outside the reviewed allow-list (see scripts/validate-privacy.ts)');
}

// 2. Third-party SDKs.
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const deps = Object.keys({ ...pkg.dependencies });
const BANNED_SDK = /analytics|segment|mixpanel|amplitude|hotjar|fullstory|logrocket|sentry|datadog|posthog|gtag|google-tag|facebook|meta-pixel|tiktok|clarity|heap|intercom|hubspot|braze|onesignal/i;
for (const d of deps) if (BANNED_SDK.test(d)) r.error('package.json', `third-party tracking/telemetry dependency "${d}" needs legal review before use`);

// 3. Built HTML: no third-party resources.
const built = path.join(root, '.next', 'server', 'app');
const htmlFiles = walk(built, /\.html$/);
if (htmlFiles.length === 0) r.warn('.next', 'no build output found: run `npm run build` first to check built HTML');
const EXTERNAL_RES = /<(script|link|img|iframe|source|video|audio)\b[^>]*\b(src|href)="(https?:)?\/\/(?!localhost)[^"]+"/gi;
for (const f of htmlFiles) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(EXTERNAL_RES)) {
    // <link rel="canonical"> / alternate point at our own canonical origin and load nothing.
    if (/rel="(canonical|alternate)"/.test(m[0])) continue;
    r.error(rel(f), `loads a third-party resource: ${m[0].slice(0, 120)}`);
  }
}

// 4. Server code must not touch the health database.
const serverFiles = [
  ...walk(path.join(root, 'src', 'app', 'api'), /\.tsx?$/),
  ...walk(path.join(root, 'src', 'app'), /^route\.tsx?$/),
];
for (const f of serverFiles) {
  if (/from ['"](@\/lib\/db|.*\/lib\/db)/.test(fs.readFileSync(f, 'utf8'))) r.error(rel(f), 'server code imports the local health database');
}

// 5. CSP still restricts origins.
const cfg = fs.readFileSync(path.join(root, 'next.config.ts'), 'utf8');
if (!/"connect-src 'self'"/.test(cfg) || !/"script-src 'self'/.test(cfg)) {
  r.error('next.config.ts', "CSP must keep connect-src 'self' and script-src 'self' (no third-party origins)");
}

// Inventory for the privacy page.
const keys = new Set<string>();
for (const f of sourceFiles) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/localStorage\.(?:setItem|getItem)\(\s*['"`]([^'"`]+)/g)) keys.add(m[1]);
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/const KEY = ['"`]([^'"`]+)/g)) keys.add(m[1]);
}
r.note(`localStorage keys: ${[...keys].sort().join(', ') || 'none'}`);
r.note('IndexedDB database: menowell_local_db (tracker data, device only)');
r.note(`checked ${sourceFiles.length} source files, ${htmlFiles.length} built HTML files`);
r.finish();
