import Link from 'next/link';
import { readSiteConfig } from '@/lib/site/config';
import { APP_ROUTES } from '@/lib/routes';
import { AccountClient } from './account-client';

/**
 * Accounts are optional and off by default. The sign-in and server-sync form
 * renders only where the account API would accept it (src/lib/account/guard.ts):
 * FEATURE_LOGIN=true outside production. Everywhere else she sees that nothing
 * needs an account.
 */
export default function AccountPage() {
  const cfg = readSiteConfig();
  if (cfg.flags.login && cfg.env !== 'production') return <AccountClient />;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-10">
      <h1 className="font-serif text-2xl font-semibold text-[#231F1D]">Accounts aren&apos;t available yet</h1>
      <p className="text-[#3E3834]">
        You don&apos;t need one. Every article and tool works without an account, and your tracker entries stay in
        this browser on this device.
      </p>
      <p className="text-[#3E3834]">
        To keep a copy, use Export on the{' '}
        <Link href={APP_ROUTES.privacy} className="font-semibold text-[#1f5a4c] underline">
          Privacy screen
        </Link>
        .
      </p>
    </div>
  );
}
