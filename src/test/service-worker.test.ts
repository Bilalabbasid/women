/** @vitest-environment node */
import { describe, it, expect, beforeEach } from 'vitest';
import vm from 'node:vm';
import { __SW_SOURCE_FOR_TESTS as SW } from '@/app/sw.js/route';

/** Minimal Cache Storage fake, keyed by URL. */
class FakeCache {
  store = new Map<string, Response>();
  async match(req: Request | string) {
    const r = this.store.get(typeof req === 'string' ? new URL(req, 'https://site.test').href : req.url);
    return r ? r.clone() : undefined;
  }
  async put(req: Request | string, res: Response) {
    this.store.set(typeof req === 'string' ? new URL(req, 'https://site.test').href : req.url, res);
  }
  async add(url: string) {
    await this.put(url, new Response(`cached ${url}`, { status: 200 }));
  }
  async addAll(urls: string[]) {
    for (const u of urls) await this.put(u, new Response(`precached ${u}`, { status: 200 }));
  }
  async keys() {
    return [...this.store.keys()].map((k) => new Request(k));
  }
  async delete(req: Request) {
    return this.store.delete(req.url);
  }
}

function makeSw(network: (req: Request | string) => Promise<Response>) {
  const named = new Map<string, FakeCache>();
  const caches = {
    async open(name: string) {
      if (!named.has(name)) named.set(name, new FakeCache());
      return named.get(name)!;
    },
    async keys() {
      return [...named.keys()];
    },
    async delete(name: string) {
      return named.delete(name);
    },
    async match(req: Request | string, opts?: { cacheName?: string }) {
      const list = opts?.cacheName ? [named.get(opts.cacheName)].filter(Boolean) : [...named.values()];
      for (const c of list) {
        const hit = await c!.match(req);
        if (hit) return hit;
      }
      return undefined;
    },
  };
  const listeners: Record<string, (e: unknown) => void> = {};
  const self = {
    location: { origin: 'https://site.test' },
    addEventListener: (t: string, fn: (e: unknown) => void) => (listeners[t] = fn),
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };
  vm.runInNewContext(SW, { self, caches, fetch: network, Response, Request, Headers, URL, Promise, console });

  const run = async (type: string, extra: Record<string, unknown> = {}) => {
    let pending: Promise<unknown> = Promise.resolve();
    let responded: Promise<Response> | undefined;
    listeners[type]({ ...extra, waitUntil: (p: Promise<unknown>) => (pending = p), respondWith: (p: Promise<Response>) => (responded = p) });
    await pending;
    return responded;
  };
  const navigate = async (path: string) => {
    const request = new Request(`https://site.test${path}`);
    Object.defineProperty(request, 'mode', { value: 'navigate' });
    const res = await run('fetch', { request });
    await new Promise((r) => setTimeout(r, 5)); // let background cache writes finish
    return res!;
  };
  return { named, run, navigate };
}

describe('service worker', () => {
  let online = true;
  let responses: Record<string, () => Response>;
  const net = async (req: Request | string) => {
    if (!online) throw new TypeError('offline');
    const make = responses[new URL(typeof req === 'string' ? req : req.url, 'https://site.test').pathname];
    const res = make ? make() : new Response('not found', { status: 404 });
    // Real same-origin fetches have type "basic"; constructed Responses are "default".
    Object.defineProperty(res, 'type', { value: 'basic' });
    return res;
  };

  beforeEach(() => {
    online = true;
    responses = {
      '/symptoms/hot-flashes/': () => new Response('<html lang="en-US"><body>fresh</body></html>', { status: 200 }),
    };
  });

  it('serves pages network-first and caches only clean 200s', async () => {
    const sw = makeSw(net);
    await sw.run('install');
    const res = await sw.navigate('/symptoms/hot-flashes/');
    expect(await res.text()).toContain('fresh');
    await sw.navigate('/missing/');
    const pages = [...sw.named.entries()].find(([k]) => k.startsWith('pages-'))![1];
    expect([...pages.store.keys()]).toEqual(['https://site.test/symptoms/hot-flashes/']);
  });

  it('never caches redirected responses', async () => {
    responses['/old/'] = () => {
      const r = new Response('<html><body>moved</body></html>', { status: 200 });
      Object.defineProperty(r, 'redirected', { value: true });
      return r;
    };
    const sw = makeSw(net);
    await sw.run('install');
    await sw.navigate('/old/');
    const pages = [...sw.named.entries()].find(([k]) => k.startsWith('pages-'));
    expect(pages ? pages[1].store.size : 0).toBe(0);
  });

  it('offline, serves the saved copy marked with when it was saved', async () => {
    const sw = makeSw(net);
    await sw.run('install');
    await sw.navigate('/symptoms/hot-flashes/');
    online = false;
    const html = await (await sw.navigate('/symptoms/hot-flashes/')).text();
    expect(html).toMatch(/<html data-sw-cached-at="\d{4}-\d{2}-\d{2}T[^"]+" lang="en-US">/);
  });

  it('offline with no saved copy, redirects to the offline page, which is precached', async () => {
    const sw = makeSw(net);
    await sw.run('install');
    online = false;
    const res = await sw.navigate('/never-visited/');
    expect(res.status).toBe(302);
    expect(new URL(res.headers.get('location') ?? '').pathname).toBe('/offline/');
    expect(await (await sw.navigate('/offline/')).text()).toContain('precached /offline/');
  });

  it('offline, opens a tracker screen precached at install', async () => {
    responses['/app/insights/'] = () =>
      new Response('<html><script src="/_next/static/chunks/app.js"></script>/app/insights/</html>', { status: 200 });
    responses['/_next/static/chunks/app.js'] = () => new Response('/* chunk */', { status: 200 });
    const sw = makeSw(net);
    await sw.run('install');
    online = false;
    expect(await (await sw.navigate('/app/insights/')).text()).toContain('/app/insights/');
  });

  it('deletes caches from previous builds on activate', async () => {
    const sw = makeSw(net);
    await sw.run('install');
    (await (sw as unknown as { named: Map<string, FakeCache> }).named).set('pages-OLD', new FakeCache());
    await sw.run('activate');
    expect([...sw.named.keys()].some((k) => k.endsWith('OLD'))).toBe(false);
  });
});
