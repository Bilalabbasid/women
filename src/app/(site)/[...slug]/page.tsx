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
  NAV_HUBS,
  CLUSTER_LABELS,
} from '@/lib/content/site-data';
import { HubHero, HubDirectory } from '@/components/site/hub-hero';
import { ArticleHero } from '@/components/site/article-hero';
import { ogImagePath, pinImagePath } from '@/lib/seo/social-image-route';
import { socialImageAlt } from '@/lib/seo/social-image';
import { isPublishable, isMedicallyReviewed, indexablePages } from '@/lib/content/gate';
import { buildMetadata } from '@/lib/seo/metadata';
import { contentPageLd, breadcrumbLd, faqLd, webApplicationLd } from '@/lib/seo/jsonld';
import { splitContentIslands } from '@/lib/content/markdown';
import { ToolIsland } from '@/components/tools/tool-island';
import { ProductSlotView } from '@/components/products/product-slot';
import { getProductSlot } from '@/lib/products/slots';
import { SourcesList } from '@/components/site/sources-list';
import { ProductBlock } from '@/components/products/product-block';
import { HonestyNotice } from '@/components/site/honesty-notice';
import { PRICES_CHECKED, formatCheckedDate } from '@/lib/site/honesty';
import { lastCheckedDate } from '@/lib/content/schema';
import { EmailCapture } from '@/components/site/email-capture';
import { RecentEvidenceUpdates } from '@/components/site/recent-updates';
import { UPDATES_URL } from '@/lib/content/updates';
import { NextSteps, BookmarkButton } from '@/components/site/next-steps';
import { isToolLive } from '@/lib/tools/logic';
import { JsonLd, Breadcrumbs } from '@/components/site/site-chrome';
import { GradeBadge, References, ChangeLog, DraftBanner, Toc, displayName } from '@/components/site/evidence';
import { QuestionTools, SavedCopyNotice } from '@/components/site/client-islands';
import { ToolHero, TOOL_HEROES } from '@/components/site/tool-hero';

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
    image: {
      path: ogImagePath(page.url),
      alt: socialImageAlt(page.fm.title, CLUSTER_LABELS[page.fm.cluster] ?? page.fm.cluster, page.fm.evidence_grade),
    },
    pinImagePath: pinImagePath(page.url),
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
  // Independent of `approved` (the publish gate) on purpose — never let "this page is
  // live" imply "a clinician reviewed it" (AGENTS.md rule 4). See gate.ts.
  const reviewed = isMedicallyReviewed(page, store);
  const problems = approved ? [] : draftProblems(page);
  const crumbs = breadcrumbsFor(page);
  const author = store.people.get(fm.author);
  const reviewer = fm.reviewer ? store.people.get(fm.reviewer) : undefined;
  const methodHref = byUrl.has('/evidence/how-we-grade/') ? '/evidence/how-we-grade/' : undefined;
  const isNavHub = (NAV_HUBS as readonly string[]).includes(page.url);
  const children = fm.page_type === 'hub' || isNavHub ? childrenOf(page.url) : [];
  const related = relatedFor(page);
  const citationIds = [...rendered.citations, ...fm.sources.filter((s) => !rendered.citations.includes(s))];
  const faq = fm.faq ?? [];
  const parts = splitContentIslands(rendered.html);
  const firstToolIndex = parts.findIndex((p) => p.type === 'tool' && isToolLive(p.tool));
  const hasTool = firstToolIndex >= 0;
  // Which paid-link networks actually appear on this page. The disclosure (and its
  // Amazon sentence) shows only for links really present, not for a frontmatter flag.
  const paidNetworks = new Set<'amazon' | 'other'>();
  for (const p of parts) {
    if (p.type === 'product') paidNetworks.add('amazon');
    if (p.type === 'product-slot') {
      const slot = getProductSlot(p.slot);
      const active = slot?.status === 'filled' ? (slot.products ?? []).filter((x) => x.active) : [];
      for (const prod of active) paidNetworks.add(/amazon\./i.test(prod.url) ? 'amazon' : 'other');
    }
  }
  if (/rel="[^"]*\bsponsored\b/.test(rendered.html)) paidNetworks.add('other');
  const toolHero = fm.page_type === 'tool' ? TOOL_HEROES[page.url] : undefined;
  const isArticle = !toolHero && !isNavHub;
  const sectionHeadings = rendered.headings.filter((h) => h.depth === 2 && h.id !== 'references');
  // The contents list moves to a sticky sidebar on wide screens, when there's enough to list.
  const showSidebar = isArticle && sectionHeadings.length >= 3;
  const readMinutes = Math.max(1, Math.ceil(rendered.text.split(/\s+/).length / 220));
  const toolHeroHref = toolHero?.appHref
    ? isToolLive('symptom-tracker') ? toolHero.appHref : null
    : hasTool ? '#tool' : null;
  // Every medical page except the nav hubs carries the short notice under its H1 and the
  // full "How this page was made" notice at the end. Nav hubs link to /about/ from the hero.
  const fullNotice = page.isMedical && !isNavHub;
  const checkedIso = lastCheckedDate(fm);
  const reviewerInfo =
    reviewed && reviewer && fm.reviewed_at
      ? { name: displayName(reviewer), credentials: reviewer.credentials ?? '', date: formatCheckedDate(fm.reviewed_at) }
      : undefined;
  // Shown where the page's own text starts, just below the hero (not inside it).
  const bodyNotice = fullNotice ? (
    <div className="space-y-1.5 border-b border-[var(--color-rule)] pb-4">
      <HonestyNotice variant="short" />
      {(fm.page_type === 'comparison' || fm.page_type === 'review') && (
        <p className="pl-6 text-sm text-[var(--color-ink-muted)]">{PRICES_CHECKED(formatCheckedDate(checkedIso))}</p>
      )}
    </div>
  ) : null;
  const ld = [
    contentPageLd(page, store),
    breadcrumbLd(crumbs),
    ...(faq.length ? [faqLd(faq)!] : []),
    // One WebApplication per tool guide: where the tool renders on the page, or the
    // tracker guide (its app lives under the private, noindexed /app/).
    ...(fm.page_type === 'tool' && (hasTool || (page.url === '/tools/symptom-tracker/' && isToolLive('symptom-tracker')))
      ? [webApplicationLd({ name: fm.title, path: page.url, description: fm.meta_description })]
      : []),
  ];

  const body = (
    <>
        {bodyNotice}
        <header className="space-y-3">
          {hasTool && !toolHero && (
            <p className="no-print">
              <a href="#tool" className="tap font-semibold text-[var(--color-link)] underline">
                Go straight to the tool ↓
              </a>
            </p>
          )}
          {fm.evidence_grade && !isArticle && (
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-[var(--color-ink-muted)]">Evidence:</span>
              <GradeBadge grade={fm.evidence_grade} methodHref={methodHref} />
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
        {/* On tool pages the table of contents moves below the tool, so the tool itself is reached first. */}
        {!hasTool && !isNavHub && (
          <div className={showSidebar ? 'lg:hidden' : undefined}>
            <Toc headings={rendered.headings} />
          </div>
        )}
        {isNavHub && children.length > 0 && <HubDirectory pages={children} heading="Guides in this section" />}

        {/* Out of the header so it isn't the very first thing under the H1, but still ahead of every
            part below — including the first paid link, if any — per the FTC-grounded "disclose before
            the link, not behind it" rule in AGENTS.md. */}
        {paidNetworks.size > 0 && (
          <p role="note" data-disclosure="affiliate" className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-3 text-xs leading-relaxed text-[var(--color-ink-muted)]">
            <strong>Disclosure:</strong> this page contains paid links, which are labeled. We may earn a commission if you use
            them. That never changes an evidence grade or a ranking.
            {paidNetworks.has('amazon') && ' As an Amazon Associate we earn from qualifying purchases.'} Once you click through,
            the retailer may set its own cookies.
          </p>
        )}

        {parts.map((part, i) => {
          if (part.type === 'tool') {
            const first = i === firstToolIndex;
            return (
              <div key={`tool-${i}`} id={first ? 'tool' : undefined} className="scroll-mt-4 space-y-6">
                <ToolIsland id={part.tool} />
                {first && <Toc headings={rendered.headings} />}
              </div>
            );
          }
          if (part.type === 'product-slot') return <ProductSlotView key={`slot-${i}`} id={part.slot} />;
          if (part.type === 'product') return <ProductBlock key={`product-${i}`} id={part.product} />;
          if (part.type === 'sources-list') return <SourcesList key={`sources-${i}`} sources={store.sources} pages={indexablePages(store)} />;
          // The opening paragraph is the page's stand-alone answer (symptom
          // "quick answer", does-it-work verdict, comparison "quick answer: ...").
          // Give it a distinct card so it reads as the answer at a glance,
          // without changing or duplicating any wording.
          const isLead = i === 0;
          const prose = 'prose steps';
          return (
            <div
              key={`html-${i}`}
              className={
                isLead
                  ? `${prose} [&>p:first-of-type]:rounded-xl [&>p:first-of-type]:border [&>p:first-of-type]:border-[var(--color-rule)] [&>p:first-of-type]:bg-[var(--color-paper-raised)] [&>p:first-of-type]:p-4 [&>p:first-of-type]:text-lg [&>p:first-of-type]:leading-relaxed`
                  : prose
              }
              dangerouslySetInnerHTML={{ __html: part.html }}
            />
          );
        })}
        {rendered.questionLists > 0 && <QuestionTools />}

        {page.url.startsWith('/evidence/') && page.url !== UPDATES_URL && <RecentEvidenceUpdates headingLevel={2} />}
        <NextSteps />
        {/* A "doctor question sheet" makes sense for a symptom/treatment page, not
            for a legal or about-the-site page ("Get the terms of use doctor question
            sheet" was a real, nonsensical result of running this on every page). */}
        {page.isMedical && <EmailCapture title="Get notified when we launch new tools" />}

        {children.length > 0 && !isNavHub && (
          <section aria-labelledby="in-this-section" className="space-y-3">
            <h2 id="in-this-section" className="text-2xl">
              In this section
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {children.map((c) => (
                <li key={c.url}>
                  <Link
                    href={c.url}
                    className="tap block rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-3 font-semibold text-[var(--color-link)] no-underline hover:bg-[var(--color-accent-soft)]"
                  >
                    {c.fm.title} →
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
          <section aria-labelledby="related" className="space-y-3">
            <h2 id="related" className="text-2xl">
              Related pages
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.url}>
                  <Link
                    href={r.url}
                    className="tap block rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-3 font-semibold text-[var(--color-link)] no-underline hover:bg-[var(--color-accent-soft)]"
                  >
                    {r.fm.title} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <References ids={citationIds} sources={store.sources} />
        <ChangeLog entries={fm.change_log} />
        {fullNotice && <HonestyNotice variant="full" lastChecked={checkedIso} reviewer={reviewerInfo} />}
        <HonestyNotice variant="footer" className="print-only text-sm" />
    </>
  );

  return (
    <>
      {!approved && <DraftBanner problems={problems} />}
      <JsonLd data={ld} />
      <article className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Breadcrumbs crumbs={crumbs} />
          <BookmarkButton url={page.url} title={fm.title} />
        </div>
        {toolHero && (
          <ToolHero
            config={toolHero}
            title={fm.title}
            description={fm.meta_description}
            primaryHref={toolHeroHref}
            guideHref={(() => {
              const h = rendered.headings.find((x) => x.depth === 2);
              return h ? `#${h.id}` : undefined;
            })()}
          />
        )}
        {isNavHub && (
          <HubHero
            eyebrow={`${CLUSTER_LABELS[fm.cluster] ?? fm.cluster} · Evidence-graded guides`}
            title={fm.title}
            description={fm.meta_description}
            guideCount={children.length}
            sections={sectionHeadings}
          />
        )}
        {isArticle && (
          <ArticleHero
            section={CLUSTER_LABELS[fm.cluster] ?? fm.cluster}
            pageType={fm.page_type}
            title={fm.title}
            description={fm.meta_description}
            grade={fm.evidence_grade ?? null}
            methodHref={methodHref}
            sourceCount={citationIds.length}
            readMinutes={readMinutes}
          />
        )}
        {showSidebar ? (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <div className="min-w-0 space-y-6">{body}</div>
            <aside className="no-print hidden lg:block">
              <div className="sticky top-6">
                <Toc headings={rendered.headings} compact />
              </div>
            </aside>
          </div>
        ) : (
          body
        )}
      </article>
    </>
  );
}
