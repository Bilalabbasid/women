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
    neutral: 'bg-[var(--color-rule)] text-[var(--color-ink-muted)]',
    primary: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-medium',
    secondary: 'bg-[var(--color-paper-raised)] text-[var(--color-ink-muted)] font-medium border border-[var(--color-rule)]',
    success: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-medium',
    warning: 'bg-[var(--color-draft-soft)] text-[var(--color-draft)] font-medium',
    outline: 'border border-[var(--color-rule)] text-[var(--color-ink-muted)] bg-[var(--color-paper-raised)]',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide',
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
