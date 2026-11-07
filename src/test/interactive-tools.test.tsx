import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { loadToolLogic } from '@/lib/tools/logic';
import { LocalDataService } from '@/lib/db/service';
import { ToolRecords } from '@/lib/storage/tool-records';
import { Periods } from '@/lib/storage/periods';

beforeEach(async () => {
  window.localStorage.clear();
  await LocalDataService.purgeAllData();
});
import { DoesItWorkChecker } from '@/components/tools/does-it-work-checker';
import { TreatmentQuestionsBuilder } from '@/components/tools/treatment-questions';
import { TwelveMonthCounter, calculateTwelveMonthWindow } from '@/components/tools/twelve-month-counter';

describe('tool logic registry', () => {
  it('loads all 6 expected tools with zero schema or file errors', () => {
    const { tools, errors } = loadToolLogic();
    expect(errors).toEqual([]);
    const ids = tools.map((t) => t.logic.id).sort();
    expect(ids).toEqual([
      '12-month-counter',
      'does-it-work-checker',
      'stage-guide',
      'symptom-tracker',
      'symptoms-checklist',
      'treatment-questions',
    ]);
  });
});

// StageGuide UI tests live in stage-guide.test.tsx.

describe('DoesItWorkChecker UI', () => {
  it('filters evidence verdicts and saves shortlist items on device without prescribing', async () => {
    render(<DoesItWorkChecker liveUrls={['/does-it-work/black-cohosh/']} />);
    const saveButtons = screen.getAllByRole('button', { name: 'Save to ask my doctor' });
    expect(saveButtons.length).toBeGreaterThan(5);
    fireEvent.click(saveButtons[0]);
    await waitFor(
      async () => expect((await ToolRecords.getDraft('does-it-work-checker'))?.data).toMatchObject({ bookmarkedIds: ['systemic-hrt'] }),
      { timeout: 2000 },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear my shortlist and filters' }));
    await waitFor(async () => expect(await ToolRecords.getDraft('does-it-work-checker')).toBeUndefined());
  });

  it('moves an old localStorage shortlist into IndexedDB on first visit', async () => {
    window.localStorage.setItem('menoverdict_evidence_checker_v1', JSON.stringify({ bookmarkedIds: ['cbt-hypnosis'] }));
    render(<DoesItWorkChecker liveUrls={[]} />);
    expect(await screen.findByRole('button', { name: 'Remove from my doctor list' }, { timeout: 4000 })).toBeInTheDocument();
    expect(window.localStorage.getItem('menoverdict_evidence_checker_v1')).toBeNull();
  });
});

describe('TreatmentQuestionsBuilder UI', () => {
  it('starts with nothing pre-ticked', () => {
    render(<TreatmentQuestionsBuilder />);
    for (const box of screen.getAllByRole('checkbox')) expect(box).not.toBeChecked();
  });

  it('renders printable appointment questions and triggers crisis help on self-harm notes', () => {
    render(<TreatmentQuestionsBuilder />);
    const notesInput = screen.getByLabelText(/Your own questions or personal health history/i);
    fireEvent.change(notesInput, { target: { value: 'I want to hurt myself' } });
    const urgent = screen.getByRole('region', { name: 'Urgent guidance' });
    expect(urgent.textContent).toMatch(/988/);
    expect(urgent.textContent).toMatch(/116 123/);
  });
});

describe('TwelveMonthCounter calculation and UI', () => {
  it('logs period start dates, counts from the most recent, and lets her edit and delete them', async () => {
    render(<TwelveMonthCounter />);
    await screen.findByText('No period dates logged yet.', undefined, { timeout: 4000 });
    const input = screen.getByLabelText('Period start date');

    fireEvent.change(input, { target: { value: '2026-01-05' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add this date' }));
    await screen.findByText(/Added January 5, 2026/);
    fireEvent.change(input, { target: { value: '2026-03-20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add this date' }));
    await screen.findByText(/74 days after the one before/);
    expect((await Periods.list()).map((p) => p.startDate)).toEqual(['2026-03-20', '2026-01-05']);
    expect(screen.getByText(/most recent, counting from here/)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '2026-03-20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add this date' }));
    await screen.findByText(/already in your list/);

    fireEvent.click(screen.getByRole('button', { name: /^Delete\s*March 20, 2026$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
    await waitFor(async () => expect((await Periods.list()).map((p) => p.startDate)).toEqual(['2026-01-05']));
  });

  it('calculates elapsed days and the 12-month anniversary date accurately', () => {
    const res = calculateTwelveMonthWindow('2025-10-01', new Date('2026-11-06T00:00:00Z'));
    expect(res.valid).toBe(true);
    expect(res.reachedTwelveMonths).toBe(true);
    expect(res.anniversaryIso).toBe('2026-10-01');
  });

  it('triggers urgent postmenopausal bleeding guidance when bleeding after 12 months is ticked', () => {
    render(<TwelveMonthCounter />);
    fireEvent.click(
      screen.getByLabelText(/I have had vaginal bleeding or spotting .* after going 12 months or more/i),
    );
    const urgent = screen.getByRole('region', { name: 'Urgent guidance' });
    expect(urgent.textContent).toMatch(/Bleeding after menopause/i);
    expect(urgent.textContent).toMatch(/checked by a doctor/i);
  });
});

