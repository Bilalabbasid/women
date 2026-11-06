import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders with children text correctly', () => {
    render(<Button>How are you feeling today?</Button>);
    expect(screen.getByRole('button', { name: /how are you feeling today/i })).toBeInTheDocument();
  });

  it('applies primary variant styling', () => {
    render(<Button variant="primary">Submit</Button>);
    const btn = screen.getByRole('button', { name: /submit/i });
    expect(btn.className).toContain('bg-[var(--color-accent)]');
  });

  it('respects disabled attribute', () => {
    render(<Button disabled>Disabled Action</Button>);
    const btn = screen.getByRole('button', { name: /disabled action/i });
    expect(btn).toBeDisabled();
  });
});
