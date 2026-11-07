import Link from 'next/link';
import { BookOpen, Clock, Scale } from 'lucide-react';
import type { EvidenceGrade, PageType } from '@/lib/content/schema';
import { HeroPanel, heroEyebrow, heroTitle, heroLead } from './hero-panel';
import { GradeBadge, GradeAiNote } from './evidence';

const TYPE_LABELS: Record<PageType, string> = {
  hub: 'Overview',
  symptom: 'Symptom guide',
  treatment: 'Treatment guide',
  does_it_work: 'Evidence verdict',
  comparison: 'Comparison',
  review: 'Review',
  guide: 'Guide',
  tool: 'Tool guide',
  group: 'Specific situation',
  evidence: 'How we work',
  legal: 'Legal',
  about: 'About us',
};

/**
 * Hero for every article page. The key-facts card only shows facts read from
 * the page itself: its evidence grade, how many sources it cites, and a
 * reading time computed from its own word count.
 */
export function ArticleHero({
  section,
  pageType,
  title,
  description,
  grade,
  methodHref,
  sourceCount,
  readMinutes,
}: {
  section: string;
  pageType: PageType;
  title: string;
  description: string;
  grade: EvidenceGrade | null;
  methodHref?: string;
  sourceCount: number;
  readMinutes: number;
}) {
  const facts = grade || sourceCount > 0;

  return (
    <HeroPanel>
      <div className={`grid items-center gap-8 ${facts ? 'md:grid-cols-[3fr_2fr]' : ''}`}>
        <div className="space-y-4">
          <p className={heroEyebrow}>
            {section} · {TYPE_LABELS[pageType]}
          </p>
          <h1 className={heroTitle}>{title}</h1>
          <p className={heroLead}>{description}</p>
          {!facts && (
            <p className="inline-flex items-center gap-2 text-sm text-[#cfe2da]">
              <Clock aria-hidden="true" className="h-4 w-4" /> {readMinutes} min read
            </p>
          )}
        </div>

        {facts && (
          <div className="rounded-2xl bg-[var(--paper-raised)] p-5 text-[var(--color-ink)] shadow-xl shadow-black/20 sm:p-6">
          <dl className="space-y-4">
            {grade && (
              <div className="space-y-1.5">
                <dt className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-muted)]">
                  <Scale aria-hidden="true" className="h-4 w-4 text-[var(--color-accent)]" /> Evidence grade
                </dt>
                <dd>
                  <GradeBadge grade={grade} methodHref={methodHref} />
                  <span className="mt-1.5 block">
                    <GradeAiNote methodHref={methodHref} />
                  </span>
                </dd>
              </div>
            )}
            {sourceCount > 0 && (
              <div
                className={`flex items-center justify-between gap-3 ${grade ? 'border-t border-[var(--color-rule)] pt-3' : ''}`}
              >
                <dt className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-muted)]">
                  <BookOpen aria-hidden="true" className="h-4 w-4 text-[var(--color-accent)]" /> Sources cited
                </dt>
                <dd>
                  <a href="#references" className="font-serif text-lg font-semibold text-[var(--color-link)] underline">
                    {sourceCount}
                  </a>
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--color-rule)] pt-3">
              <dt className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-muted)]">
                <Clock aria-hidden="true" className="h-4 w-4 text-[var(--color-accent)]" /> Reading time
              </dt>
              <dd className="font-serif text-lg font-semibold">{readMinutes} min</dd>
            </div>
          </dl>
            {methodHref && grade && (
              <p className="mt-4 border-t border-[var(--color-rule)] pt-3 text-sm text-[var(--color-ink-muted)]">
                Grades come from the published evidence, and nobody pays to be graded.{' '}
                <Link href={methodHref} className="font-semibold text-[var(--color-link)] underline">
                  How we grade
                </Link>
              </p>
            )}
          </div>
        )}
      </div>
    </HeroPanel>
  );
}
