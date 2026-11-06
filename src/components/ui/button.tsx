import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none rounded-xl active:scale-[0.98] transition-transform';

  const variants = {
    primary:
      'bg-[var(--color-accent)] text-[var(--color-paper)] hover:brightness-90 focus-visible:ring-[var(--color-accent)] shadow-sm',
    secondary:
      'bg-[var(--color-accent-soft)] text-[var(--color-accent)] hover:brightness-95 focus-visible:ring-[var(--color-accent)] shadow-sm',
    outline:
      'border border-[var(--color-rule)] bg-[var(--color-paper-raised)] text-[var(--color-ink)] hover:bg-[var(--color-accent-soft)] hover:border-[var(--color-accent)] focus-visible:ring-[var(--color-accent)]',
    ghost:
      'text-[var(--color-ink-muted)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-ink)] focus-visible:ring-[var(--color-accent)]',
    danger:
      'bg-[var(--color-urgent)] text-[var(--color-paper)] hover:brightness-90 focus-visible:ring-[var(--color-urgent)]',
  };

  const sizes = {
    sm: 'min-h-[44px] px-3.5 text-xs',
    md: 'min-h-[46px] px-5 text-sm font-semibold', // Minimum 44px+ for mobile touch targets
    lg: 'min-h-[52px] px-6 text-base font-semibold',
  };

  return (
    <button
      className={twMerge(
        clsx(
          base,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
