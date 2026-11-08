import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { JsonLd } from '@/components/site/site-chrome';
import { SHOP_CONFIG } from '@/lib/shop/config';

export const metadata: Metadata = {
  title: 'Menopause Symptom Tracker & Doctor Visit Workbook (Printable PDF) | MenoVerdict',
  description:
    'Track perimenopause and menopause symptoms for 8 weeks and prepare for your appointment with a one-page summary and question list. 38-page printable PDF, sourced from NIH, FDA and NHS guidance.',
  alternates: {
    canonical: 'https://menoverdict.com/shop/menopause-symptom-journal/',
  },
  openGraph: {
    title: 'Menopause Symptom Tracker & Doctor Visit Workbook (Printable PDF) | MenoVerdict',
    description:
      'Track perimenopause and menopause symptoms for 8 weeks and prepare for your appointment with a one-page summary and question list. 38-page printable PDF, sourced from NIH, FDA and NHS guidance.',
    url: 'https://menoverdict.com/shop/menopause-symptom-journal/',
    siteName: 'MenoVerdict',
    images: [
      {
        url: 'https://menoverdict.com/images/shop/menopause-symptom-journal-hero.jpg',
        width: 1024,
        height: 768,
        alt: 'MenoVerdict Symptom Journal & Doctor Visit Toolkit preview',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Menopause Symptom Tracker & Doctor Visit Workbook (Printable PDF) | MenoVerdict',
    description:
      'Track perimenopause and menopause symptoms for 8 weeks and prepare for your appointment with a one-page summary and question list. 38-page printable PDF, sourced from NIH, FDA and NHS guidance.',
    images: ['https://menoverdict.com/images/shop/menopause-symptom-journal-hero.jpg'],
  },
};

const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: SHOP_CONFIG.productTitle,
  description:
    'A 38-page printable workbook to track your perimenopause or menopause symptoms for 8 weeks, understand the stages, and walk into your appointment with a one-page summary and the right questions.',
  image: 'https://menoverdict.com/images/shop/menopause-symptom-journal-hero.jpg',
  brand: {
    '@type': 'Brand',
    name: 'MenoVerdict',
  },
  offers: {
    '@type': 'Offer',
    price: '8.99',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: 'https://menoverdict.com/shop/menopause-symptom-journal/',
    priceValidUntil: '2027-12-31',
  },
};

export default function SymptomJournalShopPage() {
  return (
    <article className="container py-8 md:py-12 max-w-5xl">
      <JsonLd data={productJsonLd} />

      {/* Top Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--ink-muted)]">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:underline">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <span className="text-[var(--ink)] font-medium">Symptom Journal</span>
          </li>
        </ol>
      </nav>

      {/* Section 1: Hero — Title, Description & Hero Image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
        {/* Mobile-first Image (shown above on mobile, beside on desktop) */}
        <div className="lg:col-span-5 lg:order-2">
          <div className="rounded-2xl overflow-hidden border border-[var(--rule)] bg-[var(--paper-raised)] shadow-md p-2">
            <Image
              src="/images/shop/menopause-symptom-journal-hero.jpg"
              alt="MenoVerdict Symptom Journal & Doctor Visit Toolkit preview pages"
              width={1024}
              height={768}
              priority
              className="w-full h-auto rounded-xl object-cover"
            />
          </div>
        </div>

        {/* Title, Short Description, Price & Buy Button */}
        <div className="lg:col-span-7 lg:order-1 space-y-5">
          <p className="kicker text-[var(--accent)] font-semibold tracking-wide text-sm uppercase">
            Printable Digital Toolkit
          </p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[var(--ink)] leading-tight">
            Menopause Symptom Journal &amp; Doctor Visit Toolkit
          </h1>
          <p className="text-lg text-[var(--ink-muted)] leading-relaxed">
            A 38-page printable workbook to track your perimenopause or menopause symptoms for 8 weeks, understand the stages, and walk into your appointment with a one-page summary and the right questions.
          </p>

          {/* Pricing & Checkout Action (Works without JavaScript) */}
          <div className="p-6 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] shadow-sm space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-serif font-bold text-[var(--ink)]">$8.99</span>
              <span className="text-sm text-[var(--ink-muted)] font-medium">USD · One-time purchase</span>
            </div>

            <form action="/api/shop/checkout" method="POST">
              <button
                type="submit"
                className="btn btn-primary w-full py-3.5 text-base font-semibold flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-[0.99] transition"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Buy and download, $8.99
              </button>
            </form>

            <p className="text-xs text-[var(--ink-muted)] leading-normal pt-1">
              Instant PDF download. 38 pages, US Letter. General information only, not medical advice. We aren&apos;t doctors.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ink-muted)] border-t border-[var(--rule)] pt-3">
              <span>✓ 14-day full refund guarantee</span>
              <Link href="/refund-policy/" className="underline hover:text-[var(--ink)]">Refund policy</Link>
              <Link href="/medical-disclaimer/" className="underline hover:text-[var(--ink)]">Medical disclaimer</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: What's Inside */}
      <section className="mb-14 space-y-6">
        <div className="section-header-teal">
          <h2 className="text-2xl font-serif font-bold text-[#FCFAF5]">What&apos;s inside the toolkit</h2>
        </div>

        <blockquote className="p-5 rounded-xl border-l-4 border-[var(--accent)] bg-[var(--paper-raised)] text-base font-serif italic text-[var(--ink)]">
          &ldquo;I just don&apos;t feel like myself&rdquo; is hard to explain in a 10-minute appointment. This workbook turns it into a clear pattern your clinician can act on.
        </blockquote>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Learn Column */}
          <div className="p-6 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] space-y-3">
            <div className="flex items-center gap-2.5 text-[var(--accent)] font-bold text-lg">
              <span className="w-7 h-7 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-sm font-sans">1</span>
              <h3>Learn</h3>
            </div>
            <ul className="space-y-2 text-sm text-[var(--ink)] list-disc pl-5">
              <li>The three stages, perimenopause, menopause and postmenopause, with typical ages</li>
              <li>Symptoms women commonly report at each stage</li>
              <li>Other conditions that can cause the same symptoms, and why a doctor may test for them</li>
              <li>Home remedies people try, and what the evidence actually says about each</li>
              <li>Treatment options in plain English, from current medical guidance</li>
            </ul>
          </div>

          {/* Track Column */}
          <div className="p-6 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] space-y-3">
            <div className="flex items-center gap-2.5 text-[var(--accent)] font-bold text-lg">
              <span className="w-7 h-7 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-sm font-sans">2</span>
              <h3>Track</h3>
            </div>
            <ul className="space-y-2 text-sm text-[var(--ink)] list-disc pl-5">
              <li>Health snapshot, medicines list and care-team contacts</li>
              <li>Symptom checklist with an easy 0 to 3 heat scale</li>
              <li>12-month period and bleeding calendar</li>
              <li>Eight weekly trackers, a hot flash log and a trigger detective page</li>
              <li>Monthly reviews and a &ldquo;what I&apos;ve tried&rdquo; log</li>
            </ul>
          </div>

          {/* Prepare Column */}
          <div className="p-6 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] space-y-3">
            <div className="flex items-center gap-2.5 text-[var(--accent)] font-bold text-lg">
              <span className="w-7 h-7 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-sm font-sans">3</span>
              <h3>Prepare</h3>
            </div>
            <ul className="space-y-2 text-sm text-[var(--ink)] list-disc pl-5">
              <li>Appointment planner and a &ldquo;bring with you&rdquo; checklist</li>
              <li>A one-page symptom summary to hand to your clinician</li>
              <li>Questions to ask, grouped by topic</li>
              <li>A fill-in-the-blanks script for short appointments, including what to say if you feel brushed off</li>
              <li>Appointment notes and a 12-week follow-up page</li>
            </ul>
          </div>
        </div>

        <p className="text-sm text-[var(--ink-muted)] bg-[var(--paper)] p-4 rounded-xl border border-[var(--rule)]">
          <strong>100% Evidence-Sourced:</strong> Every medical statement is sourced. Information comes from the NIH, FDA, NHS, The Menopause Society, Mayo Clinic and Cleveland Clinic, with all 18 sources listed in the workbook.
        </p>
      </section>

      {/* Section 5: Page Previews */}
      <section className="mb-14 space-y-6">
        <div className="section-header-teal">
          <h2 className="text-2xl font-serif font-bold text-[#FCFAF5]">Look inside the workbook</h2>
        </div>
        <p className="text-sm text-[var(--ink-muted)]">
          Four preview excerpts from the 38-page journal (designed light on ink for printing at home or filling out on a tablet).
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2 text-center">
            <div className="rounded-xl border border-[var(--rule)] overflow-hidden bg-white shadow-sm p-1">
              <Image
                src="/images/shop/preview-cover.webp"
                alt="Workbook cover with 0-3 severity heat scale"
                width={360}
                height={480}
                className="w-full h-auto object-cover rounded"
              />
            </div>
            <span className="text-xs font-medium text-[var(--ink)]">Cover &amp; 0-3 Heat Scale</span>
          </div>

          <div className="space-y-2 text-center">
            <div className="rounded-xl border border-[var(--rule)] overflow-hidden bg-white shadow-sm p-1">
              <Image
                src="/images/shop/preview-stages.webp"
                alt="Stages at a glance overview page"
                width={360}
                height={480}
                className="w-full h-auto object-cover rounded"
              />
            </div>
            <span className="text-xs font-medium text-[var(--ink)]">Stages at a Glance</span>
          </div>

          <div className="space-y-2 text-center">
            <div className="rounded-xl border border-[var(--rule)] overflow-hidden bg-white shadow-sm p-1">
              <Image
                src="/images/shop/preview-tracker.webp"
                alt="Weekly tracker log grid"
                width={280}
                height={420}
                className="w-full h-auto object-cover rounded"
              />
            </div>
            <span className="text-xs font-medium text-[var(--ink)]">8-Week Tracking Grid</span>
          </div>

          <div className="space-y-2 text-center">
            <div className="rounded-xl border border-[var(--rule)] overflow-hidden bg-white shadow-sm p-1">
              <Image
                src="/images/shop/preview-summary.webp"
                alt="One-page doctor visit appointment summary sheet"
                width={280}
                height={420}
                className="w-full h-auto object-cover rounded"
              />
            </div>
            <span className="text-xs font-medium text-[var(--ink)]">1-Page Doctor Summary</span>
          </div>
        </div>
      </section>

      {/* Section 6: Details & Who It's For */}
      <section className="mb-14 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] space-y-4">
          <h2 className="text-xl font-serif font-bold text-[var(--ink)]">Product Details</h2>
          <ul className="space-y-2.5 text-sm text-[var(--ink)]">
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent)] font-bold">✓</span>
              <span><strong>Instant download:</strong> 1 PDF, 38 pages, US Letter (8.5 &times; 11 in)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent)] font-bold">✓</span>
              <span><strong>Device friendly:</strong> Print at home, or fill it in on an iPad or tablet with any PDF note app</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent)] font-bold">✓</span>
              <span><strong>Reusable:</strong> Print extra weekly trackers as often as you need</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent)] font-bold">✓</span>
              <span><strong>Light on ink:</strong> Designed with clean white backgrounds for home printing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent)] font-bold">✓</span>
              <span><strong>Licence:</strong> For personal, individual use</span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] space-y-4">
          <h2 className="text-xl font-serif font-bold text-[var(--ink)]">Who It&apos;s For</h2>
          <p className="text-sm text-[var(--ink)] leading-relaxed">
            Women in their 40s and 50s who think they may be in perimenopause or menopause, women already in treatment who want to track how it&apos;s working, and anyone preparing for a menopause appointment.
          </p>
          <div className="pt-2 border-t border-[var(--rule)] text-xs text-[var(--ink-muted)] space-y-2">
            <p><strong>Lost your download link?</strong> You can have a fresh link emailed to you anytime at our <Link href="/shop/resend/" className="underline hover:text-[var(--ink)]">link recovery page</Link>.</p>
            <p><strong>Need support?</strong> Contact us at <Link href="/about/" className="underline hover:text-[var(--ink)]">our contact page</Link>.</p>
          </div>
        </div>
      </section>

      {/* Section 6: Frequently Asked Questions */}
      <section className="mb-14 space-y-6">
        <div className="section-header-teal">
          <h2 className="text-2xl font-serif font-bold text-[#FCFAF5]">Frequently asked questions</h2>
        </div>

        <div className="space-y-4">
          <details className="p-5 rounded-xl bg-[var(--paper-raised)] border border-[var(--rule)] group">
            <summary className="font-serif font-semibold text-lg text-[var(--ink)] cursor-pointer list-none flex justify-between items-center">
              <span>Is this medical advice?</span>
              <span className="text-[var(--accent)] transition-transform group-open:rotate-180">▾</span>
            </summary>
            <p className="mt-3 text-sm text-[var(--ink-muted)] leading-relaxed">
              No. It&apos;s general information gathered from published medical sources, plus tools to track and explain your symptoms. We aren&apos;t doctors. Always talk to a qualified clinician about your own symptoms and treatment.
            </p>
          </details>

          <details className="p-5 rounded-xl bg-[var(--paper-raised)] border border-[var(--rule)] group">
            <summary className="font-serif font-semibold text-lg text-[var(--ink)] cursor-pointer list-none flex justify-between items-center">
              <span>Will it tell me whether I&apos;m in menopause?</span>
              <span className="text-[var(--accent)] transition-transform group-open:rotate-180">▾</span>
            </summary>
            <p className="mt-3 text-sm text-[var(--ink-muted)] leading-relaxed">
              It explains the stages and gives a rough guide, but only your clinician can confirm your stage. Many menopause symptoms have other possible causes.
            </p>
          </details>

          <details className="p-5 rounded-xl bg-[var(--paper-raised)] border border-[var(--rule)] group">
            <summary className="font-serif font-semibold text-lg text-[var(--ink)] cursor-pointer list-none flex justify-between items-center">
              <span>Do you recommend the home remedies listed?</span>
              <span className="text-[var(--accent)] transition-transform group-open:rotate-180">▾</span>
            </summary>
            <p className="mt-3 text-sm text-[var(--ink-muted)] leading-relaxed">
              No. We describe what people commonly try and what the evidence says. Please talk to your doctor or pharmacist before trying any remedy or supplement.
            </p>
          </details>

          <details className="p-5 rounded-xl bg-[var(--paper-raised)] border border-[var(--rule)] group">
            <summary className="font-serif font-semibold text-lg text-[var(--ink)] cursor-pointer list-none flex justify-between items-center">
              <span>Can I use it on an iPad?</span>
              <span className="text-[var(--accent)] transition-transform group-open:rotate-180">▾</span>
            </summary>
            <p className="mt-3 text-sm text-[var(--ink-muted)] leading-relaxed">
              Yes. Open the PDF in any note app that lets you write on PDFs (e.g. Goodnotes, Notability, Apple Books).
            </p>
          </details>

          <details className="p-5 rounded-xl bg-[var(--paper-raised)] border border-[var(--rule)] group">
            <summary className="font-serif font-semibold text-lg text-[var(--ink)] cursor-pointer list-none flex justify-between items-center">
              <span>What if I&apos;m outside the US?</span>
              <span className="text-[var(--accent)] transition-transform group-open:rotate-180">▾</span>
            </summary>
            <p className="mt-3 text-sm text-[var(--ink-muted)] leading-relaxed">
              It works anywhere. The emergency page lists US numbers (911 and 988), so use your local emergency and crisis numbers instead.
            </p>
          </details>
        </div>
      </section>

      {/* Section 7: Second Buy Button at End */}
      <section className="p-8 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] shadow-sm text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-2xl font-serif font-bold text-[var(--ink)]">
          Get the Symptom Journal &amp; Doctor Visit Toolkit
        </h2>
        <p className="text-sm text-[var(--ink-muted)]">
          38-page printable PDF workbook · 8 weeks of symptom tracking · 1-page appointment summary
        </p>
        <div className="text-3xl font-serif font-bold text-[var(--ink)]">$8.99 <span className="text-sm font-sans font-normal text-[var(--ink-muted)]">USD</span></div>

        <form action="/api/shop/checkout" method="POST" className="max-w-md mx-auto">
          <button
            type="submit"
            className="btn btn-primary w-full py-3.5 text-base font-semibold flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-[0.99] transition"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Buy and download, $8.99
          </button>
        </form>

        <p className="text-xs text-[var(--ink-muted)]">
          General information only, not medical advice. We aren&apos;t doctors. Talk to your clinician before making any changes to your care.
        </p>
        <div className="flex justify-center items-center gap-4 text-xs text-[var(--ink-muted)] pt-2">
          <Link href="/refund-policy/" className="underline hover:text-[var(--ink)]">14-Day Full Refund Policy</Link>
          <span>·</span>
          <Link href="/privacy/" className="underline hover:text-[var(--ink)]">Privacy Policy</Link>
          <span>·</span>
          <Link href="/terms/" className="underline hover:text-[var(--ink)]">Terms</Link>
        </div>
      </section>
    </article>
  );
}
