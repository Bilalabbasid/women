'use client';

import { AppHeader } from '@/components/app/app-header';
import { ComingSoon } from '@/components/app/coming-soon';

/**
 * No payment processor is connected. This page used to show real-looking
 * prices and a Stripe-style "subscribe" button that only triggered an
 * alert() - nothing was ever charged or saved, and the feature list
 * included things that don't exist yet (e.g. encrypted cloud backup). That
 * was misleading, so it's replaced with an honest "coming soon" until a
 * real payment and sync system is actually built.
 */
export default function MembershipPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Membership" subtitle="Transparent, privacy-aligned plans" showBack showPrivacyBadge />
      <ComingSoon
        title="Membership is coming soon"
        message="Paid membership isn't built yet. Every article and tool is already free and works fully on your device - there's nothing to upgrade to use them."
        fallbackHref="/app/today/"
      />
    </div>
  );
}
