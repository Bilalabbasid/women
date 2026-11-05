export const PRICING = {
  monthly: {
    id: 'price_monthly',
    name: 'Monthly Membership',
    amount: 899, // $8.99 in cents
    formattedAmount: '$8.99',
    interval: 'month',
    periodLabel: '/month',
    description: 'Billed monthly. Cancel anytime with one tap.',
  },
  annual: {
    id: 'price_annual',
    name: 'Annual Membership',
    amount: 7199, // $71.99 in cents (~$6.00/mo)
    formattedAmount: '$71.99',
    monthlyEquivalent: '$6.00',
    interval: 'year',
    periodLabel: '/year',
    savingsLabel: 'Save 33%',
    description: 'Billed annually ($6.00/month). 7-day free trial included.',
  },
  trial: {
    days: 7,
    label: '7-day free trial',
    description: 'No charge until trial concludes. Easy one-click cancellation.',
  },
  features: {
    free: [
      '100% local, device-only symptom tracking',
      'Daily quick check-in (< 30 seconds)',
      '30-day personal timeline & basic trends',
      'Treatment & medication reminders',
      'Client-side appointment summary',
      'Full data export (JSON)',
      'Zero behavioral ads or health data sales',
    ],
    premium: [
      'Everything in Free, plus:',
      'Longitudinal history (60, 90 days & custom ranges)',
      'Advanced appointment preparation dossier (PDF)',
      'Treatment change correlation timelines',
      'Optional zero-knowledge client-encrypted cloud backup',
      'Continuous ad-free experience across all views',
      'Priority privacy-preserving feature access',
    ],
  },
} as const;
