'use client';

import { useSyncExternalStore } from 'react';
import { Tabs } from '@/components/ui/interactive';

/**
 * Illustrated install steps for iPhone/iPad, Android and computers. Abstract
 * line drawings of the browsers' own controls (no faces, no brand art); the
 * control to tap is circled in brass. The visitor's own platform is shown first.
 */

type Platform = 'ios' | 'android' | 'desktop';

const subscribeNoop = () => () => {};
function detectPlatform(): Platform {
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua) || (ua.includes('macintosh') && navigator.maxTouchPoints > 1)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

/* ------------------------------------------------------------- drawing helpers */

const S = {
  line: { stroke: 'currentColor', strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const },
  screen: { fill: 'var(--paper-raised)', stroke: 'currentColor', strokeWidth: 2 },
  soft: { fill: 'var(--accent-soft)', stroke: 'none' },
  faint: { stroke: 'var(--rule-strong)', strokeWidth: 2, strokeLinecap: 'round' as const },
  ring: { fill: 'none', stroke: 'var(--brass-rule)', strokeWidth: 3 },
  hiFill: { fill: 'var(--brass-soft)', stroke: 'var(--brass-rule)', strokeWidth: 2 },
};

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 120 96" className="illo h-24 w-[7.5rem] shrink-0" role="img" aria-label={label}>
      {children}
    </svg>
  );
}

/** A phone outline with a few content lines. */
function Phone({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <rect x="34" y="4" width="52" height="88" rx="9" {...S.screen} />
      <path d="M44 22h32M44 30h24M44 38h28" {...S.faint} />
      {children}
    </>
  );
}

function MenuSheet({ y = 46, hi }: { y?: number; hi: number }) {
  return (
    <>
      <rect x="38" y={y} width="44" height="40" rx="5" fill="var(--paper-raised)" stroke="currentColor" strokeWidth="1.6" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          {i === hi && <rect x="40" y={y + 3 + i * 12} width="40" height="10" rx="3" {...S.hiFill} />}
          <path d={`M45 ${y + 8 + i * 12}h${i === hi ? 22 : 18}`} {...(i === hi ? S.line : S.faint)} />
        </g>
      ))}
    </>
  );
}

/* ------------------------------------------------------------- iPhone / iPad (Safari) */

const IosShare = () => (
  <Frame label="Safari's bottom toolbar with the Share button circled">
    <Phone>
      <path d="M34 72h52" {...S.faint} />
      <path d="M44 82h6M70 82h6" {...S.faint} />
      {/* Share: square with an arrow up */}
      <circle cx="60" cy="82" r="9" {...S.ring} />
      <path d="M56.5 80v5.5h7V80M60 76v7M57.6 78.2 60 75.8l2.4 2.4" {...S.line} strokeWidth={1.6} />
    </Phone>
  </Frame>
);

const IosAddHome = () => (
  <Frame label="The share menu with Add to Home Screen highlighted">
    <Phone>
      <MenuSheet hi={1} />
      <rect x="69" y="59" width="8" height="8" rx="2" {...S.line} strokeWidth={1.4} />
      <path d="M73 61v4M71 63h4" {...S.line} strokeWidth={1.4} />
    </Phone>
  </Frame>
);

const IosAdd = () => (
  <Frame label="The Add button at the top right, circled">
    <Phone>
      <path d="M38 14h44" {...S.faint} />
      <circle cx="74" cy="14" r="8" {...S.ring} />
      <path d="M70.5 14h7" {...S.line} strokeWidth={2.4} />
      <rect x="48" y="44" width="24" height="24" rx="6" {...S.soft} />
      <path d="M55 61V51h3l2 4 2-4h3v10" {...S.line} strokeWidth={1.6} />
    </Phone>
  </Frame>
);

/* ------------------------------------------------------------- Android (Chrome) */

const AndroidMenu = () => (
  <Frame label="Chrome's address bar with the three-dot menu circled">
    <Phone>
      <rect x="38" y="9" width="32" height="8" rx="4" fill="var(--paper-sunk)" stroke="none" />
      <circle cx="78" cy="13" r="7" {...S.ring} />
      {[9.5, 13, 16.5].map((cy) => (
        <circle key={cy} cx="78" cy={cy} r="1.3" fill="currentColor" />
      ))}
    </Phone>
  </Frame>
);

const AndroidInstallItem = () => (
  <Frame label="The menu with Install app highlighted">
    <Phone>
      <MenuSheet y={18} hi={2} />
    </Phone>
  </Frame>
);

const AndroidConfirm = () => (
  <Frame label="The Install button in the confirmation box, circled">
    <Phone>
      <rect x="38" y="36" width="44" height="30" rx="5" fill="var(--paper-raised)" stroke="currentColor" strokeWidth="1.6" />
      <path d="M43 44h24" {...S.faint} />
      <rect x="62" y="53" width="16" height="9" rx="4.5" {...S.hiFill} />
      <path d="M66 57.5h8" {...S.line} strokeWidth={1.6} />
    </Phone>
  </Frame>
);

