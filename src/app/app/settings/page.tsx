'use client';

import Link from 'next/link';
import { AppHeader } from '@/components/app/app-header';
import { PWAInstallBanner } from '@/components/app/pwa-install-banner';
import { LogReminderSettings } from '@/components/app/log-reminder-settings';
import { AppPage, Panel, Icon } from '@/components/app/kit';
import { DisplayControls } from '@/components/ui/display-controls';
import { APP_ROUTES } from '@/lib/routes';
import { APP_CONFIG } from '@/lib/config/constants';

function LinkRow({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="row">
      <span className="row-main">
        <span className="row-title block">{title}</span>
        <span className="row-meta block">{body}</span>
      </span>
      <Icon.Chevron width={20} height={20} className="shrink-0 text-[var(--ink-muted)]" />
    </Link>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        title="Settings"
        subtitle="Reading, reminders and your data"
        showBack={true}
        backHref="/app/today/"
        showPrivacyBadge={true}
        showSettings={false}
      />

      <AppPage>
        {/* Reading: theme and text size, for the whole site and the tracker. */}
        <Panel title="Reading" hint="Larger text and a dark theme for night-time. These apply across the whole site.">
          <DisplayControls />
        </Panel>

        {/* Reminders: shown inside the app when she opens it (no push server), plus treatment reminders. */}
        <Panel title="Reminders" hint="Shown on Today when you open the app. Nothing is sent to you.">
          <LogReminderSettings />
          <div className="border-t border-[var(--rule)] pt-4">
            <p className="text-[var(--ink-muted)]">
              Reminders for treatments you log (such as a patch change) are set up on the Treatments page, where you can
              allow notifications and choose whether they show the treatment name.
            </p>
            <Link href="/app/treatments/" className="link link-arrow mt-1 inline-block py-2.5">
              Set up treatment reminders
            </Link>
          </div>
        </Panel>

        {/* Your data: stored on this device only. There is no cloud option to choose. */}
        <Panel title="Your data">
          <div className="flex items-start gap-3">
            <span className="row-icon" aria-hidden="true">
              <Icon.Lock width={20} height={20} />
            </span>
            <div>
              <p className="font-bold">Saved in this browser on this device</p>
              <p className="mt-1 text-[var(--ink-muted)]">
                Your tracker and tool entries are kept in this browser&apos;s storage. Nothing is uploaded and nothing is
                deleted automatically. It isn&apos;t synced to other devices, and clearing browsing data can remove it, so
                keep a backup.
              </p>
            </div>
          </div>
          <div className="row-list">
            <LinkRow href="/app/storage/" title="Manage storage" body="Back up or restore, see what’s stored, delete old entries or everything." />
            <LinkRow href="/app/privacy/" title="Privacy center" body="Where your data is, and how to export or delete it." />
            <LinkRow href={APP_ROUTES.saved} title="Saved pages" body="Guides you kept with “Save for later”." />
          </div>
        </Panel>

        {/* Install (the only place, besides after first tool use, that offers installation) */}
        <Panel title="Install the app" hint="Opens from your home screen and works offline.">
          <PWAInstallBanner variant="settings" />
          <Link href={APP_ROUTES.install} className="link link-arrow inline-block justify-self-start py-2.5">
            How installing works
          </Link>
        </Panel>

        {/* About this app */}
        <section aria-labelledby="about-heading" className="space-y-3 border-t border-[var(--rule)] pt-5 text-[var(--ink-muted)]">
          <h2 id="about-heading" className="visually-hidden">
            About this app
          </h2>
          <dl className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <dt>App version</dt>
              <dd className="font-mono text-[var(--ink)]">{APP_CONFIG.version}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Where your entries are kept</dt>
              <dd className="text-right font-bold text-[var(--accent)]">This device only</dd>
            </div>
          </dl>
          <p className="text-[1rem] leading-relaxed">{APP_CONFIG.medicalDisclaimer}</p>
        </section>
      </AppPage>
    </div>
  );
}
