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
    neutral: 'bg-[#F0EBE3] text-[#554E48]',
    primary: 'bg-[#F7EFEA] text-[#965342] font-medium border border-[#EACFC3]',
    secondary: 'bg-[#EDF3EF] text-[#3D5646] font-medium border border-[#CDE0D4]',
    success: 'bg-[#EFF7F2] text-[#2C6E49] font-medium',
    warning: 'bg-[#FDF7ED] text-[#9A6218] font-medium',
    outline: 'border border-[#D9D1C7] text-[#68615C] bg-white',
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
