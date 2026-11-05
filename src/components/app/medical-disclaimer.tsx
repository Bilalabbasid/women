'use client';

import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config/constants';

export function MedicalDisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside
      aria-label="Medical Disclaimer"
      className="bg-[#F6F3EE] border-b border-[#E6DFD5] px-4 py-2 text-xs text-[#554E48] transition-all"
    >
      <div className="max-w-2xl mx-auto flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#8A5645] mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-[#231F1D]">Medical Notice:</strong>{' '}
            {APP_CONFIG.medicalDisclaimer}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss disclaimer"
          className="text-[#7A736E] hover:text-[#231F1D] p-1 rounded-md transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
