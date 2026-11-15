'use client';

import { useMemo, useState } from 'react';
import {
  BUY_HRT_PPC_URL,
  ENGLAND_PRESCRIPTION_PRICES as PRICES,
  FREE_PRESCRIPTIONS_URL,
  HRT_PPC_MEDICINES_URL,
  NATION_LABELS,
  calculatePpc,
  formatPounds,
  type ItemPeriod,
  type Nation,
  type OptionId,
} from '@/lib/tools/hrt-ppc';
import { field } from '@/components/storage/styles';

function count(v: string): number {
  const n = Number(v);
  return v.trim() === '' || !Number.isFinite(n) ? 0 : n;
}

function checkedLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

const RECOMMEND: Record<OptionId, string> = {
  'pay-per-item': 'Paying for each item',
  'hrt-ppc': 'The HRT PPC',
  'ppc-12': 'The 12-month PPC',
  'ppc-3-x4': '3-month PPCs',
};

/**
 * HRT PPC calculator for England. Stateless: nothing is saved and nothing
 * leaves the page. Prices come from the one constant in src/lib/tools/hrt-ppc.ts.
 */
export function HrtPpcCalculator() {
  const [nation, setNation] = useState<Nation | ''>('');
  const [exempt, setExempt] = useState<'yes' | 'no' | ''>('');
  const [hrtText, setHrtText] = useState('');
  const [hrtPeriod, setHrtPeriod] = useState<ItemPeriod>('year');
  const [otherText, setOtherText] = useState('');

  const result = useMemo(
    () =>
      calculatePpc({
        nation,
        exempt: exempt === 'yes',
        hrtItems: count(hrtText),
        hrtPeriod,
        otherItemsPerYear: count(otherText),
      }),
    [nation, exempt, hrtText, hrtPeriod, otherText],
  );

  const reset = () => {
    setNation('');
    setExempt('');
    setHrtText('');
    setHrtPeriod('year');
    setOtherText('');
  };

  return (
    <div className="space-y-6" data-tool-ui="hrt-prepayment-certificate-calculator">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-5" aria-describedby="ppc-help">
        <p id="ppc-help" className="text-[var(--color-ink-muted)]">
          Uses the {PRICES.chargeYear} NHS prices for England, checked {checkedLabel(PRICES.checked)}. Nothing you enter is
          saved or sent anywhere.
        </p>

        <fieldset className="panel min-w-0 gap-1">
          <legend className="panel-title mb-1">1. Where do you get your prescriptions?</legend>
          <div className="grid gap-x-6 sm:grid-cols-2">
            {(Object.keys(NATION_LABELS) as Nation[]).map((n) => (
              <label key={n} className="check">
                <input type="radio" name="ppc-nation" checked={nation === n} onChange={() => setNation(n)} />
                <span>{NATION_LABELS[n]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {nation === 'england' && (
          <>
            <fieldset className="panel min-w-0 gap-1">
              <legend className="panel-title mb-1">2. Do you already get free prescriptions?</legend>
              <p className="text-sm text-[var(--color-ink-muted)]">
                For example: you are 60 or over, under 16, 16 to 18 in full-time education, pregnant or had a baby in the
                last 12 months with a maternity exemption certificate, have a medical exemption certificate, an HC2
                certificate, or qualifying Universal Credit or Pension Credit Guarantee Credit.{' '}
                <a href={FREE_PRESCRIPTIONS_URL} className="font-semibold text-[var(--color-link)] underline" rel="noopener">
                  See the full NHS list
                </a>
              </p>
              <div className="flex flex-wrap gap-x-6">
                <label className="check">
                  <input type="radio" name="ppc-exempt" checked={exempt === 'no'} onChange={() => setExempt('no')} />
                  <span>No, I pay for prescriptions</span>
                </label>
                <label className="check">
                  <input type="radio" name="ppc-exempt" checked={exempt === 'yes'} onChange={() => setExempt('yes')} />
                  <span>Yes, I get them free</span>
                </label>
              </div>
            </fieldset>

            {exempt === 'no' && (
              <fieldset className="panel min-w-0 gap-3">
                <legend className="panel-title mb-1">3. How many items do you pay for?</legend>
                <p className="text-sm text-[var(--color-ink-muted)]">
                  Count each medicine each time the pharmacy gives it to you. Example: estradiol gel and progesterone
                  capsules collected every 3 months is 2 items, 4 times a year: 8 HRT items a year.
                </p>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="max-w-[12rem]">
                    <label htmlFor="ppc-hrt" className="block text-sm font-semibold">
                      HRT items
                    </label>
                    <input
                      id="ppc-hrt"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={hrtText}
                      onChange={(e) => setHrtText(e.target.value)}
                      className={`mt-1 ${field}`}
                    />
                  </div>
                  <fieldset className="min-w-0">
                    <legend className="sr-only">HRT items are counted</legend>
                    <div className="flex flex-wrap gap-x-5">
                      <label className="check">
                        <input type="radio" name="ppc-period" checked={hrtPeriod === 'month'} onChange={() => setHrtPeriod('month')} />
                        <span>per month</span>
                      </label>
                      <label className="check">
                        <input type="radio" name="ppc-period" checked={hrtPeriod === 'year'} onChange={() => setHrtPeriod('year')} />
                        <span>per year</span>
                      </label>
                    </div>
                  </fieldset>
                </div>
                <div className="max-w-[16rem]">
                  <label htmlFor="ppc-other" className="block text-sm font-semibold">
                    Other prescription items per year (optional)
                  </label>
                  <input
                    id="ppc-other"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    className={`mt-1 ${field}`}
                  />
                </div>
              </fieldset>
            )}
          </>
        )}
      </form>

      <section aria-labelledby="ppc-result-heading" aria-live="polite" className="space-y-4">
        <h2 id="ppc-result-heading" className="text-2xl">
          Your cheapest option
        </h2>

        {result.kind === 'free-nation' ? (
          <div className="panel panel-feature gap-2">
            <p className="text-lg font-semibold">
              Prescriptions are free in {NATION_LABELS[result.nation]}, so you don&apos;t need a certificate.
            </p>
            <p>
              The HRT PPC and other prescription prepayment certificates are for England only. If you live in Wales but your
              GP is in England, ask about an entitlement card so you can get free prescriptions in Wales.
            </p>
          </div>
        ) : result.kind === 'exempt' ? (
          <div className="panel panel-feature gap-2">
            <p className="text-lg font-semibold">You pay nothing for NHS prescriptions, so you don&apos;t need a PPC.</p>
            <p>Make sure your exemption is still valid when you collect, and keep any certificate up to date.</p>
          </div>
        ) : result.kind === 'england' ? (
          <div className="panel panel-feature gap-4">
            <div className="stats">
              <div className="stat">
                <p className="text-sm text-[var(--color-ink-muted)]">Paying per item, a year</p>
                <p className="stat-value mt-1">{formatPounds(result.payPerItemPence)}</p>
              </div>
              <div className="stat">
                <p className="text-sm text-[var(--color-ink-muted)]">Cheapest option, a year</p>
                <p className="stat-value mt-1">{formatPounds(result.cheapestPence)}</p>
              </div>
              <div className="stat">
                <p className="text-sm text-[var(--color-ink-muted)]">You save</p>
                <p className="stat-value mt-1">{formatPounds(result.savingPence)}</p>
              </div>
            </div>

            <p className="text-lg">
              {result.cheapest.length > 1 ? (
                <>
                  <strong>{result.cheapest.map((id) => RECOMMEND[id]).join(' and ')}</strong> cost the same for{' '}
                  {result.hrtPerYear} HRT and {result.otherPerYear} other items a year.
                </>
              ) : (
                <>
                  <strong>{RECOMMEND[result.cheapest[0]]}</strong> is cheapest for {result.hrtPerYear} HRT and{' '}
                  {result.otherPerYear} other items a year.
                </>
              )}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <caption className="sr-only">Yearly cost of each way to pay</caption>
                <thead>
                  <tr>
                    <th scope="col" className="py-2 pr-4">Option</th>
                    <th scope="col" className="py-2 pr-4">How it adds up</th>
                    <th scope="col" className="py-2 text-right">12 months</th>
                  </tr>
                </thead>
                <tbody>
                  {result.options.map((o) => {
                    const best = result.cheapest.includes(o.id);
                    return (
                      <tr key={o.id} className="border-t border-[var(--color-rule)]">
                        <th scope="row" className="py-2 pr-4 font-semibold">
                          {o.label}
                          {best && <span className="ml-2 text-[var(--color-accent)]">Cheapest</span>}
                        </th>
                        <td className="py-2 pr-4 text-[var(--color-ink-muted)]">{o.detail}</td>
                        <td className="py-2 text-right font-semibold">{formatPounds(o.yearPence)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="list-disc space-y-1 pl-6">
              <li>
                The HRT PPC covers only the HRT medicines on the NHSBSA list (it includes many estradiol patches, gels and
                tablets, Utrogestan and vaginal estrogen; testosterone is not listed).{' '}
                <a href={HRT_PPC_MEDICINES_URL} className="font-semibold text-[var(--color-link)] underline" rel="noopener">
                  Check your medicine on the list
                </a>
              </li>
              <li>A 12-month PPC covers all your NHS prescriptions, HRT included, so you would not need both.</li>
              <li>The Mirena coil is a contraceptive, so it has no prescription charge.</li>
              <li>HRT PPCs can&apos;t be refunded, even if your circumstances change.</li>
            </ul>

            <p>
              <a href={BUY_HRT_PPC_URL} className="btn btn-secondary" rel="noopener">
                How to buy an HRT PPC (NHSBSA)
              </a>
            </p>
          </div>
        ) : (
          <p>
            {nation === 'england' && exempt === 'no'
              ? 'Enter how many HRT items you pay for to compare the options.'
              : 'Answer the questions above to see which option costs least.'}
          </p>
        )}

        <p className="text-sm text-[var(--color-ink-muted)]">
          Prices: {formatPounds(PRICES.perItemPence)} per item, {formatPounds(PRICES.hrtPpc12MonthPence)} for the 12-month HRT
          PPC, {formatPounds(PRICES.ppc3MonthPence)} for a 3-month PPC and {formatPounds(PRICES.ppc12MonthPence)} for a 12-month
          PPC ({PRICES.chargeYear}, England). Sources:{' '}
          {PRICES.sources.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ', '}
              <a href={s.url} className="underline" rel="noopener">
                {s.label}
              </a>
            </span>
          ))}
          .
        </p>

        <div className="no-print">
          <button type="button" onClick={reset} className="btn btn-secondary">
            Clear my answers
          </button>
        </div>
      </section>
    </div>
  );
}