/* ------------------------------------------------------------- computer (Chrome / Edge) */

const DesktopIcon = () => (
  <Frame label="A browser window with the install icon at the right of the address bar, circled">
    <rect x="6" y="10" width="108" height="76" rx="6" {...S.screen} />
    <path d="M6 24h108" stroke="currentColor" strokeWidth="1.6" />
    <rect x="14" y="14" width="80" height="7" rx="3.5" fill="var(--paper-sunk)" />
    <circle cx="103" cy="17.5" r="7" {...S.ring} />
    <rect x="99" y="14.5" width="8" height="6" rx="1" {...S.line} strokeWidth={1.3} />
    <path d="M103 15.5v3.2M101.6 17.4l1.4 1.4 1.4-1.4" {...S.line} strokeWidth={1.2} />
    <path d="M18 38h50M18 48h70M18 58h40" {...S.faint} />
  </Frame>
);

const DesktopConfirm = () => (
  <Frame label="The browser's Install confirmation, with Install circled">
    <rect x="6" y="10" width="108" height="76" rx="6" {...S.screen} />
    <path d="M6 24h108" stroke="currentColor" strokeWidth="1.6" />
    <rect x="58" y="28" width="52" height="34" rx="5" fill="var(--paper-raised)" stroke="currentColor" strokeWidth="1.6" />
    <path d="M64 37h26" {...S.faint} />
    <rect x="88" y="49" width="17" height="9" rx="4.5" {...S.hiFill} />
    <path d="M92 53.5h9" {...S.line} strokeWidth={1.6} />
  </Frame>
);

/* ------------------------------------------------------------- steps */

function Steps({ steps }: { steps: Array<{ art: React.ReactNode; title: React.ReactNode; body?: React.ReactNode }> }) {
  return (
    <ol className="step-list">
      {steps.map((s, i) => (
        <li key={i}>
          <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
            {s.art}
            <div className="min-w-[12rem] flex-1">
              <span className="step-title">{s.title}</span>
              {s.body && <span className="mt-1 block text-[var(--ink-muted)]">{s.body}</span>}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

const IOS = (
  <Steps
    steps={[
      {
        art: <IosShare />,
        title: (
          <>
            In Safari, tap <strong>Share</strong>
          </>
        ),
        body: 'The square with an arrow pointing up, at the bottom of the screen (top right on iPad).',
      },
      {
        art: <IosAddHome />,
        title: (
          <>
            Tap <strong>Add to Home Screen</strong>
          </>
        ),
        body: 'Scroll down the list if you don’t see it straight away.',
      },
      {
        art: <IosAdd />,
        title: (
          <>
            Tap <strong>Add</strong>
          </>
        ),
        body: 'MenoVerdict appears on your home screen. Open it from there.',
      },
    ]}
  />
);

const ANDROID = (
  <Steps
    steps={[
      {
        art: <AndroidMenu />,
        title: (
          <>
            In Chrome, tap the <strong>⋮</strong> menu
          </>
        ),
        body: 'Top right, next to the address bar.',
      },
      {
        art: <AndroidInstallItem />,
        title: (
          <>
            Tap <strong>Install app</strong>
          </>
        ),
        body: 'On some phones it says “Add to Home screen”.',
      },
      {
        art: <AndroidConfirm />,
        title: (
          <>
            Tap <strong>Install</strong>
          </>
        ),
        body: 'It opens from your home screen or app drawer like any other app.',
      },
    ]}
  />
);

const DESKTOP = (
  <Steps
    steps={[
      {
        art: <DesktopIcon />,
        title: (
          <>
            Click the <strong>install icon</strong> in the address bar
          </>
        ),
        body: 'At the right end, in Chrome or Edge. No icon? Open the browser menu and choose “Install MenoVerdict”.',
      },
      {
        art: <DesktopConfirm />,
        title: (
          <>
            Click <strong>Install</strong>
          </>
        ),
        body: 'It opens in its own window and appears with your other apps.',
      },
    ]}
  />
);

export function InstallGuide() {
  const platform = useSyncExternalStore<Platform | null>(subscribeNoop, detectPlatform, () => null);
  const all = [
    { id: 'ios' as const, label: 'iPhone or iPad', content: IOS },
    { id: 'android' as const, label: 'Android', content: ANDROID },
    { id: 'desktop' as const, label: 'Computer', content: DESKTOP },
  ];
  // Her own device first, so it's the open tab.
  const tabs = platform ? [...all.filter((t) => t.id === platform), ...all.filter((t) => t.id !== platform)] : all;
  // contain: inline-size keeps the non-wrapping tab row from widening the page on narrow phones.
  return (
    <div className="min-w-0 [contain:inline-size]">
      <Tabs key={platform ?? 'server'} tabs={tabs} />
    </div>
  );
}
