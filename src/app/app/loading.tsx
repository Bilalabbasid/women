export default function Loading() {
  return (
    <div className="app-page" aria-busy="true" aria-live="polite">
      <p className="visually-hidden">Opening your private journal…</p>
      <span className="skeleton h-9 w-1/2" />
      <span className="skeleton h-40 w-full rounded-[var(--radius-lg)]" />
      <span className="skeleton h-24 w-full rounded-[var(--radius-lg)]" />
      <span className="skeleton h-24 w-full rounded-[var(--radius-lg)]" />
    </div>
  );
}
