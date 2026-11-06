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
      'bg-[#1F5A4C] text-white hover:bg-[#174A3E] focus-visible:ring-[#1F5A4C] shadow-sm',
    secondary:
      'bg-[#577060] text-white hover:bg-[#465A4D] focus-visible:ring-[#577060] shadow-sm',
    outline:
      'border border-[#D9D1C7] bg-white text-[#231F1D] hover:bg-[#E6EFEB] hover:border-[#1F5A4C] focus-visible:ring-[#1F5A4C]',
    ghost:
      'text-[#68615C] hover:bg-[#EEF1EF] hover:text-[#231F1D] focus-visible:ring-[#1F5A4C]',
    danger:
      'bg-[#A33A33] text-white hover:bg-[#882F2A] focus-visible:ring-[#A33A33]',
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
