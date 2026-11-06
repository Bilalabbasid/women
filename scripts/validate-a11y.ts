/**
 * npm run validate:a11y   (run after `npm run build`)
 *
 * Runs axe-core (WCAG 2.0/2.1/2.2 A and AA rules) against every prerendered
 * page in jsdom. jsdom has no layout engine, so colour contrast and target size
 * can't be computed here: those are covered by the Lighthouse run in CI
 * and by manual spot checks. Serious and critical violations fail the check.
 *
 * Tracker pages are client-rendered after load, so only their server shell is
 * checked here. Lighthouse covers the hydrated screens.
 */
import fs from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { builtPages } from './lib/built-pages';
import { Report } from './lib/report';

const r = new Report('validate:a11y');
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const pages = builtPages();
if (pages.length === 0) {
  r.error('.next', 'no prerendered pages found: run `npm run build` first');
  r.finish();
  process.exit();
}

async function main() {
  for (const page of pages) {
    // Silence jsdom's "canvas not implemented" noise from axe's icon checks.
    const virtualConsole = new VirtualConsole();
    const dom = new JSDOM(page.html, { runScripts: 'outside-only', pretendToBeVisual: true, url: `http://localhost${page.path}`, virtualConsole });
    dom.window.eval(axeSource);
    const axe = (dom.window as unknown as { axe: { run: (ctx: unknown, opts: unknown) => Promise<{ violations: Array<{ id: string; impact: string; help: string; nodes: unknown[] }> }> } }).axe;
    const result = await axe.run(dom.window.document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
      rules: { 'color-contrast': { enabled: false }, 'target-size': { enabled: false }, region: { enabled: false } },
    });
    for (const v of result.violations) {
      const msg = `${v.id} (${v.impact}): ${v.help} [${v.nodes.length} element(s)]`;
      if (v.impact === 'serious' || v.impact === 'critical') r.error(page.path, msg);
      else r.warn(page.path, msg);
    }
    dom.window.close();
  }
  r.note(`axe-core on ${pages.length} prerendered page(s); contrast and target size are checked by Lighthouse`);
  r.finish();
}

main();
