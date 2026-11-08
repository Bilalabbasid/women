import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Refund Policy for Digital Products',
  description:
    'Refund and replacement policy for the MenoVerdict Symptom Journal & Doctor Visit Toolkit digital workbook.',
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
        <h2 className="text-xl font-serif font-bold text-[var(--ink)]">Digital Products Policy</h2>
        <p className="text-base text-[var(--ink)] leading-relaxed">
          Due to the immediate electronic delivery and downloadable nature of digital goods, all sales of the MenoVerdict Symptom Journal &amp; Doctor Visit Toolkit are final and non-refundable once the file has been purchased and delivered.
        </p>
      </div>

      <div className="prose space-y-6 text-[var(--ink)]">
        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-[var(--ink)]">Replacement and technical support</h2>
          <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
            While all digital sales are final, we stand behind the quality and usability of our workbook. If you encounter any technical issues with your purchase, we will make sure you receive a fully working file:
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--ink-muted)] space-y-1">
            <li>If your download link expires or is lost, you can generate a fresh link anytime using our <Link href="/shop/resend/" className="underline font-medium text-[var(--ink)]">link recovery page</Link>.</li>
            <li>If the file is damaged, fails to download, or will not open on your device, contact us at <a href="mailto:orders@menoverdict.com" className="underline font-medium text-[var(--ink)]">orders@menoverdict.com</a> and we will immediately provide a direct replacement.</li>
            <li>If you need assistance using the PDF with tablet apps (e.g., GoodNotes, Notability) or printing at home, our support team will help guide you through the setup.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-[var(--ink)]">Duplicate or accidental charges</h2>
          <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
            If you were accidentally billed more than once for the same order due to a technical glitch or network interruption during checkout, contact <a href="mailto:orders@menoverdict.com" className="underline font-medium text-[var(--ink)]">orders@menoverdict.com</a> with your transaction details. Any duplicate charge will be promptly reversed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-[var(--ink)]">Contact us</h2>
          <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
            For any order questions, receipt requests, or technical assistance, email <a href="mailto:orders@menoverdict.com" className="underline font-medium text-[var(--ink)]">orders@menoverdict.com</a> or use our <Link href="/about/" className="underline font-medium text-[var(--ink)]">contact page</Link>. We respond to order queries within 24 hours.
          </p>
        </section>
      </div>
    </article>
  );
}

