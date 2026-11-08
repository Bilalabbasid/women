'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || searchParams.get('checkout_id') || '';
  const orderId = searchParams.get('order_id') || '';
  const initialToken = searchParams.get('token') || '';

  const [downloadUrl, setDownloadUrl] = useState<string>(
    initialToken ? `/api/shop/download?token=${encodeURIComponent(initialToken)}` : ''
  );
  const [status, setStatus] = useState<'loading' | 'confirmed' | 'pending' | 'error'>(
    initialToken ? 'confirmed' : 'loading'
  );
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>(orderId);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (downloadUrl) {
      setStatus('confirmed');
      return;
    }

    if (!sessionId && !orderId) {
      setStatus('error');
      return;
    }

    let timer: NodeJS.Timeout;
    async function checkStatus() {
      try {
        const query = sessionId ? `session_id=${encodeURIComponent(sessionId)}` : `order_id=${encodeURIComponent(orderId)}`;
        const res = await fetch(`/api/shop/order-status?${query}`);
        const data = await res.json();

        if (data.ok && data.status === 'confirmed' && data.downloadUrl) {
          setDownloadUrl(data.downloadUrl);
          setConfirmedOrderId(data.orderId || orderId);
          setStatus('confirmed');
        } else if (attempts < 20) {
          // Poll every 2 seconds for up to 40 seconds
          setStatus('pending');
          setAttempts((a) => a + 1);
          timer = setTimeout(checkStatus, 2000);
        } else {
          // Fallback if webhook takes longer: provide resend instructions
          setStatus('pending');
        }
      } catch (err) {
        console.error('Error checking order status:', err);
        if (attempts < 20) {
          setAttempts((a) => a + 1);
          timer = setTimeout(checkStatus, 2500);
        }
      }
    }

    void checkStatus();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [sessionId, orderId, downloadUrl, attempts]);

  return (
    <div className="container py-12 max-w-2xl">
      <div className="p-8 md:p-10 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] shadow-sm text-center space-y-6">
        {status === 'confirmed' ? (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center text-3xl">
              ✓
            </div>
            <p className="kicker text-[var(--accent)] uppercase font-semibold text-xs tracking-wider">
              Payment Confirmed
            </p>
            <h1 className="text-3xl font-serif font-bold text-[var(--ink)]">
              Thank you for your order!
            </h1>
            <p className="text-[var(--ink-muted)] leading-relaxed">
              Your 38-page <strong>Menopause Symptom Journal &amp; Doctor Visit Toolkit</strong> is ready for instant download.
            </p>

            {confirmedOrderId && (
              <p className="text-xs font-mono text-[var(--ink-muted)] bg-[var(--paper)] py-1.5 px-3 rounded-md inline-block">
                Order reference: {confirmedOrderId}
              </p>
            )}

            <div className="pt-2">
              <a
                href={downloadUrl}
                download="MenoVerdict-Symptom-Journal-and-Doctor-Visit-Toolkit.pdf"
                className="btn btn-primary w-full py-4 text-base font-semibold flex items-center justify-center gap-2.5 shadow-md hover:brightness-105 active:scale-[0.99] transition"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download your PDF (38 pages)
              </a>
            </div>

            <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--rule)] text-xs text-[var(--ink-muted)] text-left space-y-2">
              <p className="font-semibold text-[var(--ink)]">Important download details:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your download link is active for <strong>7 days</strong> and up to <strong>10 downloads</strong>.</li>
                <li>Save the file to your computer, tablet, or phone immediately.</li>
                <li>A receipt and backup download link was also sent to your email.</li>
                <li>If you ever lose your file or link, visit our <Link href="/shop/resend/" className="underline font-medium text-[var(--ink)]">link recovery page</Link>.</li>
              </ul>
            </div>
          </>
        ) : status === 'pending' || status === 'loading' ? (
          <>
            <div className="w-12 h-12 mx-auto rounded-full border-3 border-[var(--rule)] border-t-[var(--accent)] animate-spin" />
            <h1 className="text-2xl font-serif font-bold text-[var(--ink)]">
              Confirming your payment...
            </h1>
            <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
              We&apos;re connecting with the payment network to verify your order. Your download button will appear right here automatically.
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              This usually takes 3 to 10 seconds. Please do not close this window.
            </p>
            {attempts >= 15 && (
              <div className="p-4 rounded-xl bg-[var(--paper)] text-xs text-[var(--ink-muted)] mt-4">
                Taking a little longer than usual? Don&apos;t worry — once confirmed, your receipt and download link will also be sent directly to your email, or you can use our <Link href="/shop/resend/" className="underline font-medium">link recovery page</Link>.
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-2xl font-bold">
              !
            </div>
            <h1 className="text-2xl font-serif font-bold text-[var(--ink)]">
              Order lookup
            </h1>
            <p className="text-sm text-[var(--ink-muted)]">
              We couldn&apos;t find an active checkout session. If you have already completed a purchase, please use our link recovery tool to have your download link sent directly to your inbox.
            </p>
            <div className="pt-2">
              <Link href="/shop/resend/" className="btn btn-secondary inline-block">
                Recover my download link
              </Link>
            </div>
          </>
        )}

        <div className="pt-4 border-t border-[var(--rule)] text-xs text-[var(--ink-muted)] flex justify-center items-center gap-4">
          <Link href="/refund-policy/" className="underline hover:text-[var(--ink)]">14-Day Refund Policy</Link>
          <span>·</span>
          <Link href="/about/" className="underline hover:text-[var(--ink)]">Need help? Contact support</Link>
        </div>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-16 text-center text-[var(--ink-muted)] space-y-4">
          <h1 className="text-2xl font-serif font-bold text-[var(--ink)]">
            Confirming your payment...
          </h1>
          <p className="text-sm">Loading order details...</p>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
