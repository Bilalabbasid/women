import React from 'react';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-12 h-12 rounded-full border-3 border-[#E5DED5] border-t-[#1F5A4C] animate-spin mb-4" />
      <p className="text-sm font-medium text-[#68615C]">Opening your private journal...</p>
    </div>
  );
}
