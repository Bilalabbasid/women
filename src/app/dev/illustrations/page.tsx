import type { Metadata } from 'next';
import {
  HotFlashDiagram,
  IlloBody,
  IlloCycle,
  IlloDoctor,
  IlloDoesItWork,
  IlloEmpty,
  IlloGettingCare,
  IlloIntimate,
  IlloMenopause,
  IlloMind,
  IlloMood,
  IlloPerimenopause,
  IlloPostmenopause,
  IlloSkinHair,
  IlloSleep,
  IlloTools,
  IlloTreatments,
  TransitionTimeline,
} from '@/components/ui/illustrations';

export const metadata: Metadata = {
  title: 'Illustrations',
  robots: { index: false, follow: false },
};

const SET = [
  { C: IlloPerimenopause, name: 'Perimenopause' },
  { C: IlloMenopause, name: 'Menopause' },
  { C: IlloPostmenopause, name: 'Postmenopause' },
  { C: IlloTreatments, name: 'Treatments' },
  { C: IlloDoesItWork, name: 'Does it work?' },
  { C: IlloGettingCare, name: 'Getting care' },
  { C: IlloTools, name: 'Tools' },
  { C: IlloSleep, name: 'Sleep & temperature' },
  { C: IlloMind, name: 'Mind & mood (talk)' },
  { C: IlloMood, name: 'Mood' },
  { C: IlloBody, name: 'Body & joints' },
  { C: IlloCycle, name: 'Cycle & bleeding' },
  { C: IlloSkinHair, name: 'Skin & hair' },
  { C: IlloIntimate, name: 'Intimate & bladder' },
  { C: IlloDoctor, name: 'Doctor / report' },
  { C: IlloEmpty, name: 'Empty state' },
];

/** Dev-only gallery of the illustration set and diagrams (noindex). */
export default function IllustrationsPage() {
  return (
    <main id="main" className="wrap grid gap-12 py-10">
      <div>
        <p className="kicker">Reading Room · illustration</p>
        <h1 className="mt-1 text-[length:var(--fs-h1)]">Illustrations</h1>
        <p className="mt-3 max-w-[var(--measure)] text-[var(--ink-muted)]">
          Abstract, warm, no faces. Line art in the accent, one brass detail, soft disc behind. Works in light and dark.
        </p>
      </div>

      <section aria-labelledby="set-h" className="grid gap-5">
        <h2 id="set-h" className="text-[length:var(--fs-h2)]">
          Section set
        </h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {SET.map(({ C, name }) => (
            <li key={name} className="card grid justify-items-center gap-2 text-center">
              <C className="h-24 w-24" />
              <span className="text-[1rem] font-bold leading-snug">{name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="tl-h" className="grid gap-5">
        <h2 id="tl-h" className="text-[length:var(--fs-h2)]">
          Transition timeline
        </h2>
        <div className="card">
          <TransitionTimeline />
        </div>
        <div className="card">
          <p className="eyebrow mb-3">With the quiz-result marker</p>
          <TransitionTimeline marker="perimenopause" />
        </div>
      </section>

      <section aria-labelledby="hf-h" className="grid gap-5">
        <h2 id="hf-h" className="text-[length:var(--fs-h2)]">
          How a hot flash happens
        </h2>
        <div className="card">
          <HotFlashDiagram />
        </div>
      </section>
    </main>
  );
}
