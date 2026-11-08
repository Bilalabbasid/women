import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Recover Your Download Link | MenoVerdict',
  description: 'Enter your email address to receive a fresh download link for your purchased MenoVerdict Symptom Journal & Doctor Visit Toolkit.',
  robots: {
    index: false,
    follow: true,
  },
};

export default async function ResendPage(props: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const searchParams = await props.searchParams;
  const isSent = searchParams?.sent === '1';

  return (
    <div className="container py-12 max-w-xl">
      <div className="p-8 md:p-10 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] shadow-sm space-y-6">
        <nav aria-label="Breadcrumb" className="text-xs text-[var(--ink-muted)]">
          <Link href="/shop/menopause-symptom-journal/" className="underline hover:text-[var(--ink)]">
            ← Back to Symptom Journal
          </Link>
        </nav>

        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[var(--ink)]">
            Resend download link
          </h1>
          <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
            Lost your download link or need to download your 38-page Symptom Journal again? Enter the email address you used at checkout, and we&apos;ll send you a fresh download link.
          </p>
        </div>

        {isSent && (
          <div className="p-4 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--accent-ink)] text-sm space-y-1">
            <p className="font-semibold">Check your inbox</p>
            <p>
              If an order matches that email address, a fresh download link is on its way. Please check your inbox and spam folder.
            </p>
          </div>
        )}

        <form action="/api/shop/resend" method="POST" className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[var(--ink)] mb-1.5">
              Email address used at checkout
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-[var(--rule)] bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-base"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-3.5 text-base font-semibold shadow-sm hover:brightness-105 active:scale-[0.99] transition"
          >
            Email me a new download link
          </button>
        </form>

        <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--rule)] text-xs text-[var(--ink-muted)] space-y-2">
          <p className="font-semibold text-[var(--ink)]">Good to know:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Download links remain active for 7 days and allow up to 10 downloads.</li>
            <li>For your privacy and security, this form shows the same message regardless of whether an email address is in our records.</li>
            <li>If you need help or used a different email, please reach out to us directly at <Link href="/about/" className="underline font-medium text-[var(--ink)]">our contact page</Link>.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

