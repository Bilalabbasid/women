import Link from 'next/link';
import { BottomSheet } from '@/components/ui/interactive';
import { TextSizeControl, ThemeControl } from '@/components/ui/display-controls';

export interface NavGroup {
  title: string;
  links: Array<{ href: string; label: string; hint?: string }>;
}

/** Shared body of the mobile menu sheet and the desktop "More" panel. */
export function NavGroups({ groups, extra }: { groups: NavGroup[]; extra?: Array<{ href: string; label: string }> }) {
  return (
    <div className="nav-groups">
      {groups.map((g) =>
        g.links.length ? (
          <div key={g.title} className="nav-group">
            <p className="nav-group-title">{g.title}</p>
            <ul>
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="nav-link">
                    <span>{l.label}</span>
                    {l.hint && <span className="nav-hint">{l.hint}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
      {extra && extra.length > 0 && (
        <ul className="nav-extra">
          {extra.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="nav-link">
                <span>{l.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReadingControls() {
  return (
    <div className="reading-controls">
      <p className="nav-group-title">Reading</p>
      <div className="flex flex-wrap items-center gap-3">
        <TextSizeControl />
        <ThemeControl showLabels={false} />
      </div>
    </div>
  );
}

export function UrgentLink() {
  return (
    <Link href="/urgent-help/" className="urgent-link">
      <span className="urgent-dot" aria-hidden="true" />
      Urgent help, now
    </Link>
  );
}

/** Phones: menu button → bottom sheet grouped as Understand · Treat · Tools. */
export function MenuSheet({ groups, extra }: { groups: NavGroup[]; extra?: Array<{ href: string; label: string }> }) {
  return (
    <BottomSheet
      title="Menu"
      triggerClassName="icon-btn"
      trigger={
        <>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h11" />
          </svg>
          <span className="visually-hidden">Menu</span>
        </>
      }
    >
      <NavGroups groups={groups} extra={extra} />
      <ReadingControls />
      <UrgentLink />
    </BottomSheet>
  );
}
