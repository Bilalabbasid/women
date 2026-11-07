import { OFFLINE_APP_SHELL } from '@/lib/routes';
import { SAVED_CACHE } from '@/lib/saved-pages';

export const dynamic = 'force-static';

/**
 * Service worker, generated at build time so its cache names change with
 * every build. On activation the previous build's caches are deleted, so after
 * a deploy no old canonicals, noindex states, redirects or medical text can be
 * served once the reader is back online.
 *
 * Strategy (AGENTS.md "PWA"):
 *  - HTML navigations: network-first. Only clean 200 responses are cached
 *    (never redirects, errors or 404s). Offline, a saved copy is served with
 *    <html data-sw-cached-at> so the page can warn it may be out of date.
 *  - /_next/static/: cache-first (content-hashed, immutable).
 *  - Other same-origin GETs: stale-while-revalidate, 200s only.
 *  - /app/* (the tracker): precached with its scripts at install; network-first,
 *    falling back to the cached screen offline.
 *  - /api/, /go/, /og/, /pin/: never touched (form submissions are POSTs and are never cached).
 *  - The service worker never reads or stores tracker data (that lives in IndexedDB).
 */
const VERSION = process.env.BUILD_VERSION ?? new Date().toISOString().replace(/[^0-9]/g, '');

const SW_SOURCE = `/* generated at build: ${VERSION} */
const VERSION = ${JSON.stringify(VERSION)};
const PAGE_CACHE = 'pages-' + VERSION;
const STATIC_CACHE = 'static-' + VERSION;
const APP_CACHE = 'app-' + VERSION;
// Pages she pressed "Save for later" on (src/lib/saved-pages.ts). Kept across builds until she removes them.
const SAVED_CACHE = ${JSON.stringify(SAVED_CACHE)};
const MAX_PAGES = 60;
const OFFLINE_URL = '/offline/';
const PRECACHE = [OFFLINE_URL, '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
// The tracker's screens. Precached with the scripts and styles each one needs, so the
// installed app opens and works offline even for screens not visited yet.
const APP_SHELL = ${JSON.stringify(OFFLINE_APP_SHELL)};

async function precacheAppShell() {
  const appCache = await caches.open(APP_CACHE);
  const staticCache = await caches.open(STATIC_CACHE);
  const assets = new Set();
  // The offline page is scanned too, so its own scripts load when it is shown offline.
  for (const path of [...APP_SHELL, OFFLINE_URL]) {
    try {
      const res = await fetch(path, { credentials: 'same-origin' });
      if (!cacheable(res)) continue;
      const html = await res.clone().text();
      await appCache.put(path, res);
      for (const m of html.matchAll(/\\/_next\\/static\\/[^"'\\s)]+/g)) assets.add(m[0]);
    } catch (e) {
      // Offline during install: the screen is cached later, on first visit.
    }
  }
  await Promise.all([...assets].map((a) => staticCache.add(a).catch(() => {})));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => precacheAppShell())
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== PAGE_CACHE && k !== STATIC_CACHE && k !== APP_CACHE && k !== SAVED_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function cacheable(res) {
  return res && res.status === 200 && res.type === 'basic' && !res.redirected;
}

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_PAGES; i++) await cache.delete(keys[i]);
}

async function storePage(request, response) {
  const body = await response.clone().arrayBuffer();
  const headers = new Headers(response.headers);
  headers.set('x-sw-cached-at', new Date().toISOString());
  const cache = await caches.open(PAGE_CACHE);
  await cache.put(request, new Response(body, { status: 200, statusText: 'OK', headers }));
  await trim(cache);
}

async function markSaved(cached) {
  const savedAt = cached.headers.get('x-sw-cached-at') || '';
  const html = await cached.text();
  const marked = html.replace(/<html(\\s|>)/i, '<html data-sw-cached-at="' + savedAt + '"$1');
  return new Response(marked, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

/**
 * A page that isn't saved. Redirect to the offline page rather than serving its HTML
 * under this address: the page's scripts would hydrate against the wrong route.
 */
async function offlineFallback(request) {
  if (new URL(request.url).pathname === OFFLINE_URL) {
    const offline = await caches.match(OFFLINE_URL, { cacheName: STATIC_CACHE });
    return offline || Response.error();
  }
  return Response.redirect(new URL(OFFLINE_URL, self.location.origin).href, 302);
}

/** Tracker screens: network-first, falling back to the precached app shell (no "may be out of date" marker: the data is local). */
async function networkFirstApp(request) {
  const url = new URL(request.url);
  try {
    const res = await fetch(request);
    if (cacheable(res)) {
      const copy = res.clone();
      caches.open(APP_CACHE).then((c) => c.put(url.pathname, copy));
    }
    return res;
  } catch (err) {
    const cached = await caches.match(url.pathname, { cacheName: APP_CACHE });
    if (cached) return cached;
    return offlineFallback(request);
  }
}

async function networkFirstPage(request) {
  try {
    const res = await fetch(request);
    if (cacheable(res)) storePage(request, res).catch(() => {});
    return res;
  } catch (err) {
    const cached =
      (await caches.match(request, { cacheName: PAGE_CACHE })) ||
      (await caches.match(request, { cacheName: SAVED_CACHE }));
    if (cached) return markSaved(cached);
    return offlineFallback(request);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { cacheName: STATIC_CACHE });
  if (cached) return cached;
  const res = await fetch(request);
  if (cacheable(res)) {
    const copy = res.clone();
    caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
  }
  return res;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (cacheable(res)) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never touched: form submissions and other API calls, redirects, the worker itself, social images.
  if (/^\\/(api|go|og|pin)\\//.test(url.pathname) || url.pathname === '/sw.js') return;

  if (request.mode === 'navigate' && url.pathname.startsWith('/app/')) {
    event.respondWith(networkFirstApp(request));
  } else if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
  } else if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Treatment reminder notifications (generated on the device; no push server).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/app/treatments/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (new URL(client.url).pathname === target && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
    })
  );
});
`;

export function GET() {
  return new Response(SW_SOURCE, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}

/** Exposed for tests. */
export const __SW_SOURCE_FOR_TESTS = SW_SOURCE;
