/**
 * UK HRT prescription prepayment certificate (PPC) calculator: pure logic.
 * Stateless: nothing is stored and nothing leaves the page.
 *
 * All prices live in ONE object below, with the date they were checked and the
 * official pages they come from. Money is held in pence to avoid rounding.
 */

export const ENGLAND_PRESCRIPTION_PRICES = {
  checked: '2026-11-15',
  /** Charges for 2026/27 were frozen at the 2025/26 levels (gov.uk, 21 November 2025). */
  chargeYear: '2026/27',
  perItemPence: 990,
  hrtPpc12MonthPence: 1980,
  ppc3MonthPence: 3205,
  ppc12MonthPence: 11450,
  sources: [
    { id: 'nhsbsa-hrt-ppc', label: 'NHSBSA: HRT PPC', url: 'https://www.nhsbsa.nhs.uk/help-nhs-prescription-costs/nhs-hormone-replacement-therapy-prescription-prepayment-certificate-hrt-ppc' },
    { id: 'nhsbsa-hrt-ppc-medicines', label: 'NHSBSA: medicines the HRT PPC covers', url: 'https://www.nhsbsa.nhs.uk/help-nhs-prescription-costs/nhs-hormone-replacement-therapy-prescription-prepayment-certificate-hrt-ppc/medicines-covered-hrt-ppc' },
    { id: 'nhsbsa-ppc', label: 'NHSBSA: prescription prepayment certificates', url: 'https://www.nhsbsa.nhs.uk/help-nhs-prescription-costs/nhs-prescription-prepayment-certificates-ppcs' },
    { id: 'govuk-get-a-ppc', label: 'GOV.UK: get a PPC', url: 'https://www.gov.uk/get-a-ppc' },
    { id: 'govuk-get-a-ppc-hrt', label: 'GOV.UK: HRT PPC', url: 'https://www.gov.uk/get-a-ppc/hrt-ppc' },
    { id: 'govuk-prescription-charges-frozen-2026', label: 'GOV.UK: prescription charges frozen for 2026/27', url: 'https://www.gov.uk/government/news/chancellor-freezes-charges-to-keep-prescriptions-under-a-tenner' },
  ],
} as const;

export const HRT_PPC_MEDICINES_URL = ENGLAND_PRESCRIPTION_PRICES.sources[1].url;
export const FREE_PRESCRIPTIONS_URL = 'https://www.nhsbsa.nhs.uk/help-nhs-prescription-costs/free-nhs-prescriptions';
export const BUY_HRT_PPC_URL = 'https://www.nhsbsa.nhs.uk/help-nhs-prescription-costs/nhs-hormone-replacement-therapy-prescription-prepayment-certificate-hrt-ppc';

export type Nation = 'england' | 'scotland' | 'wales' | 'northern-ireland';
export type ItemPeriod = 'month' | 'year';
export type OptionId = 'pay-per-item' | 'hrt-ppc' | 'ppc-12' | 'ppc-3-x4';

export interface PpcInput {
  nation: Nation | '';
  /** Already entitled to free NHS prescriptions in England (60+, exemption certificate, etc.). */
  exempt: boolean;
  /** HRT items: count each medicine each time it is dispensed. */
  hrtItems: number;
  hrtPeriod: ItemPeriod;
  /** Other (non-HRT) prescription items in a year. */
  otherItemsPerYear: number;
}

export interface PpcOption {
  id: OptionId;
  label: string;
  /** Total cost for 12 months, in pence. */
  yearPence: number;
  detail: string;
  /** False for options that can never be cheapest over a whole year (shown for context). */
  comparable: boolean;
}

export type PpcResult =
  | { kind: 'incomplete' }
  | { kind: 'free-nation'; nation: Exclude<Nation, 'england'> }
  | { kind: 'exempt' }
  | {
      kind: 'england';
      hrtPerYear: number;
      otherPerYear: number;
      options: PpcOption[];
      /** Every comparable option that costs the least (more than one on a tie). */
      cheapest: OptionId[];
      cheapestPence: number;
      payPerItemPence: number;
      /** Saving of the cheapest option against paying per item, in pence. */
      savingPence: number;
    };

const MAX_ITEMS_PER_YEAR = 600;

/** Whole, non-negative item counts; anything else counts as 0. */
export function cleanCount(n: number, max = MAX_ITEMS_PER_YEAR): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), max);
}

export function formatPounds(pence: number): string {
  const pounds = pence / 100;
  return `£${pounds.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const NATION_LABELS: Record<Nation, string> = {
  england: 'England',
  scotland: 'Scotland',
  wales: 'Wales',
  'northern-ireland': 'Northern Ireland',
};

export function calculatePpc(input: PpcInput): PpcResult {
  if (!input.nation) return { kind: 'incomplete' };
  if (input.nation !== 'england') return { kind: 'free-nation', nation: input.nation };
  if (input.exempt) return { kind: 'exempt' };

  const P = ENGLAND_PRESCRIPTION_PRICES;
  const hrtPerYear = cleanCount(input.hrtPeriod === 'month' ? cleanCount(input.hrtItems, 50) * 12 : input.hrtItems);
  const otherPerYear = cleanCount(input.otherItemsPerYear);
  if (hrtPerYear === 0 && otherPerYear === 0) return { kind: 'incomplete' };

  const payPerItemPence = (hrtPerYear + otherPerYear) * P.perItemPence;
  const options: PpcOption[] = [
    {
      id: 'pay-per-item',
      label: 'Pay for each item',
      yearPence: payPerItemPence,
      detail: `${hrtPerYear + otherPerYear} items × ${formatPounds(P.perItemPence)}`,
      comparable: true,
    },
  ];
  if (hrtPerYear > 0) {
    options.push({
      id: 'hrt-ppc',
      label: otherPerYear > 0 ? 'HRT PPC, and pay for your other items' : 'HRT PPC',
      yearPence: P.hrtPpc12MonthPence + otherPerYear * P.perItemPence,
      detail:
        otherPerYear > 0
          ? `${formatPounds(P.hrtPpc12MonthPence)} + ${otherPerYear} other items × ${formatPounds(P.perItemPence)}`
          : `${formatPounds(P.hrtPpc12MonthPence)} for 12 months of listed HRT medicines`,
      comparable: true,
    });
  }
  options.push({
    id: 'ppc-12',
    label: '12-month PPC (covers all your prescriptions)',
    yearPence: P.ppc12MonthPence,
    detail: `${formatPounds(P.ppc12MonthPence)}, or 10 monthly Direct Debit payments`,
    comparable: true,
  });
  options.push({
    id: 'ppc-3-x4',
    label: '3-month PPCs, back to back for a year',
    yearPence: 4 * P.ppc3MonthPence,
    detail: `4 × ${formatPounds(P.ppc3MonthPence)}: better suited to a short spell of prescriptions`,
    comparable: false,
  });

  const comparable = options.filter((o) => o.comparable);
  const cheapestPence = Math.min(...comparable.map((o) => o.yearPence));
  const cheapest = comparable.filter((o) => o.yearPence === cheapestPence).map((o) => o.id);

  return {
    kind: 'england',
    hrtPerYear,
    otherPerYear,
    options,
    cheapest,
    cheapestPence,
    payPerItemPence,
    savingPence: payPerItemPence - cheapestPence,
  };
}
