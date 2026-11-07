import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LevelPicker, QuickPick, Stepper, SymptomChips } from '@/components/app/kit';

describe('Stepper', () => {
  it('counts every rapid tap, even before the parent re-renders (fast-tap fix)', () => {
    // A parent that never re-renders with the new value: the old code sent 1, 1, 1.
    const onChange = vi.fn();
    render(<Stepper label="Hot flashes" value={0} onChange={onChange} decreaseLabel="Fewer" increaseLabel="More" />);
    const plus = screen.getByRole('button', { name: 'More' });
    fireEvent.click(plus);
    fireEvent.click(plus);
    fireEvent.click(plus);
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([1, 2, 3]);
  });

  it('ends at +3 after three taps with a real controlled parent', () => {
    function Host() {
      const [v, setV] = useState(0);
      return <Stepper label="Hot flashes" value={v} onChange={setV} decreaseLabel="Fewer" increaseLabel="More" />;
    }
    render(<Host />);
    const plus = screen.getByRole('button', { name: 'More' });
    fireEvent.click(plus);
    fireEvent.click(plus);
    fireEvent.click(plus);
    expect(screen.getByRole('status')).toHaveTextContent('3');
  });

  it('disables − at the minimum and + at the maximum', () => {
    const { rerender } = render(
      <Stepper label="x" value={0} min={0} max={5} onChange={() => {}} decreaseLabel="Fewer" increaseLabel="More" />,
    );
    expect(screen.getByRole('button', { name: 'Fewer' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'More' })).not.toBeDisabled();
    rerender(<Stepper label="x" value={5} min={0} max={5} onChange={() => {}} decreaseLabel="Fewer" increaseLabel="More" />);
    expect(screen.getByRole('button', { name: 'More' })).toBeDisabled();
  });

  it('clamps to max and keeps half-steps tidy', () => {
    const onChange = vi.fn();
    render(<Stepper label="Sleep" value={13.5} min={0} max={14} step={0.5} onChange={onChange} decreaseLabel="Less" increaseLabel="More" />);
    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([14, 14]);
  });
});

const LEVELS = [
  { value: 1 as const, label: 'Rough' },
  { value: 2 as const, label: 'Low' },
  { value: 3 as const, label: 'Okay' },
  { value: 4 as const, label: 'Good' },
  { value: 5 as const, label: 'Great' },
];

describe('LevelPicker', () => {
  it('is a radio group with aria-checked on the chosen level', () => {
    render(<LevelPicker label="Feeling" levels={LEVELS} value={3} onChange={() => {}} />);
    expect(screen.getByRole('radiogroup', { name: 'Feeling' })).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
    expect(screen.getByRole('radio', { name: /Okay/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /Good/ })).toHaveAttribute('aria-checked', 'false');
    // Roving tabindex: only the chosen one is in the tab order.
    expect(radios.filter((r) => r.getAttribute('tabindex') === '0')).toHaveLength(1);
  });

  it('moves with arrow keys and wraps around', () => {
    const onChange = vi.fn();
    render(<LevelPicker label="Feeling" levels={LEVELS} value={3} onChange={onChange} />);
    const okay = screen.getByRole('radio', { name: /Okay/ });
    fireEvent.keyDown(okay, { key: 'ArrowRight' });
    fireEvent.keyDown(okay, { key: 'ArrowLeft' });
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([4, 2]);
    const great = screen.getByRole('radio', { name: /Great/ });
    fireEvent.keyDown(great, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('calls onChange on click', () => {
    const onChange = vi.fn();
    render(<LevelPicker label="Feeling" levels={LEVELS} value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: /Great/ }));
    expect(onChange).toHaveBeenCalledWith(5);
  });
});

describe('QuickPick', () => {
  it('allows a single choice', () => {
    function Host() {
      const [v, setV] = useState<string | null>('none');
      return (
        <QuickPick
          label="Bleeding"
          value={v}
          onChange={setV}
          options={[
            { value: 'none', label: 'None' },
            { value: 'light', label: 'Light' },
            { value: 'heavy', label: 'Heavy' },
          ]}
        />
      );
    }
    render(<Host />);
    fireEvent.click(screen.getByRole('radio', { name: 'Heavy' }));
    const checked = screen.getAllByRole('radio').filter((r) => r.getAttribute('aria-checked') === 'true');
    expect(checked).toHaveLength(1);
    expect(checked[0]).toHaveTextContent('Heavy');
  });
});

describe('SymptomChips', () => {
  function Host() {
    const [sel, setSel] = useState<Record<string, number>>({});
    return (
      <SymptomChips
        items={[
          { id: 'hf', name: 'Hot flashes' },
          { id: 'bf', name: 'Brain fog' },
        ]}
        selected={sel}
        onToggle={(id) =>
          setSel((s) => {
            const c = { ...s };
            if (c[id]) delete c[id];
            else c[id] = 3;
            return c;
          })
        }
        onStrength={(id, v) => setSel((s) => ({ ...s, [id]: v }))}
      />
    );
  }

  it('adds at strength 3, reveals the 1–5 row, sets strength, and removes on a second tap', () => {
    render(<Host />);
    expect(screen.queryByRole('radiogroup')).toBeNull();

    const chip = screen.getByRole('button', { name: /Hot flashes/ });
    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    const row = screen.getByRole('radiogroup', { name: 'How strong: Hot flashes' });
    expect(row).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '3' })).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(screen.getByRole('radio', { name: '5' }));
    expect(screen.getByRole('radio', { name: '5' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '3' })).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });
});
