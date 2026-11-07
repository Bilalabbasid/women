import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { DoctorReport } from './doctor-report';
import { localDateString } from '../utils/local-date';
import { HONESTY_FOOTER, HONESTY_SHORT } from '../site/honesty';

/**
 * Builds the doctor report as a formatted PDF, entirely in the browser.
 * Nothing is uploaded: the file is created on the device and saved by the
 * browser. It contains only what she logged, no links of any kind and no
 * commercial content (content/_tools/symptom-tracker.yaml).
 */

const ACCENT: [number, number, number] = [31, 90, 76]; // MenoVerdict green #1F5A4C
const INK: [number, number, number] = [28, 35, 33];
const MUTED: [number, number, number] = [72, 81, 78];
const RULE: [number, number, number] = [220, 218, 210];
const MARGIN = 18;

const fmt = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** Plain-ASCII lines for the "at a glance" table. Same wording as the on-screen report. */
export function glanceRows(r: DoctorReport): Array<[string, string]> {
  const hf = r.hotFlashes
    ? `${r.hotFlashes.perDay} a day on average (${r.hotFlashes.total} logged${
        r.hotFlashes.maxInOneDay !== null ? `; most in one day: ${r.hotFlashes.maxInOneDay}` : ''
      })`
    : 'Not logged';
  const sleep = r.sleep
    ? `${r.sleep.averageHours} hours a night on average${
        r.sleep.dailyEntries > 0 ? `; woke at night on ${r.sleep.nightsWithWaking} of ${r.sleep.dailyEntries} daily entries` : ''
      }`
    : 'Not logged';
  const bleeding =
    r.bleeding.entries === 0
      ? 'None logged'
      : `${r.bleeding.entries} ${r.bleeding.entries === 1 ? 'entry' : 'entries'}, heaviest: ${r.bleeding.heaviest}` +
        (r.bleeding.dates.length ? ` (${r.bleeding.dates.map(fmt).join(', ')})` : '');
  const feeling = r.feelingAverage !== null ? `${r.feelingAverage} / 5 on average (my own rating)` : 'Not logged';
  return [
    ['Hot flashes', hf],
    ['Sleep', sleep],
    ['Bleeding', bleeding],
    ['Overall feeling', feeling],
  ];
}

