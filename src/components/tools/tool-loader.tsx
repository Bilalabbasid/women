'use client';

import dynamic from 'next/dynamic';

/**
 * Loads each tool's code only on the page that shows it. Imported statically,
 * all five tools (and the IndexedDB library they share) shipped with every
 * article. Each tool is still server-rendered; only its JavaScript is split.
 */
const SymptomsChecklist = dynamic(() => import('./symptoms-checklist').then((m) => m.SymptomsChecklist));
const StageGuide = dynamic(() => import('./stage-guide').then((m) => m.StageGuide));
const DoesItWorkChecker = dynamic(() => import('./does-it-work-checker').then((m) => m.DoesItWorkChecker));
const TreatmentQuestionsBuilder = dynamic(() => import('./treatment-questions').then((m) => m.TreatmentQuestionsBuilder));
const TwelveMonthCounter = dynamic(() => import('./twelve-month-counter').then((m) => m.TwelveMonthCounter));

export function ToolLoader({ id, liveUrls, trackerLive }: { id: string; liveUrls: string[]; trackerLive: boolean }) {
  switch (id) {
    case 'symptoms-checklist':
      return <SymptomsChecklist liveUrls={liveUrls} trackerLive={trackerLive} />;
    case 'stage-guide':
      return <StageGuide liveUrls={liveUrls} trackerLive={trackerLive} />;
    case 'does-it-work-checker':
      return <DoesItWorkChecker liveUrls={liveUrls} />;
    case 'treatment-questions':
      return <TreatmentQuestionsBuilder />;
    case '12-month-counter':
      return <TwelveMonthCounter />;
    default:
      return null;
  }
}
