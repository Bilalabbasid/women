import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { JsonLd } from '@/components/site/site-chrome';
import { SHOP_CONFIG } from '@/lib/shop/config';
import '@/app/styles/shop.css';

const URL = 'https://menoverdict.com/shop/menopause-symptom-journal/';
const HERO_IMAGE = 'https://menoverdict.com/images/shop/menopause-symptom-journal-hero.jpg';
const PRICE = SHOP_CONFIG.productPriceFormatted;
const TITLE = 'Printable menopause symptom tracker & journal (PDF)';
const DESCRIPTION =
  'Track perimenopause and menopause symptoms for 8 weeks, then take a one-page summary and the right questions to your appointment. 38-page printable PDF, $8.99.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: 'MenoVerdict',
    images: [{ url: HERO_IMAGE, width: 1024, height: 768, alt: 'Pages from the MenoVerdict Symptom Journal & Doctor Visit Toolkit' }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [HERO_IMAGE] },
};

/** Visible on the page and mirrored in FAQPage structured data. Keep the two identical. */
const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'What do I get when I buy?',
    a: 'One 38-page PDF (US Letter) that you can download right after paying: learning pages on the stages and symptoms, a symptom checklist, a 12-month period calendar, eight weekly trackers, a hot flash log, monthly reviews, an appointment planner, a one-page summary for your clinician, questions to ask and a script for short appointments.',
  },
  {
    q: 'Is there a printable menopause symptom tracker in it?',
    a: 'Yes. It has eight weekly symptom trackers with a simple 0 to 3 scale, a hot flash log and a trigger page. You can print extra weekly trackers as often as you like for your own use.',
  },
  {
    q: 'Can I fill it in on an iPad or tablet?',
    a: 'Yes. Open the PDF in any app that lets you write on PDFs, such as Goodnotes, Notability or Apple Books, or print it at home. It is designed light on ink.',
  },
  {
    q: 'Is this medical advice? Will it tell me if I am in menopause?',
    a: "No. It's general information from published medical sources plus tools to track and explain your symptoms. It explains the stages, but only a clinician who knows your history can confirm your stage, and many of these symptoms have other possible causes.",
  },
  {
    q: 'How is it different from your free symptom tracker?',
    a: 'The free online tracker works on your phone and keeps your entries on your device. The journal is for people who prefer paper, and it adds learning pages, a period calendar, an appointment script and a one-page summary you fill in by hand.',
  },
  {
    q: 'How do I get the download, and what if I lose the link?',
    a: 'After checkout you return to a page with your download button. The link works for 7 days and up to 10 downloads. If you lose it, request a fresh link on the link recovery page.',
  },
  {
    q: 'Can I get a refund?',
    a: "Because it is an instant digital download, all sales are final. If the file won't download, open or print, email orders@menoverdict.com and we will fix it or send a working copy.",
  },
  {
    q: 'I live outside the US. Will it work for me?',
    a: 'Yes, the PDF works anywhere. The emergency page lists US numbers (911 and 988), so use your local emergency and crisis numbers instead.',
  },
];

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: SHOP_CONFIG.productTitle,
    sku: SHOP_CONFIG.productId,
    description:
      'A 38-page printable workbook to track perimenopause or menopause symptoms for 8 weeks, understand the stages, and prepare for your appointment with a one-page summary and question list.',
    image: [HERO_IMAGE],
    brand: { '@type': 'Brand', name: 'MenoVerdict' },
    offers: {
      '@type': 'Offer',
      price: (SHOP_CONFIG.productPriceCents / 100).toFixed(2),
      priceCurrency: SHOP_CONFIG.currency,
      availability: 'https://schema.org/InStock',
      url: URL,
      priceValidUntil: '2027-12-31',
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
        merchantReturnLink: 'https://menoverdict.com/refund-policy/',
      },
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://menoverdict.com/' },
      { '@type': 'ListItem', position: 2, name: 'Symptom Journal', item: URL },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  },
];

