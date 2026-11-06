import React from 'react';
import Link from 'next/link';
import {
  CRISIS_RESOURCES,
  type Locale,
  type UrgentTrigger,
} from '@/lib/safety/urgent-triggers';

/**
 * Renders urgent guidance for the given triggers. It never contains commercial
 * content, and callers must not render commercial content on the same screen
 * while any trigger applies (see suppressesCommercial()).
 *
 * Hook-free, so it can render from server or client components.
 */
export function UrgentGuidance({
  triggers,
  locale = 'en-US',
}: {
  triggers: UrgentTrigger[];
  locale?: Locale;
}) {
  if (triggers.length === 0) return null;
  const crisis = CRISIS_RESOURCES[locale];

  return (
    <section
      aria-label="Urgent guidance"
      data-urgent="true"
      className="space-y-3 rounded-2xl border-2 border-[#8A1F1F] bg-[#FFF5F5] p-4 text-[#2A1212]"
    >
      {triggers.map((t) => (
        <div key={t.id} role={t.level === 'see_doctor' ? 'note' : 'alert'} className="space-y-1.5">
          <p className="font-semibold">
            <span className="mr-2 inline-block rounded bg-[#8A1F1F] px-2 py-0.5 text-sm font-bold uppercase tracking-wide text-white">
              {t.level === 'crisis' ? 'Get support now' : t.level === 'emergency' ? 'Urgent' : 'Get this checked'}
            </span>
            {t.title}
          </p>
          <p className="leading-relaxed">{t.message[locale]}</p>

          {t.level === 'crisis' && (
            <div className="space-y-2">
              <p className="font-semibold">{crisis.emergency}</p>
              <ul className="space-y-2">
                {[...CRISIS_RESOURCES['en-US'].resources, ...CRISIS_RESOURCES['en-GB'].resources].map((r) => (
                  <li key={r.name}>
                    <a href={r.url} className="font-semibold underline" rel="noopener" target="_blank">
                      {r.name}
                    </a>
                    : {r.how}
                    <span className="mt-1 flex flex-wrap gap-2">
                      {r.actions.map((a) => (
                        <a
                          key={a.href}
                          href={a.href}
                          className="inline-flex min-h-[44px] items-center rounded-xl bg-[#8A1F1F] px-4 font-semibold text-white"
                        >
                          {a.label}
                        </a>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
      <p className="text-sm text-[#5A3A3A]">
        This guidance appears because of what you entered. It stays on this device. It is general
        information, not a diagnosis.{' '}
        <Link href="/urgent-help/" className="underline">
          More urgent-help options
        </Link>
      </p>
    </section>
  );
}
