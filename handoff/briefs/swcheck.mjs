// Two-stage offline check with a persistent Chrome profile:
//   node swcheck.mjs <base> <dir> online   -> load the app, let the service worker precache
//   (stop the server)
//   node swcheck.mjs <base> <dir> offline  -> open screens never visited
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [, , base, outDir, stage] = process.argv;
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = path.resolve(outDir, 'sw-profile');
fs.mkdirSync(profile, { recursive: true });
const port = 9334;
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page');
  } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result)));
    ws.send(JSON.stringify({ id: n, method, params }));
  });
const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;

await send('Page.enable');
if (stage === 'online') {
  await send('Page.navigate', { url: base + '/app/today/' });
  await sleep(12000);
  const caches = await ev(
    '(async () => { const out = {}; for (const k of await caches.keys()) out[k] = (await (await caches.open(k)).keys()).length; return out; })()',
  );
  console.log(JSON.stringify(caches));
} else {
  for (const p of ['/app/insights/', '/app/check-in/', '/symptoms/hot-flashes/']) {
    await send('Page.navigate', { url: base + p });
    await sleep(3500);
    const info = await ev("({ path: location.pathname, title: document.title, h1: (document.querySelector('h1') || {}).textContent })");
    console.log(p, JSON.stringify(info));
  }
}
ws.close();
proc.kill();
