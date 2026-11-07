import { describe, it, expect } from 'vitest';
import { appointmentKitPdf, buildSimplePdf, checklistPdf, quizSummaryPdf } from '@/lib/tools/simple-pdf';
import { HONESTY_FOOTER } from '@/lib/site/honesty';

describe('on-device PDFs', () => {
  const long = Array.from({ length: 60 }, (_, i) => `Question number ${i + 1} about something worth asking`);
  const specs = {
    checklist: checklistPdf([{ label: 'Sleep', items: ['Waking at night', 'Night sweats'] }, { label: 'Mood', items: [] }]),
    kit: appointmentKitPdf([{ label: 'Hormone therapy', questions: long }], 'My own note'),
    quiz: quizSummaryPdf({ stage: 'Early transition', explanation: 'x', answers: [['Age?', '45 or over']], caveat: 'Not a diagnosis.' }),
  };

  it('builds each PDF, multi-page where needed', () => {
    for (const spec of Object.values(specs)) expect(buildSimplePdf(spec, '2026-11-07').getNumberOfPages()).toBeGreaterThan(0);
    expect(buildSimplePdf(specs.kit, '2026-11-07').getNumberOfPages()).toBeGreaterThan(1);
  });

  it('prints the honesty notice on every page', () => {
    const doc = buildSimplePdf(specs.kit, '2026-11-07');
    const marker = HONESTY_FOOTER.slice(0, 20);
    const raw = doc.output();
    const count = raw.split(marker).length - 1;
    expect(count).toBeGreaterThanOrEqual(doc.getNumberOfPages());
  });

  it('leaves out empty checklist groups', () => {
    const headings = specs.checklist.blocks.filter((b) => b.kind === 'heading').map((b) => (b as { text: string }).text);
    expect(headings).toEqual(['Sleep', 'Notes']);
  });
});
