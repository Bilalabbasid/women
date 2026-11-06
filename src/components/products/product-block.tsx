import React from 'react';
import { getAmazonProduct } from '@/lib/products/products';

interface ProductBlockProps {
  id: string;
}

export function ProductBlock({ id }: ProductBlockProps) {
  const product = getAmazonProduct(id);
  if (!product) {
    console.warn(`ProductBlock: product "${id}" not found in products.yaml`);
    return null;
  }

  return (
    <aside
      aria-label={`Product recommendation: ${product.name}`}
      className="my-8 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-6 space-y-4 shadow-xs"
    >
      <h3 className="font-serif text-xl font-semibold text-[var(--color-ink)]">
        {product.name}
      </h3>

      <div className="space-y-2 text-sm text-[var(--color-ink)] leading-relaxed">
        <p>
          <strong className="font-semibold text-[var(--color-ink)]">Best for:</strong> {product.best_for}
        </p>
        <p>
          <strong className="font-semibold text-[var(--color-ink)]">Why we included it:</strong> {product.why_included}
        </p>
        <p>
          <strong className="font-semibold text-[var(--color-ink)]">What it won&apos;t do:</strong> {product.what_it_wont_do}
        </p>
        {product.who_should_check_first && (
          <p className="text-[var(--color-ink-muted)]">
            <strong className="font-semibold text-[var(--color-ink)]">Check first:</strong> {product.who_should_check_first}
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-[var(--color-rule)] space-y-3">
        <div>
          <a
            href={product.amazon_url}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="tap inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:opacity-90"
          >
            Check it on Amazon
          </a>
        </div>
        <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
          Paid link: we may earn a commission. We aren&apos;t doctors. Read the product label and ask a doctor or pharmacist
          if you&apos;re unsure it suits you.
        </p>
      </div>
    </aside>
  );
}

