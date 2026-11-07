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
    default: 'bg-[var(--paper-raised)] border-[var(--rule)] text-[var(--ink)]',
    muted: 'bg-[var(--paper-sunk)] border-transparent text-[var(--ink)]',
    accent: 'bg-[var(--accent-soft)] border-transparent text-[var(--ink)]',
    highlight: 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--ink)]',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-[var(--radius-lg)] border p-4 sm:p-5',
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
