import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SymptomsChecklist } from '@/components/tools/symptoms-checklist';
import { ALL_CATALOG_ITEMS, triggerIdsFor, trackerIdsFor } from '@/lib/tools/symptom-catalog';
import { STANDARD_SYMPTOMS } from '@/lib/config/symptoms';
import { parseKeywordMap } from '@/lib/plan/keyword-map';
import { evaluateUrgentTriggers } from '@/lib/safety/urgent-triggers';

describe('symptom catalogue', () => {
  const map = parseKeywordMap(fs.readFileSync(path.join(process.cwd(), 'content', '_plan', 'keyword-map.csv'), 'utf8')).rows;

  it('has one item for every symptom page in the keyword map, and only planned URLs', () => {
    const symptomPages = map.filter((r) => r.page_type === 'symptom').map((r) => r.url).sort();
    const catalogSymptomUrls = ALL_CATALOG_ITEMS.filter((i) => i.url.startsWith('/symptoms/')).map((i) => i.url).sort();
    expect([...new Set(catalogSymptomUrls)]).toEqual(symptomPages);
    const planned = new Set(map.map((r) => r.url));
    for (const item of ALL_CATALOG_ITEMS) expect(planned.has(item.url), item.url).toBe(true);
  });

  it('maps only to real tracker symptoms', () => {
    const ids = new Set(STANDARD_SYMPTOMS.map((s) => s.id));
    for (const item of ALL_CATALOG_ITEMS) if (item.trackerId) expect(ids.has(item.trackerId), item.id).toBe(true);
  });

  it('turns ticks into the right urgent triggers', () => {
    expect(evaluateUrgentTriggers({ symptomIds: triggerIdsFor(['bleeding-after-menopause']) }).map((t) => t.id)).toEqual([
      'bleeding_after_menopause',
    ]);
    expect(evaluateUrgentTriggers({ symptomIds: triggerIdsFor(['depression']) }).map((t) => t.id)).toEqual(['self_harm_thoughts']);
    expect(evaluateUrgentTriggers({ symptomIds: triggerIdsFor(['hot-flashes', 'brain-fog']) })).toEqual([]);
    expect(trackerIdsFor(['headaches', 'migraines'])).toEqual(['headache']);
  });
});

describe('symptoms checklist UI', () => {
  beforeEach(() => window.localStorage.clear());

  it('lists ticks without scoring, staging or diagnosing', () => {
    render(<SymptomsChecklist liveUrls={[]} trackerLive={false} />);
    fireEvent.click(screen.getByLabelText('Hot flashes'));
    fireEvent.click(screen.getByLabelText('Night sweats'));
    const summary = screen.getByRole('region', { name: 'Your list' });
    expect(within(summary).getByText('Hot flashes')).toBeTruthy();
    const text = summary.textContent ?? '';
    expect(text).toMatch(/can.t tell you whether you are in perimenopause/);
    // "can't tell you whether you are in perimenopause" is the required disclaimer, so it's excluded.
    expect(text).not.toMatch(/\byou have\b|\bscore\b|(?<!whether )\byou are in (peri)?menopause\b|likely/i);
  });

  it('shows urgent guidance and crisis lines first when low mood is ticked', () => {
    render(<SymptomsChecklist liveUrls={[]} trackerLive={false} />);
    fireEvent.click(screen.getByLabelText('Low mood'));
    const guidance = screen.getByRole('region', { name: 'Urgent guidance' });
    expect(guidance.textContent).toMatch(/988/);
    expect(guidance.querySelector('a[href^="/go/"]')).toBeNull();
  });

  it('links only to published pages', () => {
    render(<SymptomsChecklist liveUrls={['/symptoms/hot-flashes/']} trackerLive={false} />);
    const links = screen.getAllByRole('link', { name: /Read more/ });
    expect(links).toHaveLength(1);
    // next/link drops the trailing slash in jsdom (no next.config here); the app uses trailingSlash: true.
    expect(links[0].getAttribute('href')).toMatch(/^\/symptoms\/hot-flashes\/?$/);
  });

  it('saves to the tracker only when asked, and only when the tracker is live', () => {
    const { unmount } = render(<SymptomsChecklist liveUrls={[]} trackerLive={false} />);
    fireEvent.click(screen.getByLabelText('Hot flashes'));
    expect(screen.queryByRole('button', { name: 'Add these to my tracker' })).toBeNull();
    unmount();

    render(<SymptomsChecklist liveUrls={[]} trackerLive />);
    fireEvent.click(screen.getByLabelText('Hot flashes'));
    expect(window.localStorage.getItem('menowell_pinned_symptoms')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Add these to my tracker' }));
    expect(JSON.parse(window.localStorage.getItem('menowell_pinned_symptoms')!)).toEqual(['hot_flashes']);
  });
});