function BuyButton({ label = `Buy and download, ${PRICE}`, className = '' }: { label?: string; className?: string }) {
  return (
    <form action="/api/shop/checkout/" method="POST" className={className}>
      <button type="submit" className="btn btn-primary shop-buy">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {label}
      </button>
    </form>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shop-check">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

const INSIDE = [
  {
    step: '1',
    title: 'Understand what is happening',
    items: [
      'The three stages, with typical ages',
      'Symptoms commonly reported at each stage',
      'Other conditions with the same symptoms, and why a doctor may test for them',
      'Home remedies people try, and what the evidence says',
      'Treatment options in plain English, from current guidance',
    ],
  },
  {
    step: '2',
    title: 'Track it for 8 weeks',
    items: [
      'Health snapshot, medicines list and care-team contacts',
      'Symptom checklist with an easy 0 to 3 scale',
      '12-month period and bleeding calendar',
      'Eight weekly trackers, a hot flash log and a trigger page',
      'Monthly reviews and a "what I\'ve tried" log',
    ],
  },
  {
    step: '3',
    title: 'Walk in prepared',
    items: [
      'Appointment planner and "bring with you" checklist',
      'A one-page symptom summary to hand to your clinician',
      'Questions to ask, grouped by topic',
      'A fill-in script for short appointments, including what to say if you feel brushed off',
      'Appointment notes and a 12-week follow-up page',
    ],
  },
];

const PREVIEWS = [
  { src: '/images/shop/preview-cover.webp', w: 360, h: 480, alt: 'Workbook cover and the 0 to 3 symptom scale', label: 'Cover and 0-3 scale' },
  { src: '/images/shop/preview-stages.webp', w: 360, h: 480, alt: 'Stages at a glance page', label: 'Stages at a glance' },
  { src: '/images/shop/preview-tracker.webp', w: 280, h: 420, alt: 'Weekly symptom tracker grid', label: '8-week tracker' },
  { src: '/images/shop/preview-summary.webp', w: 280, h: 420, alt: 'One-page appointment summary sheet', label: 'One-page doctor summary' },
];

export default function SymptomJournalShopPage() {
  return (
    <article className="shop container max-w-5xl py-8 md:py-12">
      <JsonLd data={jsonLd} />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--ink-muted)]">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-[var(--ink)]">Symptom Journal</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="shop-hero" aria-labelledby="shop-title">
        <div className="shop-hero-copy">
          <p className="shop-kicker">Printable PDF journal · 38 pages</p>
          <h1 id="shop-title" className="shop-title">
            Menopause Symptom Journal &amp; Doctor Visit Toolkit
          </h1>
          <p className="shop-lede">
            Turn &ldquo;I just don&rsquo;t feel like myself&rdquo; into a clear, written pattern, and walk into your
            appointment with a one-page summary and the right questions.
          </p>

          <div className="shop-price-card">
            <div className="shop-price-row">
              <span className="shop-price">{PRICE}</span>
              <span className="shop-price-note">USD · one-time purchase · no subscription</span>
            </div>
            <BuyButton />
            <ul className="shop-trust" aria-label="Purchase details">
              <li>Instant download</li>
              <li>Secure checkout by Whop</li>
              <li>Print or use on a tablet</li>
            </ul>
          </div>
          <ul className="shop-benefits">
            <li>
              <Check />
              <span>
                <strong>8 weeks of tracking</strong> on simple pages you can fill in in a few minutes
              </span>
            </li>
            <li>
              <Check />
              <span>
                <strong>A one-page summary</strong> to hand to your doctor, nurse or midwife
              </span>
            </li>
            <li>
              <Check />
              <span>
                <strong>Questions and a script</strong> for short appointments, including if you feel brushed off
              </span>
            </li>
            <li>
              <Check />
              <span>
                <strong>Every medical statement sourced</strong> from the NIH, FDA, NHS, The Menopause Society and other
                medical bodies, with all 18 sources listed
              </span>
            </li>
          </ul>

        </div>

        <div className="shop-hero-media">
          <Image
            src="/images/shop/menopause-symptom-journal-hero.jpg"
            alt="Pages from the Symptom Journal & Doctor Visit Toolkit"
            width={1024}
            height={768}
            priority
            sizes="(min-width: 1024px) 420px, 100vw"
            className="shop-hero-img"
          />
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="shop-section">
        <h2 id="how-heading" className="shop-h2">
          How it works
        </h2>
        <ol className="shop-steps">
          <li>
            <strong>Buy</strong>
            <span>Pay securely through Whop, our checkout provider.</span>
          </li>
          <li>
            <strong>Download</strong>
            <span>Your PDF is ready straight away. Lost the link? Get a new one any time.</span>
          </li>
          <li>
            <strong>Track and take it with you</strong>
            <span>Fill it in for 8 weeks, then bring the one-page summary to your appointment.</span>
          </li>
        </ol>
      </section>

      {/* What's inside */}
      <section aria-labelledby="inside-heading" className="shop-section">
        <h2 id="inside-heading" className="shop-h2">
          What&rsquo;s inside the journal
        </h2>
        <div className="shop-inside">
          {INSIDE.map((col) => (
            <div key={col.step} className="shop-inside-col">
              <h3>
                <span aria-hidden="true">{col.step}</span>
                {col.title}
              </h3>
              <ul>
                {col.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Previews */}
      <section aria-labelledby="preview-heading" className="shop-section">
        <h2 id="preview-heading" className="shop-h2">
          Look inside
        </h2>
        <p className="shop-muted">Four of the 38 pages. Light on ink for home printing, and easy to write on with a tablet.</p>
        <div className="shop-previews">
          {PREVIEWS.map((p) => (
            <figure key={p.src}>
              <Image src={p.src} alt={p.alt} width={p.w} height={p.h} sizes="(min-width: 768px) 220px, 45vw" />
              <figcaption>{p.label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Paper or app */}
      <section aria-labelledby="choose-heading" className="shop-section">
        <h2 id="choose-heading" className="shop-h2">
          Paper journal or free app?
        </h2>
        <p className="shop-muted">Both help you notice patterns. Pick the one you&rsquo;ll actually use.</p>
        <div className="shop-compare">
          <div className="shop-compare-col shop-compare-pick">
            <h3>Symptom Journal (PDF)</h3>
            <ul>
              <li>Paper or tablet, no phone needed</li>
              <li>Learning pages on stages, symptoms and treatments</li>
              <li>Period calendar, hot flash log and trigger page</li>
              <li>Appointment script and one-page summary</li>
              <li>{PRICE}, one time</li>
            </ul>
            <BuyButton label={`Get the journal, ${PRICE}`} />
          </div>
          <div className="shop-compare-col">
            <h3>Free online tracker</h3>
            <ul>
              <li>On your phone or computer</li>
              <li>Quick daily or weekly logging</li>
              <li>Charts and a printable doctor report</li>
              <li>Entries stay on your device</li>
              <li>Free</li>
            </ul>
            <Link href="/tools/symptom-tracker/" className="btn btn-secondary">
              Use the free tracker
            </Link>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section aria-labelledby="who-heading" className="shop-section shop-who">
        <div>
          <h2 id="who-heading" className="shop-h2">
            Who it&rsquo;s for
          </h2>
          <ul className="shop-benefits">
            <li>
              <Check />
              <span>You&rsquo;re in your 40s or 50s and wondering if this is perimenopause</span>
            </li>
            <li>
              <Check />
              <span>You have an appointment coming up and want to make the most of it</span>
            </li>
            <li>
              <Check />
              <span>You&rsquo;ve started a treatment and want to see whether it&rsquo;s working</span>
            </li>
            <li>
              <Check />
              <span>You prefer writing things down to using an app</span>
            </li>
          </ul>
        </div>
        <div className="shop-note">
          <h3>What it isn&rsquo;t</h3>
          <p>
            It isn&rsquo;t a diagnosis or medical advice, and we aren&rsquo;t doctors. If you have severe or sudden
            symptoms, don&rsquo;t wait to track them: see <Link href="/urgent-help/">urgent help</Link>.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="shop-section">
        <h2 id="faq-heading" className="shop-h2">
          Questions about the journal
        </h2>
        <div className="shop-faq">
          {FAQS.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <p className="shop-muted mt-4">
          Lost your link? Use the <Link href="/shop/resend/">link recovery page</Link>. Other questions:{' '}
          <Link href="/contact/">contact us</Link>.
        </p>
      </section>

      {/* Final CTA */}
      <section aria-labelledby="final-heading" className="shop-final">
        <h2 id="final-heading">Get the Symptom Journal &amp; Doctor Visit Toolkit</h2>
        <p>38-page printable PDF · 8 weeks of tracking · one-page appointment summary</p>
        <p className="shop-price">
          {PRICE} <span className="shop-price-note">USD</span>
        </p>
        <BuyButton className="mx-auto max-w-md" />
        <p className="shop-fine">
          Instant digital download; all sales final, and we&rsquo;ll fix any file problem.{' '}
          <Link href="/refund-policy/">Refund policy</Link> · <Link href="/terms/">Terms</Link> ·{' '}
          <Link href="/privacy/">Privacy</Link>. General information only, not medical advice.
        </p>
      </section>

      {/* Phones: the buy button stays in reach while reading. */}
      <div className="shop-sticky" aria-hidden="false">
        <span>
          <strong>Symptom Journal</strong> · {PRICE}
        </span>
        <BuyButton label="Buy now" />
      </div>
    </article>
  );
}
