/** Shared control styles for tool storage UI (design tokens from globals.css). */
export const btnPrimary =
  'tap justify-center rounded-xl bg-[var(--color-accent)] px-5 font-semibold text-white hover:opacity-90 disabled:opacity-50';
export const btnSecondary =
  'tap justify-center rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] px-4 font-semibold text-[var(--color-ink)] hover:bg-[var(--color-accent-soft)] disabled:opacity-50';
export const btnDanger = 'tap justify-center rounded-xl px-3 font-semibold text-[var(--color-urgent)] underline disabled:opacity-50';
export const btnDangerSolid =
  'tap justify-center rounded-xl bg-[var(--color-urgent)] px-4 font-semibold text-white hover:opacity-90 disabled:opacity-50';
export const field =
  'min-h-[44px] w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 text-[var(--color-ink)]';

export function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
