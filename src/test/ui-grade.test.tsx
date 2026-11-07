import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GradeBadge, GradeExplainers, GradeMeter, GRADE_SCALE, explainerId } from '@/components/ui/grade';
import { GRADE_LABELS } from '@/lib/grades/labels';
import type { EvidenceGrade } from '@/lib/content/schema';

describe('GradeMeter', () => {
  it.each(GRADE_SCALE.map((g, i) => [g, i + 1] as const))('%s: names the grade and its step of 5', (grade, step) => {
    const { container } = render(<GradeMeter grade={grade} use="for hot flashes" />);
    const img = screen.getByRole('img');
    const label = img.getAttribute('aria-label') ?? '';
    expect(label).toContain(GRADE_LABELS[grade]);
    expect(label).toContain(`${step} of 5`);
    expect(label).toContain('for hot flashes');
    // Exactly one segment marked, and the lower ones dimmed.
    expect(container.querySelectorAll('.meter-seg')).toHaveLength(5);
    expect(container.querySelectorAll('.meter-seg.is-on')).toHaveLength(1);
    expect(container.querySelectorAll('.meter-seg.is-below')).toHaveLength(step - 1);
  });

  it('renders comfort only as a badge, not a meter', () => {
    const { container } = render(<GradeMeter grade="comfort_only" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.querySelector('.meter-track')).toBeNull();
    expect(container.querySelector('.grade-badge')).toHaveTextContent(GRADE_LABELS.comfort_only);
  });

  it('points its explain button at a popover that GradeExplainers renders', () => {
    const { container } = render(
      <>
        <GradeMeter grade="not_supported" />
        <GradeExplainers />
      </>,
    );
    const btn = screen.getByRole('button', { name: /What does not supported mean/ });
    const target = btn.getAttribute('popovertarget');
    expect(target).toBe(explainerId('not_supported'));
    const pop = container.querySelector(`#${target}`);
    expect(pop).not.toBeNull();
    expect(pop).toHaveAttribute('popover');
    expect(pop).toHaveTextContent(GRADE_LABELS.not_supported);
  });

  it('can hide the explain button', () => {
    render(<GradeMeter grade="strong" explain={false} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('GradeExplainers', () => {
  it('has one popover per explainable grade', () => {
    const { container } = render(<GradeExplainers />);
    const explainable = (Object.keys(GRADE_LABELS) as EvidenceGrade[]).filter((g) => g !== 'per_option');
    for (const g of explainable) expect(container.querySelector(`#${explainerId(g)}`)).not.toBeNull();
  });
});

describe('every grade', () => {
  it.each(Object.keys(GRADE_LABELS) as EvidenceGrade[])('%s has an icon and a word', (grade) => {
    const { container } = render(<GradeBadge grade={grade} />);
    expect(container.querySelector('.meter-icon svg')).not.toBeNull();
    expect(container).toHaveTextContent(GRADE_LABELS[grade]);
  });
});
