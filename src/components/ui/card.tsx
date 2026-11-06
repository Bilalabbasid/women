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
    default: 'bg-white border-[#E5DED5] text-[#231F1D]',
    muted: 'bg-[#F9F6F0] border-[#E8E1D8] text-[#231F1D]',
    accent: 'bg-[#E6EFEB] border-[#C9DCD4] text-[#231F1D]',
    highlight: 'bg-[#EFF5F0] border-[#D1E2D7] text-[#231F1D]',
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
