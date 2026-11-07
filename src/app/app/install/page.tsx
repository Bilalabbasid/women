import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader } from '@/components/app/app-header';
import { PWAInstallBanner } from '@/components/app/pwa-install-banner';
import { APP_ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'Install the app' };

const sectionClass = 'space-y-2 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4 sm:p-5';

/**
 * How to install MenoVerdict as an app. Linked from the footer, the tracker
 * guide and the stage-quiz result. The steps describe the browsers' own menus.
 */
export default function InstallPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Install the app" subtitle="Works offline" showBack backHref={APP_ROUTES.today} />
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-5">
        <p className="text-lg text-[var(--color-ink)]">
          Install MenoVerdict — works offline, your data stays on this phone.
        </p>
        <p className="text-[var(--color-ink-muted)]">
          It installs from your browser. There&apos;s no app store, no account and no download to pay for. Once
          installed, it opens from your home screen like any other app.
        </p>

        <section aria-labelledby="install-now" className={sectionClass}>
          <h2 id="install-now" className="text-xl">
            Install on this device
          </h2>
          <PWAInstallBanner variant="settings" />
        </section>

        <section aria-labelledby="install-android" className={sectionClass}>
          <h2 id="install-android" className="text-xl">
            Android (Chrome)
          </h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Open this site in Chrome.</li>
            <li>
              Tap the <strong>⋮</strong> menu, then <strong>Install app</strong> (or <strong>Add to Home screen</strong>).
            </li>
            <li>
              Tap <strong>Install</strong>.
            </li>
          </ol>
        </section>

        <section aria-labelledby="install-ios" className={sectionClass}>
          <h2 id="install-ios" className="text-xl">
            iPhone and iPad (Safari)
          </h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Open this site in Safari.</li>
            <li>
              Tap <strong>Share</strong> (the square with an arrow).
            </li>
            <li>
              Scroll down and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
            </li>
          </ol>
        </section>

        <section aria-labelledby="install-desktop" className={sectionClass}>
          <h2 id="install-desktop" className="text-xl">
            Computer (Chrome or Edge)
          </h2>
          <p>
            Click the install icon at the right end of the address bar, or open the browser menu and choose{' '}
            <strong>Install MenoVerdict</strong>.
          </p>
        </section>

        <section aria-labelledby="install-what" className={sectionClass}>
          <h2 id="install-what" className="text-xl">
            What works offline
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>The tracker: logging, your timeline, treatments, insights and your doctor report.</li>
            <li>Pages you pressed &ldquo;Save for later&rdquo; on, listed under Saved.</li>
            <li>Guides you&apos;ve already opened, with a note that they may be out of date.</li>
          </ul>
          <p className="text-[var(--color-ink-muted)]">
            Your entries are stored only in this browser on this device. Installing doesn&apos;t change that, and
            uninstalling the app or clearing the browser&apos;s data can delete them, so{' '}
            <Link href={`${APP_ROUTES.storage}#backup-heading`} className="font-semibold text-[var(--color-link)] underline">
              download a backup
            </Link>{' '}
            now and then.
          </p>
        </section>
      </div>
    </div>
  );
}
