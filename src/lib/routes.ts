/**
 * Private tracker routes. Everything under /app/ is noindex, disallowed in
 * robots.txt and never linked as content (DECISIONS.md D-003).
 */
export const APP_BASE = '/app/';

export const APP_ROUTES = {
  today: '/app/today/',
  checkIn: '/app/check-in/',
  timeline: '/app/timeline/',
  treatments: '/app/treatments/',
  insights: '/app/insights/',
  doctorReport: '/app/doctor-report/',
  settings: '/app/settings/',
  onboarding: '/app/onboarding/',
  privacy: '/app/privacy/',
  membership: '/app/membership/',
} as const;

/** Old flat tracker paths, redirected permanently to their /app/ home. */
export const LEGACY_APP_REDIRECTS: Array<{ source: string; destination: string }> = [
  { source: '/dashboard', destination: APP_ROUTES.today },
  { source: '/check-in', destination: APP_ROUTES.checkIn },
  { source: '/timeline', destination: APP_ROUTES.timeline },
  { source: '/insights', destination: APP_ROUTES.insights },
  { source: '/doctor', destination: APP_ROUTES.doctorReport },
  { source: '/settings', destination: APP_ROUTES.settings },
  { source: '/onboarding', destination: APP_ROUTES.onboarding },
  { source: '/privacy-center', destination: APP_ROUTES.privacy },
  // /treatments is NOT redirected: it becomes the treatments content hub.
  // /pricing is NOT redirected: unlinked at launch (D-007).
];
