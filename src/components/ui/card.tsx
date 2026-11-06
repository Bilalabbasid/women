import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'accent' | 'highlight';
}

export function Card({
  className,
  variant = 'default',
  children,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-[var(--color-paper-raised)] border-[var(--color-rule)] text-[var(--color-ink)]',
    muted: 'bg-[var(--color-paper)] border-[var(--color-rule)] text-[var(--color-ink)]',
    accent: 'bg-[var(--color-accent-soft)] border-transparent text-[var(--color-ink)]',
    highlight: 'bg-[var(--color-accent-soft)] border-[var(--color-accent)] text-[var(--color-ink)]',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl border p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]',
          variants[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}
