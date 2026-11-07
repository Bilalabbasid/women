import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocalDataService } from '@/lib/db/service';
import { localDateString, localDaysAgo } from '@/lib/utils/local-date';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/app/',
}));

import CheckinPage from '@/app/app/check-in/page';
import DashboardPage from '@/app/app/today/page';

beforeEach(async () => {
  await LocalDataService.purgeAllData();
  window.localStorage.clear();
  window.history.replaceState({}, '', '/app/check-in/');
});

describe('local dates', () => {
  it('uses her local calendar day, not the UTC date', () => {
    // 23:30 local time on Nov 6: the UTC date may already be Nov 7, but her entry belongs to Nov 6.
    const lateEvening = new Date(2026, 10, 6, 23, 30);
    expect(localDateString(lateEvening)).toBe('2026-11-06');
    expect(localDaysAgo(6, lateEvening)).toBe('2026-10-31');
    expect(localDaysAgo(0, lateEvening)).toBe('2026-11-06');
  });
});

describe('Check-in page', () => {
  it('opens the day given in ?date= and never carries one day’s answers into an empty day', async () => {
    await LocalDataService.saveCheckin({
      date: '2026-08-20',
      overallFeeling: 2,
      notes: 'Woke at 3am drenched',
      flow: 'heavy',
      symptoms: [{ symptomId: 'hot_flashes', name: 'Hot flashes', category: 'vasomotor', severity: 4 }],
    });
    window.history.replaceState({}, '', '/app/check-in/?date=2026-08-20');

    render(<CheckinPage />);
    const dateInput = screen.getByLabelText('Logging for') as HTMLInputElement;
    const notes = screen.getByLabelText(/^Note/) as HTMLTextAreaElement;
    await waitFor(() => expect(dateInput.value).toBe('2026-08-20'));
    await waitFor(() => expect(notes.value).toBe('Woke at 3am drenched'));

    fireEvent.change(dateInput, { target: { value: '2026-07-01' } });
    await waitFor(() => expect(dateInput.value).toBe('2026-07-01'));
    await waitFor(() => expect(notes.value).toBe(''));
  });

  it('shows a plain message instead of hanging when the save fails', async () => {
    const spy = vi
      .spyOn(LocalDataService, 'saveCheckin')
      .mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'QuotaExceededError' }));
    render(<CheckinPage />);
    const save = await screen.findByRole('button', { name: /^Save (today|this day|this week)/ });
    fireEvent.click(save);
    expect(await screen.findByRole('alert')).toHaveTextContent(/out of storage space/);
    expect(screen.getByRole('button', { name: /^Save (today|this day|this week)/ })).not.toBeDisabled();
    spy.mockRestore();
  });
});

describe('Today page quick feeling', () => {
  it('changes only the feeling and keeps everything else logged today', async () => {
    const today = localDateString();
    await LocalDataService.saveCheckin({
      date: today,
      overallFeeling: 2,
      notes: 'Headache from 2pm',
      flow: 'spotting',
      lifestyle: { caffeine: true },
      symptoms: [{ symptomId: 'headache', name: 'Headache', category: 'physical', severity: 3 }],
    });

    render(<DashboardPage />);
    // The five feeling levels are a radio group (one choice, arrow-key navigable).
    const great = await screen.findByRole('radio', { name: /Great/ });
    fireEvent.click(great);

    await waitFor(async () => expect((await LocalDataService.getCheckinByDate(today))?.overallFeeling).toBe(5));
    const saved = (await LocalDataService.getCheckinByDate(today))!;
    expect(saved.notes).toBe('Headache from 2pm');
    expect(saved.flow).toBe('spotting');
    expect(saved.lifestyle).toEqual({ caffeine: true });
    expect(saved.symptoms.map((s) => s.symptomId)).toEqual(['headache']);
    expect(saved.sleepHours).toBeUndefined(); // never invented
  });

  it('does not invent sleep or hot-flash numbers on a brand-new day', async () => {
    render(<DashboardPage />);
    fireEvent.click(await screen.findByRole('radio', { name: /Okay/ }));
    const today = localDateString();
    await waitFor(async () => expect(await LocalDataService.getCheckinByDate(today)).not.toBeNull());
    const saved = (await LocalDataService.getCheckinByDate(today))!;
    expect(saved.sleepHours).toBeUndefined();
    expect(saved.hotFlashCount).toBeUndefined();
  });
});

describe('Treatment log', () => {
  it('can remove a single logged dose without touching the plan', async () => {
    await LocalDataService.saveTreatment({
      id: 'trt1', name: 'Patch', type: 'patch', frequency: 'Twice weekly', startDate: '2026-01-01', active: true, createdAt: 1, updatedAt: 1,
    });
    const keep = await LocalDataService.logTreatmentEvent({ treatmentId: 'trt1', treatmentName: 'Patch', date: '2026-02-01', action: 'applied' });
    const oops = await LocalDataService.logTreatmentEvent({ treatmentId: 'trt1', treatmentName: 'Patch', date: '2026-02-02', action: 'applied' });
    await LocalDataService.deleteTreatmentEvent(oops);
    expect((await LocalDataService.getTreatmentEvents()).map((e) => e.id)).toEqual([keep]);
    expect(await LocalDataService.getTreatments()).toHaveLength(1);
  });
});
