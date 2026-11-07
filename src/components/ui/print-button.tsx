'use client';

export function PrintButton({ label = 'Print this page', className = 'btn btn-quiet btn-sm' }: { label?: string; className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 9V3h10v6M7 17H4v-7h16v7h-3" />
        <path d="M7 14h10v7H7z" />
      </svg>
      {label}
    </button>
  );
}
