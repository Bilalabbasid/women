import React from 'react';
import Link from 'next/link';
import { WifiOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function OfflinePage() {
  return (
    <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F7EFEA] text-[#965342] flex items-center justify-center mb-5">
        <WifiOff className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-serif font-semibold text-[#231F1D] mb-2">
        You are currently offline
      </h1>
      <p className="text-sm text-[#68615C] mb-8 leading-relaxed">
        Because MenoWell is built local-first, you can continue logging your daily check-in, reviewing your timeline, and managing treatments without an internet connection.
      </p>

      <Card variant="highlight" className="w-full text-left mb-8 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#2C6E49] shrink-0 mt-0.5" />
        <div className="text-xs text-[#2C6E49] leading-relaxed">
          <p className="font-semibold mb-0.5">Zero Loss Guarantee</p>
          Your records are stored securely in your device’s local IndexedDB and never depend on a live connection to be saved.
        </div>
      </Card>

      <Link href="/dashboard" className="w-full">
        <Button variant="primary" fullWidth className="gap-2">
          <span>Go to Today’s Check-in</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}