export function buildDoctorReportPdf(report: DoctorReport, questions: string[], printedOn: string): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const width = doc.internal.pageSize.getWidth();
  const contentWidth = width - MARGIN * 2;
  let y = MARGIN;

  const heading = (text: string) => {
    if (y > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      y = MARGIN;
    }
    y += 8;
    doc.setFont('helvetica', 'bold').setFontSize(12.5).setTextColor(...ACCENT);
    doc.text(text, MARGIN, y);
    y += 2.5;
  };
  const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const tableBase = {
    // Bottom margin keeps tables clear of the honesty notice printed on every page.
    margin: { left: MARGIN, right: MARGIN, bottom: 30 },
    styles: { font: 'helvetica', fontSize: 10, textColor: INK, cellPadding: 2.2, lineColor: RULE, lineWidth: 0.2 },
    headStyles: { fillColor: ACCENT, textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' as const },
    alternateRowStyles: { fillColor: [247, 246, 242] as [number, number, number] },
  };

  // Header
  doc.setFont('helvetica', 'bold').setFontSize(8.5).setTextColor(...MUTED);
  doc.text('PATIENT-RECORDED SYMPTOM SUMMARY', MARGIN, y);
  y += 7;
  doc.setFont('helvetica', 'bold').setFontSize(19).setTextColor(...INK);
  doc.text('Menopause symptom log', MARGIN, y);
  y += 7;
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...MUTED);
  const coverage =
    `${fmt(report.startDate)} to ${fmt(report.endDate)}  |  ${report.entries} ${report.entries === 1 ? 'entry' : 'entries'}` +
    (report.weeklyEntries > 0 ? ` (${report.dailyEntries} daily, ${report.weeklyEntries} weekly)` : '') +
    ` covering ${report.daysCovered} of ${report.windowDays} days  |  Printed ${fmt(printedOn)}`;
  doc.text(doc.splitTextToSize(coverage, contentWidth), MARGIN, y);
  y += 6;

  // Notice box
  const notice =
    'Recorded by me on my own device. Ratings are my own (1 = mild, 5 = severe). This is not a validated scale and not a diagnosis.';
  const noticeLines = doc.splitTextToSize(notice, contentWidth - 8);
  const boxH = noticeLines.length * 4.6 + 5;
  doc.setFillColor(230, 239, 235).setDrawColor(...RULE).roundedRect(MARGIN, y, contentWidth, boxH, 2, 2, 'FD');
  doc.setFontSize(9.5).setTextColor(...INK);
  doc.text(noticeLines, MARGIN + 4, y + 5.5);
  y += boxH + 3;

  // Symptoms
  heading('Symptoms, most frequent first');
  if (report.entries === 0 || report.symptoms.length === 0) {
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...MUTED);
    y += 5;
    doc.text(report.entries === 0 ? 'No entries in this period.' : 'No symptoms logged.', MARGIN, y);
    y += 3;
  } else {
    autoTable(doc, {
      ...tableBase,
      startY: y + 1,
      head: [['Symptom', 'Entries', 'Average rating']],
      body: report.symptoms.map((s) => [s.name, `${s.count} of ${report.entries} (${s.frequencyPercent}%)`, `${s.averageSeverity} / 5`]),
      columnStyles: { 1: { cellWidth: 46 }, 2: { cellWidth: 36 } },
    });
    y = lastY();
  }

  // At a glance
  heading('Hot flashes, sleep and bleeding');
  autoTable(doc, {
    ...tableBase,
    startY: y + 1,
    body: glanceRows(report),
    columnStyles: { 0: { cellWidth: 38, fontStyle: 'bold' } },
  });
  y = lastY();

  // Treatments
  heading('Current treatments, as I recorded them');
  if (report.treatments.length === 0) {
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...MUTED);
    y += 5;
    doc.text('None recorded.', MARGIN, y);
    y += 3;
  } else {
    autoTable(doc, {
      ...tableBase,
      startY: y + 1,
      head: [['Treatment', 'As recorded', 'Since']],
      body: report.treatments.map((t) => [t.name, [t.dosage, t.frequency].filter(Boolean).join(', ') || '-', t.startDate ? fmt(t.startDate) : '-']),
      columnStyles: { 2: { cellWidth: 32 } },
    });
    y = lastY();
  }

  // Questions
  heading('My questions');
  doc.setFont('helvetica', 'normal').setFontSize(10.5).setTextColor(...INK);
  y += 5;
  if (questions.length === 0) {
    doc.setTextColor(...MUTED).text('No questions added.', MARGIN, y);
    y += 3;
  } else {
    questions.forEach((q, i) => {
      const lines = doc.splitTextToSize(q, contentWidth - 8);
      if (y + lines.length * 5 > doc.internal.pageSize.getHeight() - 24) {
        doc.addPage();
        y = MARGIN + 4;
      }
      doc.text(`${i + 1}.`, MARGIN, y);
      doc.text(lines, MARGIN + 7, y);
      y += lines.length * 5 + 1.5;
    });
  }

  // Space for the appointment
  heading('Notes from my appointment');
  doc.setDrawColor(...RULE);
  for (let i = 0; i < 4 && y + 9 < doc.internal.pageSize.getHeight() - 32; i++) {
    y += 9;
    doc.line(MARGIN, y, width - MARGIN, y);
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    const h = doc.internal.pageSize.getHeight();
    // The honesty notice (short line and footer line) on every page.
    doc.setDrawColor(...RULE).line(MARGIN, h - 25, width - MARGIN, h - 25);
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...MUTED);
    doc.text(doc.splitTextToSize(`${HONESTY_SHORT.text} ${HONESTY_FOOTER}`, contentWidth), MARGIN, h - 21);
    doc.setFontSize(8.5);
    doc.text(`Recorded by me with the MenoVerdict tracker. Not a diagnosis.  Printed ${fmt(printedOn)}.`, MARGIN, h - 10);
    doc.text(`Page ${p} of ${pages}`, width - MARGIN, h - 10, { align: 'right' });
  }

  return doc;
}

/** Builds the PDF and saves it. The file never leaves the device. */
export function downloadDoctorReportPdf(report: DoctorReport, questions: string[]): void {
  const today = localDateString();
  buildDoctorReportPdf(report, questions, today).save(`menoverdict-doctor-report-${today}.pdf`);
}
