import { jsPDF } from 'jspdf';
import { HONESTY_FOOTER, HONESTY_SHORT } from '../site/honesty';
import { localDateString } from '../utils/local-date';

/**
 * Small on-device PDFs for the public tools: the symptoms checklist, the
 * 10-minute appointment kit and the stage-quiz summary. Built in the browser and
 * saved by it; nothing is uploaded, and nothing is ever gated behind an email.
 * Every page carries the honesty notice.
 */

export type PdfBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[]; numbered?: boolean }
  | { kind: 'lines'; count: number; label?: string };

export interface SimplePdf {
  eyebrow: string;
  title: string;
  intro?: string;
  blocks: PdfBlock[];
  /** Short line at the foot of each page, e.g. "Ticked by me with the MenoVerdict checklist." */
  footerNote: string;
}

const ACCENT: [number, number, number] = [31, 90, 76];
const INK: [number, number, number] = [28, 35, 33];
const MUTED: [number, number, number] = [72, 81, 78];
const RULE: [number, number, number] = [220, 218, 210];
const MARGIN = 18;
const FOOTER_SPACE = 30;

const fmt = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export function buildSimplePdf(spec: SimplePdf, printedOn: string = localDateString()): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const contentWidth = width - MARGIN * 2;
  let y = MARGIN;

  const room = (needed: number) => {
    if (y + needed > height - FOOTER_SPACE) {
      doc.addPage();
      y = MARGIN + 4;
    }
  };
  const write = (text: string, size: number, opts: { bold?: boolean; color?: [number, number, number]; indent?: number; gap?: number } = {}) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal').setFontSize(size).setTextColor(...(opts.color ?? INK));
    const lines = doc.splitTextToSize(text, contentWidth - (opts.indent ?? 0));
    const lh = size * 0.45;
    room(lines.length * lh);
    doc.text(lines, MARGIN + (opts.indent ?? 0), y);
    y += lines.length * lh + (opts.gap ?? 2);
  };

  write(spec.eyebrow.toUpperCase(), 8.5, { bold: true, color: MUTED, gap: 4 });
  write(spec.title, 19, { bold: true, gap: 3 });
  if (spec.intro) write(spec.intro, 10, { color: MUTED, gap: 3 });

  for (const b of spec.blocks) {
    if (b.kind === 'heading') {
      y += 4;
      room(12);
      write(b.text, 12.5, { bold: true, color: ACCENT, gap: 2 });
    } else if (b.kind === 'paragraph') {
      write(b.text, 10.5, { gap: 3 });
    } else if (b.kind === 'list') {
      b.items.forEach((item, i) => {
        doc.setFont('helvetica', 'normal').setFontSize(10.5).setTextColor(...INK);
        const lines = doc.splitTextToSize(item, contentWidth - 8);
        room(lines.length * 4.8);
        doc.text(b.numbered ? `${i + 1}.` : '-', MARGIN, y);
        doc.text(lines, MARGIN + 7, y);
        y += lines.length * 4.8 + 1.4;
      });
      y += 1;
    } else {
      if (b.label) write(b.label, 10, { color: MUTED, gap: 0 });
      doc.setDrawColor(...RULE);
      for (let i = 0; i < b.count; i++) {
        room(9);
        y += 8;
        doc.line(MARGIN, y, width - MARGIN, y);
      }
      y += 4;
    }
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...RULE).line(MARGIN, height - 25, width - MARGIN, height - 25);
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...MUTED);
    doc.text(doc.splitTextToSize(`${HONESTY_SHORT.text} ${HONESTY_FOOTER}`, contentWidth), MARGIN, height - 21);
    doc.setFontSize(8.5);
    doc.text(`${spec.footerNote}  Printed ${fmt(printedOn)}.`, MARGIN, height - 10);
    doc.text(`Page ${p} of ${pages}`, width - MARGIN, height - 10, { align: 'right' });
  }
  return doc;
}

export function downloadSimplePdf(spec: SimplePdf, fileStem: string): void {
  const today = localDateString();
  buildSimplePdf(spec, today).save(`menoverdict-${fileStem}-${today}.pdf`);
}

/** The ticked symptoms, grouped as on screen. */
export function checklistPdf(groups: Array<{ label: string; items: string[] }>): SimplePdf {
  const withItems = groups.filter((g) => g.items.length > 0);
  const total = withItems.reduce((n, g) => n + g.items.length, 0);
  return {
    eyebrow: 'My symptoms checklist',
    title: 'Symptoms I have noticed',
    intro: `${total} symptom${total === 1 ? '' : 's'} ticked. These are my own observations, to talk through with a clinician. A list like this can't say what is causing them.`,
    blocks: [
      ...withItems.flatMap((g): PdfBlock[] => [
        { kind: 'heading', text: g.label },
        { kind: 'list', items: g.items },
      ]),
      { kind: 'heading', text: 'Notes' },
      { kind: 'lines', count: 4 },
    ],
    footerNote: 'Ticked by me with the MenoVerdict symptoms checklist. Not a diagnosis.',
  };
}

/**
 * The 10-minute appointment kit: what to have ready, her chosen questions, and
 * space for answers. It holds only what she typed or picked.
 */
export function appointmentKitPdf(topics: Array<{ label: string; questions: string[] }>, ownNotes: string): SimplePdf {
  const blocks: PdfBlock[] = [
    { kind: 'heading', text: 'Before I go in' },
    {
      kind: 'list',
      items: [
        'My three main symptoms, starting with the one that bothers me most.',
        'When they started, and how often they happen.',
        'The date of my last period, if I still have them.',
        'Every medicine, supplement and remedy I take, with the dose.',
        'What I have already tried, and what happened.',
        'The one thing I most want to leave the appointment with.',
      ],
    },
    { kind: 'lines', count: 3, label: 'My three main symptoms' },
    { kind: 'lines', count: 2, label: 'Medicines and supplements I take' },
  ];
  if (topics.length > 0) {
    blocks.push({ kind: 'heading', text: 'My questions' });
    for (const t of topics) blocks.push({ kind: 'paragraph', text: t.label }, { kind: 'list', items: t.questions, numbered: true });
  }
  if (ownNotes.trim()) blocks.push({ kind: 'heading', text: 'My own questions and context' }, { kind: 'paragraph', text: ownNotes.trim() });
  blocks.push({ kind: 'heading', text: 'What we agreed' }, { kind: 'lines', count: 5 });
  return {
    eyebrow: 'My 10-minute appointment kit',
    title: 'Ready for my appointment',
    intro: 'Short appointments go further with a plan. Fill in the lines before you go, and bring this page.',
    blocks,
    footerNote: 'Prepared by me with MenoVerdict. Not medical advice.',
  };
}

/** The stage quiz result: her answers and the stage it points to, with its limits. */
export function quizSummaryPdf(result: { stage: string; explanation: string; answers: Array<[string, string]>; caveat: string }): SimplePdf {
  return {
    eyebrow: 'My stage quiz summary',
    title: result.stage,
    intro: result.explanation,
    blocks: [
      { kind: 'heading', text: 'My answers' },
      { kind: 'list', items: result.answers.map(([q, a]) => `${q} ${a}`) },
      { kind: 'heading', text: 'What this can and cannot tell me' },
      { kind: 'paragraph', text: result.caveat },
      { kind: 'heading', text: 'Notes' },
      { kind: 'lines', count: 4 },
    ],
    footerNote: 'My answers to the MenoVerdict stage quiz. Not a diagnosis.',
  };
}
