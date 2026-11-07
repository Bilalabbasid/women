import type { Metadata } from 'next';
import { getSiteData } from '@/lib/content/site-data';
import { ChooseCards, CompareTable, extractChoices, extractTable } from '@/components/site/compare-cards';

export const metadata: Metadata = {
  title: 'Comparison components (preview)',
  robots: { index: false, follow: false },
};

/** Dev-only preview of the comparison components with real content. */
export default function ComparePreviewPage() {
  const { byUrl } = getSiteData();
  const pages = ['/compare/midi-vs-alloy/', '/compare/midi-vs-evernow/', '/compare/alloy-vs-evernow/'];
  const index = byUrl.get('/compare/');
  const table = index ? extractTable(index.body) : null;
  return (
    <main id="main" className="wrap py-10">
      <p className="kicker">Dev preview</p>
      <h1 className="text-[length:var(--fs-h1)]">Comparison components</h1>
      {pages.map((url) => {
        const p = byUrl.get(url);
        if (!p) return null;
        return (
          <section key={url} className="mt-10">
            <h2 className="text-[length:var(--fs-h3)]">{p.fm.title}</h2>
            <ChooseCards choices={extractChoices(p.body)} />
          </section>
        );
      })}
      {table && (
        <section className="mt-10">
          <h2 className="text-[length:var(--fs-h3)]">/compare/ table</h2>
          <CompareTable table={table} caption="Online menopause care, side by side" />
        </section>
      )}
    </main>
  );
}
