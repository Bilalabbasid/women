import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getSiteData,
  renderPage,
  breadcrumbsFor,
  draftProblems,
  childrenOf,
  relatedFor,
} from '@/lib/content/site-data';
import { isPublishable } from '@/lib/content/gate';
import { buildMetadata } from '@/lib/seo/metadata';
import { contentPageLd, breadcrumbLd, faqLd, webApplicationLd } from '@/lib/seo/jsonld';
import { splitContentIslands } from '@/lib/content/markdown';
import { ToolIsland } from '@/components/tools/tool-island';
import { ProductSlotView } from '@/components/products/product-slot';
import { ProductBlock } from '@/components/products/product-block';
import { StandardNotice } from '@/components/site/standard-notice';
import { EmailCapture } from '@/components/site/email-capture';
import { NextSteps, BookmarkButton } from '@/components/site/next-steps';
import { isToolLive } from '@/lib/tools/logic';
import { JsonLd, Breadcrumbs } from '@/components/site/site-chrome';
import { GradeBadge, ReviewLine, References, ChangeLog, DraftBanner, Toc } from '@/components/site/evidence';
import { QuestionTools, SavedCopyNotice } from '@/components/site/client-islands';

/** Only pages in this build exist. Anything else is a real 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return getSiteData().pages.map((p) => ({ slug: p.url.split('/').filter(Boolean) }));
}

const urlFor = (slug: string[]) => `/${slug.join('/')}/`;

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getSiteData().byUrl.get(urlFor(slug));
  if (!page) return {};
  const { store } = getSiteData();
  return buildMetadata({
    title: page.fm.seo_title,
    description: page.fm.meta_description,
    path: page.url,
    // Drafts (dev/staging only) are always noindex.
    noindex: page.fm.noindex || !isPublishable(page, store),
    type: 'article',
    modified: page.fm.updated_at,
  });
}

export default async function ContentPageRoute({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const { byUrl, store } = getSiteData();
  const page = byUrl.get(urlFor(slug));
  if (!page) notFound();

  const { fm } = page;
  const rendered = renderPage(page);
  const approved = isPublishable(page, store);
  const problems = approved ? [] : draftProblems(page);
  const crumbs = breadcrumbsFor(page);
  const author = store.people.get(fm.author);
  const reviewer = fm.reviewer ? store.people.get(fm.reviewer) : undefined;
  const methodHref = byUrl.has('/evidence/how-we-grade/') ? '/evidence/how-we-grade/' : undefined;
  const children = fm.page_type === 'hub' ? childrenOf(page.url) : [];
  const related = relatedFor(page);
  const citationIds = [...rendered.citations, ...fm.sources.filter((s) => !rendered.citations.includes(s))];
  const faq = fm.faq ?? [];
  const parts = splitContentIslands(rendered.html);
  const toolIds = parts.flatMap((p) => (p.type === 'tool' ? [p.tool] : []));
  const ld = [
    contentPageLd(page, store),
    breadcrumbLd(crumbs),
    ...(faq.length ? [faqLd(faq)!] : []),
    // WebApplication only where the tool actually renders on this page.
    ...toolIds.filter((id) => isToolLive(id)).map(() => webApplicationLd({ name: fm.title, path: page.url, description: fm.meta_description })),
  ];

  return (
    <>
      {!approved && <DraftBanner problems={problems} />}
      <JsonLd data={ld} />
      <article className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Breadcrumbs crumbs={crumbs} />
          <BookmarkButton url={page.url} title={fm.title} />
        </div>
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl">{fm.title}</h1>
          <ReviewLine page={page} author={author} reviewer={reviewer} approved={approved} />
          {page.isMedical && <StandardNotice />}
          {fm.evidence_grade && (
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-[var(--color-ink-muted)]">Evidence:</span>
              <GradeBadge grade={fm.evidence_grade} methodHref={methodHref} />
            </p>
          )}
          {(fm.affiliate_disclosure || parts.some((p) => p.type === 'product')) && (
            <p role="note" className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-3 text-xs leading-relaxed text-[var(--color-ink-muted)]">
              <strong>Disclosure:</strong> this page contains paid links, which are labelled. As an Amazon Associate we earn from
              qualifying purchases. We may earn a commission if you use them. That never changes an evidence grade or a ranking.
            </p>
          )}
          {fm.audience_limits.length > 0 && (
            <div className="rounded-xl bg-[var(--color-accent-soft)] p-3">
              <p className="font-semibold">This page may not apply to you if:</p>
              <ul className="list-disc pl-6">
                {fm.audience_limits.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </header>

        <SavedCopyNotice reviewedAt={approved ? fm.reviewed_at : null} isMedical={page.isMedical} />
        <Toc headings={rendered.headings} />

        {parts.map((part, i) => {
          if (part.type === 'tool') return <ToolIsland key={`tool-${i}`} id={part.tool} />;
          if (part.type === 'product-slot') return <ProductSlotView key={`slot-${i}`} id={part.slot} />;
          if (part.type === 'product') return <ProductBlock key={`product-${i}`} id={part.product} />;
          // The opening paragraph is the page's stand-alone answer (symptom
          // "quick answer", does-it-work verdict, comparison "quick answer: ...").
          // Give it a distinct card so it reads as the answer at a glance,
          // without changing or duplicating any wording.
          const isLead = i === 0;
          return (
            <div
              key={`html-${i}`}
              className={
                isLead
                  ? 'prose [&>p:first-of-type]:rounded-xl [&>p:first-of-type]:border [&>p:first-of-type]:border-[var(--color-rule)] [&>p:first-of-type]:bg-[var(--color-paper-raised)] [&>p:first-of-type]:p-4 [&>p:first-of-type]:text-lg [&>p:first-of-type]:leading-relaxed'
                  : 'prose'
              }
              dangerouslySetInnerHTML={{ __html: part.html }}
            />
          );
        })}
        {rendered.questionLists > 0 && <QuestionTools />}

        <NextSteps />
        <EmailCapture title={`Get the ${fm.title.toLowerCase()} doctor question sheet`} />

        {children.length > 0 && (
          <section aria-labelledby="in-this-section" className="space-y-2">
            <h2 id="in-this-section" className="text-2xl">
              In this section
            </h2>
            <ul className="space-y-1">
              {children.map((c) => (
                <li key={c.url}>
                  <Link href={c.url} className="tap text-[var(--color-link)] underline">
                    {c.fm.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {faq.length > 0 && (
          <section aria-labelledby="faq" className="space-y-3">
            <h2 id="faq" className="text-2xl">
              Questions people ask
            </h2>
            <div className="space-y-3">
              {faq.map((f) => (
                <div key={f.q} className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
                  <h3 className="text-lg font-semibold">{f.q}</h3>
                  <p className="mt-1.5 text-[var(--color-ink-muted)]">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section aria-labelledby="related" className="space-y-2">
            <h2 id="related" className="text-2xl">
              Related pages
            </h2>
            <ul className="space-y-1">
              {related.map((r) => (
                <li key={r.url}>
                  <Link href={r.url} className="tap text-[var(--color-link)] underline">
                    {r.fm.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <References ids={citationIds} sources={store.sources} />
        <ChangeLog entries={fm.change_log} />
      </article>
    </>
  );
}
