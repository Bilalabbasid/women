import { readerQuotesFor } from '@/lib/content/quotes';

/** "What readers told us". Renders nothing when there are no real quotes for this page. */
export function ReaderQuotes({ url }: { url: string }) {
  const quotes = readerQuotesFor(url);
  if (quotes.length === 0) return null;
  return (
    <section aria-labelledby="reader-quotes-heading" className="space-y-3">
      <h2 id="reader-quotes-heading" className="font-serif text-2xl font-semibold text-[var(--color-ink)]">
        What readers told us
      </h2>
      <ul className="space-y-3">
        {quotes.map((q) => (
          <li key={`${q.received}-${q.text.slice(0, 20)}`}>
            <blockquote className="border-l-4 border-[var(--color-accent)] pl-4 italic">
              <p>&ldquo;{q.text}&rdquo;</p>
            </blockquote>
          </li>
        ))}
      </ul>
      <p className="text-sm text-[var(--color-ink-muted)]">
        From readers who emailed us and agreed to have their words shown. Their experience is not medical evidence.
      </p>
    </section>
  );
}
