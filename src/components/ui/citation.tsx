/**
 * Citation marker: tap the number to see the source (title, publisher, year,
 * link). Native [popover], so no JavaScript; the number still links to the
 * References list for no-popover browsers and for print.
 */
export interface CiteSource {
  title: string;
  publisher?: string;
  year?: number | string;
  url?: string;
  /** "Small study", "Preprint", "Brand-funded"… shown as a warning line. */
  caveat?: string;
}

export function Cite({ n, source, refId = `ref-${n}` }: { n: number; source: CiteSource; refId?: string }) {
  const popId = `cite-pop-${n}`;
  return (
    <>
      <button
        type="button"
        className="cite"
        popoverTarget={popId}
        aria-label={`Source ${n}: ${source.title}`}
        data-ref={refId}
      >
        {n}
      </button>
      <span id={popId} popover="auto" className="pop" role="dialog" aria-label={`Source ${n}`}>
        <span className="block text-[0.95rem] font-bold text-[var(--ink-muted)]">Source {n}</span>
        <span className="pop-title block">{source.title}</span>
        <span className="block text-[var(--ink-muted)]">
          {[source.publisher, source.year].filter(Boolean).join(', ')}
        </span>
        {source.caveat && <strong className="mt-2 block text-[var(--g-limited-ink)]">{source.caveat}</strong>}
        <span className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {source.url && (
            <a href={source.url} className="link" rel="noopener" target="_blank">
              Open the source<span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          )}
          <a href={`#${refId}`} className="link">
            All references
          </a>
        </span>
      </span>
    </>
  );
}
