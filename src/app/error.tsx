'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error locally without sending sensitive health information
    console.error('[MenoWell Error]', error.message);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-6 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-[#FDF1F0] text-[#A33A33] flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-serif font-semibold text-[#231F1D] mb-2">
        Something didn&apos;t load smoothly
      </h2>
      <p className="text-sm text-[#68615C] mb-6 leading-relaxed">
        Your local records are safe and untouched. Let’s try refreshing the view.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        <Button variant="primary" fullWidth onClick={() => reset()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
        <Link href="/app/today/" className="w-full">
          <Button variant="outline" fullWidth className="gap-2">
            <Home className="w-4 h-4" />
            Go to Today
          </Button>
        </Link>
      </div>
    </div>
  );
}
