import type { EvidenceGrade, PageType } from '@/lib/content/schema';
import { GradeMeter } from '@/components/ui/grade';

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
 * Article page top: editorial, not a banner. Kicker, H1, description, then one
 * quiet line of facts read from the page itself: its evidence grade (as a meter
 * with "What does this mean?"), how many sources it cites, and reading time.
 * Includes the slim reading-progress bar (CSS scroll-driven, no JavaScript).
 */
export function ArticleHero({
  section,
  pageType,
  title,
  description,
  grade,
  sourceCount,
  readMinutes,
}: {
  section: string;
  pageType: PageType;
  title: string;
  description: string;
  grade: EvidenceGrade | null;
  /** Kept for callers; the grade meter's explainer links to the method. */
  methodHref?: string;
  sourceCount: number;
  readMinutes: number;
}) {
  const scaleGrade = grade && grade !== 'per_option' ? grade : null;
  return (
    <header className="article-hero">
      <div className="reading-progress" aria-hidden="true" />
      <p className="kicker">
        {section} · {TYPE_LABELS[pageType]}
      </p>
      <h1 className="mt-2 max-w-[22ch] text-[length:var(--fs-h1)] leading-[1.08]">{title}</h1>
      <p className="mt-4 max-w-[var(--measure)] text-[length:var(--fs-lead)] leading-relaxed text-[var(--ink-muted)]">{description}</p>

      <div className="mt-6 flex flex-wrap items-start gap-x-8 gap-y-4 border-y border-[var(--rule)] py-4">
        {scaleGrade && (
          <div className="min-w-[13rem]">
            <p className="eyebrow mb-1.5">Evidence grade</p>
            <GradeMeter grade={scaleGrade} />
          </div>
        )}
        {grade === 'per_option' && (
          <div>
            <p className="eyebrow mb-1">Evidence</p>
            <p className="font-bold">Each option below has its own grade</p>
          </div>
        )}
        {sourceCount > 0 && (
          <div>
            <p className="eyebrow mb-1">Sources</p>
            <a href="#references" className="link">
              {sourceCount} cited
            </a>
          </div>
        )}
        <div>
          <p className="eyebrow mb-1">Reading time</p>
          <p className="font-bold">{readMinutes} min</p>
        </div>
      </div>
    </header>
  );
}
