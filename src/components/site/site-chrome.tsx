import Link from 'next/link';
import { SITE } from '@/lib/site/config';
import { APP_ROUTES } from '@/lib/routes';
import { isToolLive } from '@/lib/tools/logic';
import type { Crumb } from '@/lib/seo/jsonld';
import { serializeLd } from '@/lib/seo/jsonld';

/** Server-only site chrome. Ships no JavaScript. */

export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeLd(data) }} />;
}

export function SiteHeader({ hubs }: { hubs: Array<{ href: string; label: string }> }) {
  return (
    <header role="banner" className="border-b border-[var(--color-rule)] bg-[var(--color-paper)]">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2">
        <Link href="/" className="tap font-serif text-xl font-semibold text-[var(--color-ink)] no-underline">
          {SITE.name}
        </Link>
        <nav aria-label="Main" className="w-full sm:w-auto">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-0">
            {hubs.map((h) => (
              <li key={h.href}>
                <Link href={h.href} className="tap text-[var(--color-ink)] underline-offset-4 hover:underline">
                  {h.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/tools/" className="tap font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline">
                Tools
              </Link>
            </li>
            <li>
              <Link href="/search/" className="tap text-[var(--color-ink)] underline-offset-4 hover:underline">
                Search
              </Link>
            </li>
            {SITE.flags.login && (
              <li>
                <Link href="/app/account/" className="tap font-semibold text-[var(--color-ink)] underline-offset-4 hover:underline">
                  Account
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ links }: { links: Array<{ href: string; label: string }> }) {
  return (
    <footer role="contentinfo" className="mt-16 border-t border-[var(--color-rule)] bg-[var(--color-paper-raised)]">
      <div className="mx-auto max-w-5xl px-4 pt-10 pb-4">
        {/* Prompt 2 Standard Notice */}
        <div className="mb-8 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] p-4 text-xs leading-relaxed text-[var(--color-ink-muted)]">
          <p>
            <strong>Standard Notice:</strong> General information based on published sources and the symptoms you searched for.
            This isn&apos;t medical or legal advice, a diagnosis or a treatment plan. We aren&apos;t doctors, and this content
            wasn&apos;t written by a doctor. Please consult a doctor about your own symptoms. If your symptoms are severe or sudden,
            seek urgent care.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <p className="font-serif text-lg font-semibold">{SITE.name}</p>
            <p className="text-[var(--color-ink-muted)]">
              Independent, evidence-graded information on perimenopause and menopause.
              Fast, crawlable, and reader-first.
            </p>
            <p className="text-xs text-[var(--color-ink-muted)]">
              As an Amazon Associate we earn from qualifying purchases.
            </p>
            {SITE.legalEntity && <p className="text-[var(--color-ink-muted)]">Operated by {SITE.legalEntity}.</p>}
          </div>
          <nav aria-label="Footer">
            <ul className="space-y-1">
              <li>
                <Link href="/urgent-help/" className="tap font-semibold text-[var(--color-urgent)] underline">
                  Urgent help and crisis lines
                </Link>
              </li>
              <li>
                <Link href="/evidence/updates/" className="tap underline">
                  What&apos;s changed (Evidence updates)
                </Link>
              </li>
              <li>
                <Link href="/evidence/how-we-grade/" className="tap underline">
                  How we grade evidence
                </Link>
              </li>
              <li>
                <Link href="/about/how-we-make-money/" className="tap underline">
                  How we make money
                </Link>
              </li>
              {isToolLive('symptom-tracker') && (
                <li>
                  <Link href={APP_ROUTES.today} className="tap underline">
                    Your private symptom tracker
                  </Link>
                </li>
              )}
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="tap underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export function Breadcrumbs({ crumbs }: { crumbs: Array<Crumb & { linked: boolean }> }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[var(--color-ink-muted)]">
      <ol className="flex flex-wrap items-center gap-x-2">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-x-2">
              {c.linked && !last ? (
                <Link href={c.path} className="tap underline">
                  {c.name}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined}>{c.name}</span>
              )}
              {!last && <span aria-hidden="true">›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
