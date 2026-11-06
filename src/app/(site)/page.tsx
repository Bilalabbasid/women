import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/site/config';
import { APP_ROUTES } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { navHubs, getSiteData, CLUSTER_LABELS } from '@/lib/content/site-data';

export const metadata: Metadata = buildMetadata({
  title: `${SITE.name}: evidence-graded menopause information`,
  description:
    'Independent perimenopause and menopause information. Every claim graded and sourced, every commission disclosed, plus a private symptom tracker.',
  path: '/',
});

/**
 * Home. Copy states only what the site actually does today. The positioning
 * promises (grades, sources, disclosures) are enforced by the content build.
 */
export default function HomePage() {
  const hubs = navHubs();
  const { pages } = getSiteData();
  const recent = [...pages]
    .filter((p) => p.fm.page_type !== 'legal')
    .sort((a, b) => b.fm.updated_at.localeCompare(a.fm.updated_at))
    .slice(0, 6);

  return (
    <div className="space-y-14">
      <section className="max-w-3xl space-y-5 pt-4">
        <h1 className="text-3xl sm:text-4xl">Clear, honest answers about perimenopause and menopause</h1>
        <p className="text-xl text-[var(--color-ink-muted)]">
          We check the evidence so you can walk into your next appointment knowing what&apos;s known,
          what isn&apos;t, and what to ask.
        </p>
        <ul className="space-y-2">
          <li>
            <strong>Every claim graded.</strong> Each option gets an evidence grade, from &ldquo;strong&rdquo; to
            &ldquo;not supported&rdquo;, with the reasoning shown.
          </li>
          <li>
            <strong>Every source linked.</strong> References go to the original guideline, label or study.
          </li>
          <li>
            <strong>Every commission disclosed.</strong> If we can earn money from a link, the page says so
            before the link, and it never changes a grade.
          </li>
          <li>
            <strong>Reviewed before it goes live.</strong> Medical pages are published only after a named
            clinician has reviewed that exact version.
          </li>
        </ul>
      </section>

      {hubs.length > 0 && (
        <section aria-labelledby="start-here" className="space-y-3">
          <h2 id="start-here" className="text-2xl">
            Start here
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {hubs.map((h) => (
              <li key={h.href}>
                <Link
                  href={h.href}
                  className="tap block rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4 font-semibold text-[var(--color-link)] underline"
                >
                  {h.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="tools" className="space-y-3">
        <h2 id="tools" className="text-2xl">
          Free, private tools
        </h2>
        <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5 space-y-3">
          <h3 className="text-xl">Symptom tracker and doctor report</h3>
          <p>
            Log symptoms in under a minute, see your patterns over weeks, and print a one-page summary to
            take to your appointment. It works offline. No account needed.
          </p>
          <p className="text-[var(--color-ink-muted)]">
            Everything you enter stays in this browser on this device. We can&apos;t see it, and it isn&apos;t
            sent to us, to analytics or to advertisers.
          </p>
          <p className="flex flex-wrap gap-3">
            <Link
              href={APP_ROUTES.today}
              className="tap rounded-xl bg-[var(--color-accent)] px-5 font-semibold text-white no-underline"
            >
              Open the tracker
            </Link>
            <Link href="/tools/" className="tap px-2 font-semibold text-[var(--color-link)] underline">
              All tools
            </Link>
          </p>
        </div>
      </section>

      {recent.length > 0 && (
        <section aria-labelledby="latest" className="space-y-3">
          <h2 id="latest" className="text-2xl">
            Recently updated
          </h2>
          <ul className="space-y-1">
            {recent.map((p) => (
              <li key={p.url}>
                <Link href={p.url} className="tap text-[var(--color-link)] underline">
                  {p.fm.title}
                </Link>{' '}
                <span className="text-[var(--color-ink-muted)]">· {CLUSTER_LABELS[p.fm.cluster] ?? p.fm.cluster}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="urgent" className="rounded-xl border-2 border-[var(--color-urgent)] bg-[var(--color-urgent-soft)] p-5">
        <h2 id="urgent" className="text-xl">
          Need help now?
        </h2>
        <p>
          If you are in danger, or thinking about harming yourself, you can get help today.{' '}
          <Link href="/urgent-help/" className="font-semibold text-[var(--color-urgent)] underline">
            Urgent help and crisis lines
          </Link>
        </p>
      </section>
    </div>
  );
}
