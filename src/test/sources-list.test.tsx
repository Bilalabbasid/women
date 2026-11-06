import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SourcesList } from '@/components/site/sources-list';
import type { Source } from '@/lib/content/schema';
import type { ContentPage } from '@/lib/content/loader';

function source(overrides: Partial<Source>): Source {
  return {
    id: 'fixture',
    title: 'Fixture Source',
    authors: [],
    publisher: 'Fixture Publisher',
    year: 2020,
    type: 'other',
    url: 'https://example.com/fixture',
    doi: null,
    accessed: '2026-11-06',
    population: 'n/a',
    key_finding: 'A fixture finding.',
    funding_conflict: null,
    verified: true,
    ...overrides,
  };
}

function page(url: string, title: string, sourceIds: string[]): ContentPage {
  return {
    url,
    file: `pages${url}index.md`,
    body: '',
    hash: 'x',
    isMedical: true,
    fm: { title, sources: sourceIds } as unknown as ContentPage['fm'],
  } as ContentPage;
}

describe('SourcesList', () => {
  it('groups sources in evidence-strength order (regulator labels before guidelines before small studies)', () => {
    const sources = new Map<string, Source>([
      ['s1', source({ id: 's1', title: 'A small study', type: 'small_study' })],
      ['s2', source({ id: 's2', title: 'A regulator label', type: 'regulator_label' })],
      ['s3', source({ id: 's3', title: 'A guideline', type: 'guideline' })],
    ]);
    render(<SourcesList sources={sources} pages={[]} />);

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    const regulatorIdx = headings.findIndex((h) => h?.includes('Regulator prescribing labels'));
    const guidelineIdx = headings.findIndex((h) => h?.includes('Society and clinical guidelines'));
    const smallStudyIdx = headings.findIndex((h) => h?.includes('Small studies'));
    expect(regulatorIdx).toBeGreaterThanOrEqual(0);
    expect(regulatorIdx).toBeLessThan(guidelineIdx);
    expect(guidelineIdx).toBeLessThan(smallStudyIdx);
  });

  it('links every source to its real URL, and shows a funding conflict when one is recorded', () => {
    const sources = new Map<string, Source>([
      ['s1', source({ id: 's1', title: 'Brand Funded Study', type: 'brand_funded', url: 'https://example.com/study', funding_conflict: 'Funded by the manufacturer' })],
    ]);
    render(<SourcesList sources={sources} pages={[]} />);

    const link = screen.getByRole('link', { name: 'Brand Funded Study' });
    expect(link).toHaveAttribute('href', 'https://example.com/study');
    expect(screen.getByText(/funding: Funded by the manufacturer/)).toBeInTheDocument();
  });

  it('falls back to a DOI link when no direct URL is recorded', () => {
    const sources = new Map<string, Source>([
      ['s1', source({ id: 's1', title: 'DOI Only Study', url: null, doi: '10.1234/example' })],
    ]);
    render(<SourcesList sources={sources} pages={[]} />);
    expect(screen.getByRole('link', { name: 'DOI Only Study' })).toHaveAttribute('href', 'https://doi.org/10.1234/example');
  });

  it('lists every published page that cites a source, and nothing for a source nobody cites', () => {
    const sources = new Map<string, Source>([
      ['cited', source({ id: 'cited', title: 'Cited Source' })],
      ['uncited', source({ id: 'uncited', title: 'Uncited Source' })],
    ]);
    const pages = [page('/symptoms/hot-flashes/', 'Hot flashes', ['cited']), page('/symptoms/night-sweats/', 'Night sweats', ['cited'])];
    render(<SourcesList sources={sources} pages={pages} />);

    const citedItem = screen.getByText('Cited Source').closest('li')!;
    expect(citedItem.textContent).toContain('Hot flashes');
    expect(citedItem.textContent).toContain('Night sweats');

    const uncitedItem = screen.getByText('Uncited Source').closest('li')!;
    expect(uncitedItem.textContent).not.toContain('Cited on');
  });

  it('links to the machine-readable /sources.json feed', () => {
    render(<SourcesList sources={new Map()} pages={[]} />);
    expect(screen.getByRole('link', { name: '/sources.json' })).toHaveAttribute('href', '/sources.json');
  });
});
