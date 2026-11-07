'use client';

import { useEffect, useId, useRef } from 'react';
import { Icon } from './kit';

/**
 * Controlled bottom sheet (centred panel on wide screens) for the Treatments
 * screen's forms. Same look as ui/interactive BottomSheet, but opened and closed
 * by the page's own state, so the existing modal logic stays unchanged.
 * Esc, the Close button and a tap on the backdrop all call onClose.
 */
export function TreatmentSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="sheet-grip" aria-hidden="true" />
      <div className="sheet-head">
        <div className="min-w-0">
          <h2 id={titleId} className="sheet-title">
            {title}
          </h2>
          {subtitle && <p className="truncate text-[0.95rem] text-[var(--ink-muted)]">{subtitle}</p>}
        </div>
        <button type="button" className="icon-btn shrink-0" onClick={onClose} aria-label="Close">
          <Icon.Close width={22} height={22} />
        </button>
      </div>
      <div className="sheet-body">{open && children}</div>
    </dialog>
  );
}
