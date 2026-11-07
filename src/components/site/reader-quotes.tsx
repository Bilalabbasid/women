import { readerQuotesFor } from '@/lib/content/quotes';
import '@/app/styles/misc.css';

/** "What readers told us". Renders nothing when there are no real quotes for this page. */
export function ReaderQuotes({ url }: { url: string }) {
  const quotes = readerQuotesFor(url);
  if (quotes.length === 0) return null;
  return (
    <section aria-labelledby="reader-quotes-heading" className="space-y-4">
      <h2 id="reader-quotes-heading" className="font-serif text-[length:var(--fs-h3)] font-semibold text-[var(--ink)]">
        What readers told us
      </h2>
      <ul className="grid gap-3" role="list">
        {quotes.map((q) => (
          <li key={`${q.received}-${q.text.slice(0, 20)}`}>
            <blockquote className="reader-quote">
              <p>{q.text}</p>
            </blockquote>
          </li>
        ))}
      </ul>
      <p className="text-[1rem] text-[var(--ink-muted)]">
        From readers who emailed us and agreed to have their words shown. Their experience is not medical evidence.
      </p>
    </section>
  );
}
