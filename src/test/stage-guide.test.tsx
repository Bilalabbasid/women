import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { LocalDataService } from '@/lib/db/service';
import { ToolRecords } from '@/lib/storage/tool-records';
import { StageGuide } from '@/components/tools/stage-guide';

beforeEach(async () => {
  window.localStorage.clear();
  await LocalDataService.purgeAllData();
});

const next = () => fireEvent.click(screen.getByRole('button', { name: /^(Next|See my result)$/ }));
const pick = (label: RegExp | string) => {
  fireEvent.click(screen.getByLabelText(label));
  next();
};

/** 45+, natural periods, cycle length shifting by 7+ days, new night sweats, no red flags. */
function answerEarlyTransition() {
  pick('45 or over');
  pick(/^None of these: I have a uterus/);
  pick(/^No, I have had a period/);
  pick('No');
  pick(/^By 7 days or more/);
  pick('Yes');
  pick('None of these');
}

describe('StageGuide quiz UI', () => {
  it('asks one question per screen with progress, Back, and focus on the question heading', () => {
    render(<StageGuide liveUrls={[]} trackerLive={false} />);
    expect(screen.getByText('Question 1 of 7')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'How old are you?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();

    pick('45 or over');
    const heading = screen.getByRole('heading', { name: 'Does anything below affect your periods?' });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByText('Question 2 of 7')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText('45 or over')).toBeChecked();
  });

  it('shows the early-transition result with limits, without diagnosing, and autosaves on device', async () => {
    render(<StageGuide liveUrls={['/perimenopause/stages/']} trackerLive={false} />);
    answerEarlyTransition();
    const region = screen.getByRole('region', { name: 'Your result' });
    expect(document.activeElement).toBe(within(region).getByRole('heading', { name: 'Your result' }));
    expect(region.textContent).toMatch(/early menopausal transition/i);
    expect(region.textContent).toMatch(/What NICE NG23 says at 45 and over/);
    expect(region.textContent).toMatch(/not a diagnosis/i);
    expect(region.textContent).toMatch(/pregnancy, thyroid/);
    expect(region.textContent).not.toMatch(/\byou have\b|\byou should take\b/i);
    expect(within(region).getByRole('link', { name: 'The stages of perimenopause' })).toHaveAttribute('href', '/perimenopause/stages/');
    // Links to pages that aren't live, and the tracker when it isn't live, are not shown.
    expect(within(region).queryByRole('link', { name: /Irregular periods/ })).toBeNull();
    expect(within(region).queryByRole('link', { name: 'Install the app' })).toBeNull();
    expect(within(region).getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
    expect(within(region).getByRole('button', { name: /Print/ })).toBeInTheDocument();

    await waitFor(
      async () => expect((await ToolRecords.getDraft('stage-guide'))?.data).toMatchObject({ ageGroup: '45_plus', step: 'result' }),
      { timeout: 2000 },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear my answers' }));
    await waitFor(async () => expect(await ToolRecords.getDraft('stage-guide')).toBeUndefined());
    expect(screen.getByText('Question 1 of 7')).toBeInTheDocument();
  });

  it('links the symptom tracker and app install only when the tracker is live', () => {
    render(<StageGuide liveUrls={[]} trackerLive />);
    answerEarlyTransition();
    const region = screen.getByRole('region', { name: 'Your result' });
    expect(within(region).getByRole('link', { name: 'Install the app' })).toHaveAttribute('href', '/app/install/');
    expect(within(region).getByRole('link', { name: /Track your periods/ })).toHaveAttribute('href', '/tools/symptom-tracker/');
  });

  it('skips the period questions for hormonal contraception', () => {
    render(<StageGuide liveUrls={[]} />);
    pick('40 to 44');
    pick(/hormonal IUD/);
    expect(screen.getByText('Question 3 of 4')).toBeInTheDocument();
    pick('No');
    pick('None of these');
    expect(screen.getByRole('region', { name: 'Your result' }).textContent).toMatch(/period-based stages don’t apply/);
  });

  it('opens an old saved answer set from the one-page guide without crashing', async () => {
    await ToolRecords.saveDraft('stage-guide', { ageGroup: '45_plus', cycleContext: 'natural_cycles', cyclePattern: 'regular', hasVasomotor: false, redFlags: [] });
    render(<StageGuide liveUrls={[]} />);
    // The old guide had no hot-flash "No" or "None of these", so she resumes at the hot flash question.
    expect(await screen.findByRole('group', { name: 'Have hot flashes or night sweats started recently?' }, { timeout: 4000 })).toBeInTheDocument();
  });

  it('restores saved answers after a reload and keeps a dated history entry', async () => {
    const { unmount } = render(<StageGuide liveUrls={[]} />);
    answerEarlyTransition();
    await waitFor(async () => expect((await ToolRecords.getDraft('stage-guide'))?.data).toMatchObject({ step: 'result' }), { timeout: 2000 });

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-05-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save this answer set' }));
    await screen.findByText(/Saved your answer set for May 1, 2026/);

    unmount();
    cleanup();
    render(<StageGuide liveUrls={[]} />);
    expect(await screen.findByRole('region', { name: 'Your result' }, { timeout: 4000 })).toBeInTheDocument();
    expect(await screen.findByText('May 1, 2026', undefined, { timeout: 4000 })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Delete\s*the answer set from May 1, 2026$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
    await waitFor(async () => expect(await ToolRecords.listEntries('stage-guide')).toEqual([]));
  });

  it('shows urgent guidance, with 988 (US) and Samaritans 116 123 (UK), as soon as the self-harm red flag is ticked', () => {
    render(<StageGuide liveUrls={[]} />);
    pick('45 or over');
    pick(/hysterectomy/);
    pick('No');
    fireEvent.click(screen.getByLabelText(/thoughts of harming yourself/i));
    const urgent = screen.getByRole('region', { name: 'Urgent guidance' });
    expect(urgent.textContent).toMatch(/988/);
    expect(urgent.textContent).toMatch(/116 123/);
    next();
    expect(within(screen.getByRole('region', { name: 'Your result' })).getByRole('region', { name: 'Urgent guidance' })).toBeInTheDocument();
  });

  it('shows postmenopausal bleeding guidance first on the result', () => {
    render(<StageGuide liveUrls={[]} />);
    pick('45 or over');
    pick(/^None of these: I have a uterus/);
    pick(/^Yes, no period/);
    pick('No');
    pick(/after 12 months or more without a period/);
    const region = screen.getByRole('region', { name: 'Your result' });
    const urgent = within(region).getByRole('region', { name: 'Urgent guidance' });
    expect(urgent.textContent).toMatch(/Bleeding after menopause/);
    expect(region.textContent!.indexOf('Bleeding after menopause')).toBeLessThan(region.textContent!.indexOf('resemble postmenopause'));
  });

  it('under 40 leads with the premature ovarian insufficiency note', () => {
    render(<StageGuide liveUrls={[]} />);
    pick('Under 40');
    pick(/^None of these: I have a uterus/);
    pick(/^No, I have had a period/);
    pick(/^Yes, at least once/);
    pick('Yes');
    pick('None of these');
    expect(screen.getByRole('region', { name: 'Your result' }).textContent).toMatch(/Under 40: ask a clinician about premature ovarian insufficiency/);
  });
});
