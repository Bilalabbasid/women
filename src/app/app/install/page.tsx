import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader } from '@/components/app/app-header';
import { PWAInstallBanner } from '@/components/app/pwa-install-banner';
import { InstallGuide } from '@/components/app/install-guide';
import { AppPage, Panel } from '@/components/app/kit';
import { APP_ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'Install the app' };

/**
 * How to install MenoVerdict as an app. Linked from the footer, the tracker
 * guide and the stage-quiz result. The steps describe the browsers' own menus.
 */
export default function InstallPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Install the app" subtitle="Works offline" showBack backHref={APP_ROUTES.today} />
      <AppPage>
        <div className="space-y-2">
          <p className="font-serif text-[length:var(--fs-h3)] leading-snug font-semibold text-[var(--ink)]">
            Install MenoVerdict — works offline, your data stays on this phone.
          </p>
          <p className="text-[var(--ink-muted)]">
            It installs from your browser. There&apos;s no app store, no account and nothing to pay for. Once installed,
            it opens from your home screen like any other app.
          </p>
        </div>

        <Panel title="Install on this device" tone="feature">
          <PWAInstallBanner variant="settings" />
        </Panel>

        <Panel title="Step by step" hint="Two or three taps. Pick your device.">
          <InstallGuide />
        </Panel>

        <Panel title="What works offline">
          <ul className="grid gap-2">
            {[
              'The tracker: logging, your timeline, treatments, insights and your doctor report.',
              'Pages you pressed “Save for later” on, listed under Saved.',
              'Guides you’ve already opened, with a note that they may be out of date.',
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--on-accent)]">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7" />
                  </svg>
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="notice-line">
            <span>
              Your entries are stored only in this browser on this device. Installing doesn&apos;t change that, and
              uninstalling the app or clearing the browser&apos;s data can delete them, so{' '}
              <Link href={`${APP_ROUTES.storage}#backup-heading`}>download a backup</Link> now and then.
            </span>
          </p>
        </Panel>
      </AppPage>
    </div>
  );
}
