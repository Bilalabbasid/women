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

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5h16v11H9l-5 4V5Z" />
    </svg>
  );
}

/**
 * Urgent help. Rendered from the same clinician-reviewable trigger file the
 * tracker uses, so wording stays in one place. No commercial content, ever.
 *
 * Published before clinical review by explicit exception (DECISIONS.md D-016):
 * showing verified crisis lines is safer than hiding them. Trigger wording
 * remains in the clinician review pack.
 *
 * Phone and text lines are large tap-to-call buttons (tel:/sms: links).
 */
export default function UrgentHelpPage() {
  const crumbs = [
    { name: 'Home', path: '/', linked: true },
    { name: 'Urgent help', path: '/urgent-help/', linked: false },
  ];
  const triggers = URGENT_TRIGGERS.filter((t) => t.level !== 'crisis');

  return (
    <div className="mx-auto max-w-3xl space-y-10" data-urgent="true">
      <JsonLd data={breadcrumbLd(crumbs)} />
      <Breadcrumbs crumbs={crumbs} />
      <header>
        <h1 className="text-[length:var(--fs-h1)] leading-[1.1]">Urgent help and crisis lines</h1>
        <p className="mt-3 max-w-[var(--measure)] text-[length:var(--fs-lead)] text-[var(--ink-muted)]">
          If you or someone else is in danger right now, call your emergency number. The lines below are free and
          confidential.
        </p>
      </header>

      <section aria-labelledby="crisis" className="urgent-block gap-6 p-5 sm:p-7">
        <div className="space-y-2">
          <h2 id="crisis" className="text-[length:var(--fs-h2)] text-[var(--urgent)]">
            If you are thinking about harming yourself
          </h2>
          <p className="text-[1.125rem]">You deserve support right now. You can talk to someone today, for free and in confidence.</p>
        </div>
        {(['en-US', 'en-GB'] as const).map((loc) => (
          <div key={loc} className="space-y-3 border-t border-[var(--urgent-rule)] pt-5">
            <h3 className="text-[length:var(--fs-h3)]">{loc === 'en-US' ? 'In the United States' : 'In the United Kingdom'}</h3>
            <p className="text-[1.125rem] font-bold">{CRISIS_RESOURCES[loc].emergency}</p>
            {CRISIS_RESOURCES[loc].resources.map((r) => (
              <div key={r.name} className="space-y-3">
                <p>
                  <a href={r.url} className="font-bold underline underline-offset-2">
                    {r.name}
                  </a>
                  : {r.how}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {r.actions.map((a) => (
                    <a key={a.href} href={a.href} className="btn btn-danger btn-lg btn-block min-h-16 justify-start text-[1.2rem]">
                      {a.href.startsWith('sms:') ? <MessageIcon /> : <PhoneIcon />}
                      {a.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section aria-labelledby="symptoms" className="space-y-5">
        <div>
          <h2 id="symptoms" className="text-[length:var(--fs-h2)]">
            Symptoms that need prompt care
          </h2>
          <p className="mt-1 text-[var(--ink-muted)]">Not an emergency line, but don’t wait on these: contact a clinician soon.</p>
        </div>
        <ul className="grid gap-4">
          {triggers.map((t) => (
            <li key={t.id} className="callout callout-redflag m-0 max-w-none">
              <h3 className="font-sans text-[1.15rem] font-bold">{t.title}</h3>
              <p>
                <strong>US:</strong> {t.message['en-US']}
              </p>
              <p>
                <strong>UK:</strong> {t.message['en-GB']}
              </p>
              <p className="text-[1rem] text-[var(--ink-muted)]">
                Source:{' '}
                {t.sources.map((s, i) => (
                  <span key={s}>
                    {i > 0 && ', '}
                    <a href={s} className="underline underline-offset-2">
                      {new URL(s).hostname}
                    </a>
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="notice-line">
        This page gives general information. It can&apos;t assess you. If you&apos;re unsure, contact a clinician or an urgent
        care service.
      </p>
    </div>
  );
}
