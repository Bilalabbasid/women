/**
 * Shared control styles for tool storage UI. They map onto the design-system
 * classes (src/app/ds-components.css), so they work in light and dark.
 */
export const btnPrimary = 'btn btn-primary';
export const btnSecondary = 'btn btn-secondary';
/** A quiet destructive action (text button in the urgent colour). */
export const btnDanger = 'btn btn-quiet text-[var(--urgent)] hover:text-[var(--urgent)]';
export const btnDangerSolid = 'btn btn-danger';
export const field = 'input';

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
