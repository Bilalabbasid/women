import { SymptomsChecklist } from './symptoms-checklist';
import { getSiteData } from '@/lib/content/site-data';
import { isToolLive } from '@/lib/tools/logic';

/**
 * Renders the interactive part of a tool page in place of its ::tool{id}
 * marker. In production a tool appears only once its logic file is
 * clinician-approved; until then the guide text renders without the tool.
 */
export function ToolIsland({ id }: { id: string }) {
  if (!isToolLive(id)) {
    return (
      <p role="note" className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
        This tool is being reviewed by a clinician and will be available here soon.
      </p>
    );
  }
  if (id === 'symptoms-checklist') {
    return (
      <SymptomsChecklist liveUrls={[...getSiteData().knownPaths]} trackerLive={isToolLive('symptom-tracker')} />
    );
  }
  return null;
}
