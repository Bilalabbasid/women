'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { loadIndex, search, STARTER_PHRASES, type SearchEntry } from './search-engine';

type Prepared = Awaited<ReturnType<typeof loadIndex>>;

/**
 * Instant, private search (WAI-ARIA combobox + listbox). The index is fetched on
 * first focus, never before, so pages that never search pay nothing. The query
 * never leaves the device.
 */
export function SearchCombobox({
  initialQuery = '',
  autoFocus = false,
  limit = 8,
  onEscape,
  onNavigate,
  size = 'md',
  showAllLink = true,
}: {
  initialQuery?: string;
  autoFocus?: boolean;
  limit?: number;
  /** Esc with an empty field (e.g. close the overlay). */
  onEscape?: () => void;
  /** Called just before navigating to a result. */
  onNavigate?: () => void;
  size?: 'md' | 'lg';
  showAllLink?: boolean;
}) {
  const uid = useId();
  const listId = `${uid}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(initialQuery);
  const [index, setIndex] = useState<Prepared | null>(null);
  const loading = useRef(false);
  const [active, setActive] = useState(-1);

  const ensureIndex = () => {
    if (index || loading.current) return;
    loading.current = true;
    void loadIndex().then((p) => {
      loading.current = false;
      setIndex(p);
    });
  };

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
    if (autoFocus || initialQuery) ensureIndex();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on mount
  }, []);

  const out = useMemo(() => (index && q.trim() ? search(index, q, limit) : null), [index, q, limit]);
  const options: Array<{ entry: SearchEntry; kind: 'suggested' | 'result' }> = out
    ? [...out.suggested.map((entry) => ({ entry, kind: 'suggested' as const })), ...out.results.map((r) => ({ entry: r.entry, kind: 'result' as const }))]
    : [];
  const open = q.trim().length > 0;
  const optId = (i: number) => `${uid}-opt-${i}`;

  const go = (url: string) => {
    onNavigate?.();
    window.location.assign(url);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (options.length ? (a + 1) % options.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (options.length ? (a <= 0 ? options.length - 1 : a - 1) : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = options[active >= 0 ? active : 0];
      if (pick) go(pick.entry.url);
      else if (q.trim()) go(`/search/?q=${encodeURIComponent(q.trim())}`);
    } else if (e.key === 'Escape') {
      if (q) {
        e.preventDefault();
        e.stopPropagation();
        setQ('');
        setActive(-1);
      } else {
        onEscape?.();
      }
    }
  };

  const status = !open
    ? ''
    : !index
      ? 'Loading…'
      : options.length === 0
        ? `Nothing matched “${q.trim()}”.`
        : `${options.length} ${options.length === 1 ? 'match' : 'matches'}${out?.close ? ' (close matches)' : ''}. Use the up and down arrows to choose.`;

  return (
    <div className={`search-combo ${size === 'lg' ? 'search-combo-lg' : ''}`}>
      <form
        role="search"
        action="/search/"
        method="get"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <label htmlFor={`${uid}-input`} className="visually-hidden">
          Search MenoVerdict
        </label>
        <div className="search-field">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            id={`${uid}-input`}
            name="q"
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open && options.length > 0}
            aria-controls={listId}
            aria-activedescendant={active >= 0 ? optId(active) : undefined}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            value={q}
            placeholder="What’s bothering you? e.g. hot at night"
            onFocus={ensureIndex}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(-1);
              ensureIndex();
            }}
            onKeyDown={onKeyDown}
          />
          {q && (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear search"
              onClick={() => {
                setQ('');
                setActive(-1);
                inputRef.current?.focus();
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>
      </form>

      <p className="visually-hidden" role="status" aria-live="polite">
        {status}
      </p>

      {!open && (
        <div className="search-starters">
          <p className="eyebrow">Try everyday words</p>
          <div className="chip-row">
            {STARTER_PHRASES.map((s) => (
              <button
                key={s}
                type="button"
                className="chip"
                onClick={() => {
                  setQ(s);
                  setActive(-1);
                  ensureIndex();
                  inputRef.current?.focus();
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div className="search-results">
          {index && options.length === 0 && (
            <p className="search-empty">
              Nothing matched. Try fewer words, or a symptom like “hot flashes” or “sleep”.
            </p>
          )}
          <ul id={listId} role="listbox" aria-label="Search results" className="search-list">
            {options.map((o, i) => {
              const firstResult = out?.suggested.length ?? 0;
              const head =
                o.kind === 'suggested' && i === 0
                  ? 'Suggested for you'
                  : o.kind === 'result' && i === firstResult
                    ? out?.close
                      ? 'Close matches'
                      : firstResult > 0
                        ? 'More results'
                        : null
                    : null;
              return (
                <li key={`${o.kind}-${o.entry.url}`} role="presentation">
                  {head && (
                    <p className="search-group" aria-hidden="true">
                      {head}
                    </p>
                  )}
                  <a
                    id={optId(i)}
                    role="option"
                    aria-selected={active === i}
                    href={o.entry.url}
                    tabIndex={-1}
                    className={`search-option${o.kind === 'suggested' ? ' is-suggested' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => onNavigate?.()}
                  >
                    <span className="search-option-section">{o.entry.section}</span>
                    <span className="search-option-title">{o.entry.title}</span>
                    <span className="search-option-desc">{o.entry.description}</span>
                  </a>
                </li>
              );
            })}
          </ul>
          {showAllLink && index && (
            <a href={`/search/?q=${encodeURIComponent(q.trim())}`} className="link link-arrow search-all" onClick={() => onNavigate?.()}>
              See all results
            </a>
          )}
        </div>
      )}
    </div>
  );
}
