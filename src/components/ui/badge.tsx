import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'outline';
}

export function Badge({
  className,
  variant = 'neutral',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    neutral: 'bg-[var(--paper-sunk)] text-[var(--ink-muted)]',
    primary: 'bg-[var(--accent-soft)] text-[var(--accent)]',
    secondary: 'bg-[var(--paper-raised)] text-[var(--ink-muted)] border border-[var(--rule)]',
    success: 'bg-[var(--g-strong-soft)] text-[var(--g-strong-ink)]',
    warning: 'bg-[var(--g-limited-soft)] text-[var(--g-limited-ink)]',
    outline: 'border border-[var(--rule-strong)] text-[var(--ink-muted)] bg-[var(--paper-raised)]',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.9rem] font-bold leading-snug',
          variants[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
}
