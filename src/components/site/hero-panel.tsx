/**
 * The deep-green hero panel shared by the homepage, hubs, tools and search:
 * soft light wash plus a faint ring motif. Pure CSS/SVG, ships no JavaScript.
 */
export function HeroPanel({
  children,
  className = '',
  labelledBy,
}: {
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={`relative overflow-hidden rounded-3xl bg-[var(--color-accent)] px-5 py-8 text-white sm:px-9 sm:py-11 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(44rem 26rem at 90% -25%, rgba(255,255,255,0.14), transparent 60%), radial-gradient(34rem 22rem at -10% 120%, rgba(0,0,0,0.18), transparent 55%)',
        }}
      />
      <svg
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute -right-24 -top-32 h-[26rem] w-[26rem] opacity-[0.1]"
        viewBox="0 0 400 400"
        fill="none"
      >
        {[70, 110, 150, 190].map((r) => (
          <circle key={r} cx="200" cy="200" r={r} stroke="#fff" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="relative">{children}</div>
    </section>
  );
}

export const heroEyebrow = 'text-sm font-semibold uppercase tracking-[0.14em] text-[#cfe2da]';
export const heroTitle = 'font-serif text-3xl font-semibold leading-tight text-white sm:text-4xl';
export const heroLead = 'max-w-xl text-lg text-[#e4eeea]';
export const heroPrimaryBtn =
  'tap gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-[var(--color-accent)] no-underline shadow-lg shadow-black/15 hover:bg-[var(--color-accent-soft)] focus-visible:outline-white';
export const heroGhostBtn =
  'tap gap-2 rounded-xl border border-white/40 px-5 py-3 font-semibold text-white no-underline hover:bg-white/10 focus-visible:outline-white';
