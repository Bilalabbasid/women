import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Button. Variants map onto the design system's .btn styles (components.css):
 * primary, secondary, quiet (text-like), plus legacy names kept for existing
 * tracker screens (outline → secondary, ghost → plain, danger).
 * `loading` keeps the width, shows a spinner and sets aria-busy.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

const VARIANT: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-secondary',
  quiet: 'btn-quiet',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

export function buttonClass({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: Pick<ButtonProps, 'variant' | 'size' | 'fullWidth' | 'className'> = {}) {
  return twMerge(clsx('btn', VARIANT[variant], size === 'sm' && 'btn-sm', size === 'lg' && 'btn-lg', fullWidth && 'btn-block', className));
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClass({ variant, size, fullWidth, className })}
      disabled={disabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {children}
    </button>
  );
}
