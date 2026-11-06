import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { loadToolLogic } from '@/lib/tools/logic';
import { StageGuide } from '@/components/tools/stage-guide';
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

describe('StageGuide UI', () => {
  beforeEach(() => window.localStorage.clear());

  it('explains STRAW+10 early transition without diagnosing and clears data on delete', () => {
    render(<StageGuide />);
    fireEvent.click(screen.getByLabelText('45 or over'));
    fireEvent.click(screen.getByLabelText(/Shifting — cycle length has varied by 7 days or more/));
    const region = screen.getByRole('region', { name: /How guidelines describe your answers/i });
    expect(region.textContent).toMatch(/Early Menopausal Transition/i);
    expect(region.textContent).toMatch(/cannot diagnose/i);
    expect(region.textContent).not.toMatch(/\byou have\b|\byou should take\b/i);

    fireEvent.click(screen.getByRole('button', { name: 'Delete all my data' }));
    expect(window.localStorage.getItem('menoverdict_stage_guide_v1')).toBeNull();
  });

  it('shows both 988 (US) and Samaritans 116 123 (UK) when self-harm red flag is ticked', () => {
    render(<StageGuide />);
    fireEvent.click(screen.getByLabelText(/thoughts of harming yourself/i));
    const urgent = screen.getByRole('region', { name: 'Urgent guidance' });
    expect(urgent.textContent).toMatch(/988/);
    expect(urgent.textContent).toMatch(/116 123/);
  });
});

describe('DoesItWorkChecker UI', () => {
  beforeEach(() => window.localStorage.clear());

  it('filters evidence verdicts and saves shortlist items on device without prescribing', () => {
    render(<DoesItWorkChecker liveUrls={['/does-it-work/magnesium/']} />);
    const saveButtons = screen.getAllByRole('button', { name: 'Save to ask my doctor' });
    expect(saveButtons.length).toBeGreaterThan(5);
    fireEvent.click(saveButtons[0]);
    expect(window.localStorage.getItem('menoverdict_evidence_checker_v1')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Delete all my data' }));
    expect(window.localStorage.getItem('menoverdict_evidence_checker_v1')).toBeNull();
  });
});

describe('TreatmentQuestionsBuilder UI', () => {
  beforeEach(() => window.localStorage.clear());

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
  beforeEach(() => window.localStorage.clear());

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

