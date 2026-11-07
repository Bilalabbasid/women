import React from 'react';
import Link from 'next/link';
import { getProductSlot } from '@/lib/products/slots';

interface ProductSlotProps {
  id: string;
}

export function ProductSlotView({ id }: ProductSlotProps) {
  const slot = getProductSlot(id);
  if (!slot) return null;

  const activeProducts = (slot.products || []).filter((p) => p.active);
  const isFilled = slot.status === 'filled' && activeProducts.length > 0;

  // An empty slot renders nothing at all, in every environment: no placeholder, no staging label.
  if (!isFilled) return null;

  // Filled behavior: Editorial recommendation with standard paid link notice
  return (
    <aside aria-label={`Recommendations: ${slot.category}`} className="my-8 space-y-3">
      {/* Mandatory Notice above every product link */}
      <div className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-3 text-xs text-[var(--color-ink-muted)]">
        <strong>Paid link:</strong> we may earn a commission. We aren&apos;t doctors, and this product may not be right for you.
        Read the product description and label, and ask a doctor or pharmacist before use, especially if you take
        medication, have a health condition, or are pregnant or breastfeeding.
      </div>

      <div className="space-y-4">
        {activeProducts.map((p, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] p-5 space-y-3 shadow-xs"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="font-serif text-lg font-semibold">
                {p.brand} {p.name}
              </h4>
              {p.price_note && <span className="text-xs text-[var(--color-ink-muted)]">{p.price_note}</span>}
            </div>

            <p className="text-sm">{p.why_included}</p>

            {p.best_for && (
              <p className="text-xs text-[var(--color-ink-muted)]">
                <strong>Best for:</strong> {p.best_for}
              </p>
            )}

            {p.not_for && (
              <p className="text-xs text-[var(--color-ink-muted)]">
                <strong>Not suited for:</strong> {p.not_for}
              </p>
            )}

            {p.cautions && (
              <p className="text-xs text-[var(--color-urgent)]">
                <strong>Caution:</strong> {p.cautions}
              </p>
            )}

            <div className="pt-2">
              <Link
                href={p.url}
                rel="sponsored nofollow"
                className="tap inline-flex items-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white no-underline hover:opacity-90"
              >
                View option at partner site →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

