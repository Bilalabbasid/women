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
  'src/components/site/search-engine.ts': "GET /search-index.json (static file; the query is never sent)",
  'src/app/sw.js/route.ts': 'service worker re-fetches same-origin pages and assets; never reads IndexedDB',
  'src/components/site/email-capture.tsx':
    'POST /api/subscribe: the email address the visitor typed, the form type, the consent value, the contact message (contact form only), the empty honeypot field and the time since the form appeared; nothing else',
  'src/app/api/subscribe/route.ts':
    'POST to Resend: one notification email to the site owner with the submitted email, form type, consent, timestamp and contact message; the IP is only hashed in memory for the rate limit and never sent',
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
const EXTERNAL_RES = /<(script|link|img|iframe|source|video|audio|embed|object)\b[^>]*\b(src|href|data|srcset)="(https?:)?\/\/(?!localhost)[^"]+"/gi;
const EXTERNAL_CSS = /(@import\s+(url\()?["']?(https?:)?\/\/|url\(\s*["']?(https?:)?\/\/)/i;
// Known tracker and analytics snippets. Domain-style patterns, so ordinary prose
// ("biologically plausible", "clarity") never trips them.
const TRACKER_SNIPPETS = [
  /gtag\(/,
  /googletagmanager/i,
  /google-analytics\.com/i,
  /\bfbq\(/,
  /connect\.facebook\.net/i,
  /pintrk\(/,
  /\bttq\.(load|page|track)/,
  /plausible\.io/i,
  /umami\.is|data-website-id=/i,
  /clarity\.ms/i,
  /hotjar/i,
  /vercel-insights|\/_vercel\/insights/i,
];
for (const f of htmlFiles) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(EXTERNAL_RES)) {
    // <link rel="canonical"> / alternate point at our own canonical origin and load nothing.
    if (/rel="(canonical|alternate)"/.test(m[0])) continue;
    r.error(rel(f), `loads a third-party resource: ${m[0].slice(0, 120)}`);
  }
  for (const style of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    if (EXTERNAL_CSS.test(style[1])) r.error(rel(f), 'inline CSS loads a third-party resource (@import or url())');
  }
  for (const re of TRACKER_SNIPPETS) {
    if (re.test(html)) r.error(rel(f), `contains a tracker snippet matching ${re}`);
  }
}

// Built CSS bundles: no third-party fonts or images.
for (const f of walk(path.join(root, '.next', 'static'), /\.css$/)) {
  if (EXTERNAL_CSS.test(fs.readFileSync(f, 'utf8'))) r.error(rel(f), 'stylesheet loads a third-party resource (@import or url())');
}

// API routes must not log anything: no form data, IPs, user agents or referrers.
for (const f of walk(path.join(root, 'src', 'app', 'api'), /\.tsx?$/)) {
  if (/\bconsole\.(log|info|warn|error|debug)\(/.test(fs.readFileSync(f, 'utf8'))) {
    r.error(rel(f), 'API routes must not log (form submissions, IPs, user agents and referrers are never recorded)');
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
