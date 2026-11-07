// Captures manifest screenshots via the Chrome DevTools Protocol (no extra deps).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [, , base, outDir] = process.argv;
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-shots-'));
const port = 9333;
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    target = list.find((t) => t.type === 'page');
  } catch {}
}
if (!target) throw new Error('chrome did not start');

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result)));
    ws.send(JSON.stringify({ id: n, method, params }));
  });

await send('Page.enable');
await send('Page.navigate', { url: base + '/' });
await sleep(2500);
// A stored storage choice, so the choice banner doesn't cover the screenshot.
await send('Runtime.evaluate', { expression: "localStorage.setItem('menoverdict_storage_consent','essential')" });

const shots = [
  { url: '/app/today/', file: 'today-mobile.png', w: 390, h: 844, mobile: true },
  { url: '/app/doctor-report/', file: 'report-mobile.png', w: 390, h: 844, mobile: true },
  { url: '/app/today/', file: 'today-desktop.png', w: 1280, h: 800, mobile: false },
];
for (const s of shots) {
  await send('Emulation.setDeviceMetricsOverride', { width: s.w, height: s.h, deviceScaleFactor: 1, mobile: s.mobile });
  await send('Page.navigate', { url: base + s.url });
  await sleep(4000);
  const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: s.w, height: s.h, scale: 1 } });
  fs.writeFileSync(path.join(outDir, s.file), Buffer.from(data, 'base64'));
  console.log('saved', s.file);
}
ws.close();
proc.kill();
