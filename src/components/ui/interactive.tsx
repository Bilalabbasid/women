'use client';

/**
 * Small interactive primitives. Each is a few hundred bytes; import only what a
 * page needs. No dependencies.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';

/* --------------------------------------------------------------- bottom sheet */

export function BottomSheet({
  trigger,
  title,
  children,
  triggerClassName = 'toc-chip',
}: {
  trigger: React.ReactNode;
  title: string;
  children: React.ReactNode;
  triggerClassName?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = useCallback(() => ref.current?.close(), []);
  return (
    <>
      <button type="button" className={triggerClassName} aria-haspopup="dialog" onClick={() => ref.current?.showModal()}>
        {trigger}
      </button>
      <dialog
        ref={ref}
        className="sheet"
        aria-labelledby={titleId}
        // Tap on the backdrop closes it.
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
      >
        <div className="sheet-grip" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id={titleId} className="sheet-title">
            {title}
          </h2>
          <button type="button" className="icon-btn" onClick={close} aria-label="Close">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {/* Links inside close the sheet when followed (e.g. "On this page"). */}
        <div className="sheet-body" onClick={(e) => (e.target as HTMLElement).closest('a') && close()}>
          {children}
        </div>
      </dialog>
    </>
  );
}

/* --------------------------------------------------------------- toast */

const TOAST_EVENT = 'menoverdict:toast';

/** Show a short confirmation ("Saved", "Copied"). Announced politely. */
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: message }));
}

export function ToastRegion() {
  const [items, setItems] = useState<Array<{ id: number; message: string }>>([]);
  useEffect(() => {
    let n = 0;
    const on = (e: Event) => {
      const id = ++n;
      setItems((xs) => [...xs.slice(-2), { id, message: (e as CustomEvent<string>).detail }]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3200);
    };
    window.addEventListener(TOAST_EVENT, on);
    return () => window.removeEventListener(TOAST_EVENT, on);
  }, []);
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="toast">
          <span className="toast-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- switch */

export function Switch({
  label,
  checked,
  onChange,
  disabled,
  onLabel = 'On',
  offLabel = 'Off',
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  onLabel?: string;
  offLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="switch"
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-track" aria-hidden="true" />
      <span>{label}</span>
      <span className="switch-state" aria-hidden="true">
        {checked ? onLabel : offLabel}
      </span>
    </button>
  );
}

/* --------------------------------------------------------------- tabs */

export function Tabs({ tabs }: { tabs: Array<{ id: string; label: string; content: React.ReactNode }> }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const base = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : dir ? (i + dir + tabs.length) % tabs.length : -1;
    if (to < 0) return;
    e.preventDefault();
    setActive(tabs[to].id);
    refs.current[to]?.focus();
  };
  return (
    <div>
      <div role="tablist" className="tabs-list">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`${base}-t-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`${base}-p-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-p-${t.id}`}
          aria-labelledby={`${base}-t-${t.id}`}
          hidden={active !== t.id}
          className="tabs-panel"
          tabIndex={0}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- mini table of contents */

export interface TocItem {
  id: string;
  label: string;
}

/** Marks the section in view (aria-current) as she reads. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}

function TocList({ items, active }: { items: TocItem[]; active: string | null }) {
  return (
    <ol>
      {items.map((it) => (
        <li key={it.id}>
          <a href={`#${it.id}`} aria-current={active === it.id ? 'true' : undefined}>
            {it.label}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Sticky sidebar on desktop. */
export function TocRail({ items, children }: { items: TocItem[]; children?: React.ReactNode }) {
  const active = useActiveSection(items.map((i) => i.id));
  return (
    <nav className="toc-rail" aria-label="On this page">
      <p className="toc-title">On this page</p>
      <TocList items={items} active={active} />
      {children}
    </nav>
  );
}

/** "On this page" chip that opens a bottom sheet, for phones. */
export function TocSheet({ items }: { items: TocItem[] }) {
  const active = useActiveSection(items.map((i) => i.id));
  return (
    <BottomSheet
      title="On this page"
      trigger={
        <>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h10M4 18h13" />
          </svg>
          On this page · {items.length} sections
        </>
      }
    >
      <div className="toc-rail">
        <TocList items={items} active={active} />
      </div>
    </BottomSheet>
  );
}
