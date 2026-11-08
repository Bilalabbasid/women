import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Refund Policy for Digital Products',
  description:
    '14-day full refund policy for the MenoVerdict Symptom Journal & Doctor Visit Toolkit digital workbook.',
  path: '/refund-policy/',
});

export default function RefundPolicyPage() {
  return (
    <article className="container py-10 md:py-14 max-w-3xl space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-[var(--ink-muted)]">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:underline">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/shop/menopause-symptom-journal/" className="hover:underline">Symptom Journal</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--ink)] font-medium">Refund Policy</li>
        </ol>
      </nav>

      <header className="space-y-3">
        <p className="kicker text-[var(--accent)] font-semibold uppercase text-xs tracking-wider">
          Digital Products
        </p>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[var(--ink)]">
          Refund Policy
        </h1>
        <p className="text-sm text-[var(--ink-muted)]">
          Last updated: November 8, 2026
        </p>
      </header>

      <div className="p-6 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] space-y-4">
        <h2 className="text-xl font-serif font-bold text-[var(--ink)]">Our 14-Day Guarantee</h2>
        <p className="text-base text-[var(--ink)] leading-relaxed">
          If the file doesn&apos;t download or open, or you&apos;re unhappy with it, email us within 14 days for a full refund.
        </p>
      </div>

      <div className="prose space-y-6 text-[var(--ink)]">
        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-[var(--ink)]">How to request a refund</h2>
          <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
            To request a refund, simply send an email to <a href="mailto:orders@menoverdict.com" className="underline font-medium text-[var(--ink)]">orders@menoverdict.com</a> (or use our <Link href="/about/" className="underline font-medium text-[var(--ink)]">contact form</Link>) within 14 days of your purchase date.
          </p>
          <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
            Please include:
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--ink-muted)] space-y-1">
            <li>The email address you used at checkout.</li>
            <li>Your order reference number (optional, but helps us locate your purchase faster).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-[var(--ink)]">Processing your refund</h2>
          <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
            Once requested, we process your refund within 1 to 2 business days. The refund will be credited back to your original payment method via our payment provider (Whop). Depending on your bank or card issuer, funds typically appear on your statement in 3 to 7 business days.
          </p>
          <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
            Upon refund confirmation, any active download links associated with the order will be permanently disabled.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-[var(--ink)]">Need help opening your PDF?</h2>
          <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
            If you are having trouble opening, downloading, or printing the PDF on your tablet, phone, or computer, we are glad to help troubleshoot. You can also generate a fresh download link at any time on our <Link href="/shop/resend/" className="underline font-medium text-[var(--ink)]">link recovery page</Link>.
          </p>
        </section>
      </div>
    </article>
  );
}
