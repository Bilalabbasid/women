import { SymptomsChecklist } from './symptoms-checklist';
import { StageGuide } from './stage-guide';
import { DoesItWorkChecker } from './does-it-work-checker';
import { TreatmentQuestionsBuilder } from './treatment-questions';
import { TwelveMonthCounter } from './twelve-month-counter';
import { getSiteData } from '@/lib/content/site-data';
import { isToolLive } from '@/lib/tools/logic';

/**
 * Renders the interactive part of a tool page in place of its ::tool{id}
 * marker. Every tool defined in content/_tools/ is rendered live.
 */
export function ToolIsland({ id }: { id: string }) {
  if (!isToolLive(id)) {
    return (
      <p role="note" className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
        This tool is being reviewed by a clinician and will be available here soon.
      </p>
    );
  }
  const liveUrls = [...getSiteData().knownPaths];
  if (id === 'symptoms-checklist') {
    return (
      <SymptomsChecklist liveUrls={liveUrls} trackerLive={isToolLive('symptom-tracker')} />
    );
  }
  if (id === 'stage-guide') {
    return <StageGuide />;
  }
  if (id === 'does-it-work-checker') {
    return <DoesItWorkChecker liveUrls={liveUrls} />;
  }
  if (id === 'treatment-questions') {
    return <TreatmentQuestionsBuilder />;
  }
  if (id === '12-month-counter') {
    return <TwelveMonthCounter />;
  }
  return null;
}
