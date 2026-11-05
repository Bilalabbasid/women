import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-6 text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-xl bg-[#F7EFEA] text-[#965342] flex items-center justify-center font-serif text-xl font-bold mb-4">
        404
      </div>
      <h2 className="text-xl font-serif font-semibold text-[#231F1D] mb-2">
        Page Not Found
      </h2>
      <p className="text-sm text-[#68615C] mb-6 leading-relaxed">
        The page you are looking for does not exist or has moved.
      </p>

      <Link href="/dashboard" className="w-full">
        <Button variant="primary" fullWidth className="gap-2">
          <Home className="w-4 h-4" />
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
