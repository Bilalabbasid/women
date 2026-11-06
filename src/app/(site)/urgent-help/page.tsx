import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { CRISIS_RESOURCES, URGENT_TRIGGERS } from '@/lib/safety/urgent-triggers';
import { Breadcrumbs, JsonLd } from '@/components/site/site-chrome';
import { breadcrumbLd } from '@/lib/seo/jsonld';

export const metadata: Metadata = buildMetadata({
  title: 'Urgent help and crisis lines',
  description:
    'If you are in danger or thinking about harming yourself, get help now. Crisis lines for the US (988) and UK (Samaritans), and when to seek urgent care.',
  path: '/urgent-help/',
});

/**
 * Urgent help. Rendered from the same clinician-reviewable trigger file the
 * tracker uses, so wording stays in one place. No commercial content, ever.
 *
 * Published before clinical review by explicit exception (DECISIONS.md D-016):
 * showing verified crisis lines is safer than hiding them. Trigger wording
 * remains in the clinician review pack.
 */
export default function UrgentHelpPage() {
  const crumbs = [
    { name: 'Home', path: '/', linked: true },
    { name: 'Urgent help', path: '/urgent-help/', linked: false },
  ];
  const triggers = URGENT_TRIGGERS.filter((t) => t.level !== 'crisis');

  return (
    <div className="max-w-3xl space-y-8" data-urgent="true">
      <JsonLd data={breadcrumbLd(crumbs)} />
      <Breadcrumbs crumbs={crumbs} />
      <h1 className="text-3xl sm:text-4xl">Urgent help and crisis lines</h1>

      <section aria-labelledby="crisis" className="space-y-4 rounded-xl border-2 border-[var(--color-urgent)] bg-[var(--color-urgent-soft)] p-5">
        <h2 id="crisis" className="text-2xl">
          If you are thinking about harming yourself
        </h2>
        <p>You deserve support right now. You can talk to someone today, for free and in confidence.</p>
        {(['en-US', 'en-GB'] as const).map((loc) => (
          <div key={loc} className="space-y-2">
            <h3 className="text-xl">{loc === 'en-US' ? 'In the United States' : 'In the United Kingdom'}</h3>
            <p className="font-semibold">{CRISIS_RESOURCES[loc].emergency}</p>
            {CRISIS_RESOURCES[loc].resources.map((r) => (
              <div key={r.name} className="space-y-2">
                <p>
                  <a href={r.url} className="font-semibold underline">
                    {r.name}
                  </a>
                  : {r.how}
                </p>
                <p className="flex flex-wrap gap-2">
                  {r.actions.map((a) => (
                    <a
                      key={a.href}
                      href={a.href}
                      className="tap rounded-xl bg-[var(--color-urgent)] px-5 font-semibold text-white no-underline"
                    >
                      {a.label}
                    </a>
                  ))}
                </p>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section aria-labelledby="symptoms" className="space-y-4">
        <h2 id="symptoms" className="text-2xl">
          Symptoms that need prompt care
        </h2>
        {triggers.map((t) => (
          <div key={t.id} className="space-y-1">
            <h3 className="text-xl">{t.title}</h3>
            <p>
              <strong>US:</strong> {t.message['en-US']}
            </p>
            <p>
              <strong>UK:</strong> {t.message['en-GB']}
            </p>
            <p className="text-[var(--color-ink-muted)]">
              Source:{' '}
              {t.sources.map((s, i) => (
                <span key={s}>
                  {i > 0 && ', '}
                  <a href={s} className="underline">
                    {new URL(s).hostname}
                  </a>
                </span>
              ))}
            </p>
          </div>
        ))}
      </section>

      <p className="text-[var(--color-ink-muted)]">
        This page gives general information. It can&apos;t assess you. If you&apos;re unsure, contact a
        clinician or an urgent care service.
      </p>
    </div>
  );
}
