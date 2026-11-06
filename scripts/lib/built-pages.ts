import fs from 'node:fs';
import path from 'node:path';

/** Prerendered HTML from `next build`, mapped to site paths (trailing slash). */
export function builtPages(root = process.cwd()): Array<{ file: string; path: string; html: string }> {
  const base = path.join(root, '.next', 'server', 'app');
  const out: Array<{ file: string; path: string; html: string }> = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html') && !e.name.startsWith('_')) {
        const relPath = path.relative(base, p).replace(/\\/g, '/').replace(/\.html$/, '');
        const sitePath = relPath === 'index' ? '/' : `/${relPath.replace(/\/index$/, '')}/`;
        out.push({ file: path.relative(root, p).replace(/\\/g, '/'), path: sitePath, html: fs.readFileSync(p, 'utf8') });
      }
    }
  };
  walk(base);
  return out.sort((a, b) => a.path.localeCompare(b.path));
}
