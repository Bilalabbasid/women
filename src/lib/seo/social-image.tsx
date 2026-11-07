import { ImageResponse } from 'next/og';
import type { EvidenceGrade } from '../content/schema';
import { GRADE_LABELS } from '../grades/labels';

/**
 * Social images, built at build time with the default bundled font (nothing is
 * fetched from a third party). "og" is the 1200x630 Open Graph / X card; "pin" is
 * the 1000x1500 vertical image for Pinterest.
 */
export type SocialVariant = 'og' | 'pin';

export const SOCIAL_SIZE: Record<SocialVariant, { width: number; height: number }> = {
  og: { width: 1200, height: 630 },
  pin: { width: 1000, height: 1500 },
};

const GRADE_COLORS: Partial<Record<EvidenceGrade, { fg: string; bg: string }>> = {
  strong: { fg: '#1e5e3a', bg: '#e8f3ec' },
  moderate: { fg: '#24577a', bg: '#e8f0f6' },
  limited: { fg: '#6e5000', bg: '#fbf3dc' },
  comfort_only: { fg: '#3f4a5c', bg: '#eceff5' },
  not_supported: { fg: '#5c3a3a', bg: '#f4ecec' },
  harm_concern: { fg: '#8a1f1f', bg: '#fdeceb' },
};

export function socialImageAlt(title: string, section: string, grade?: EvidenceGrade | null): string {
  const g = grade && grade !== 'per_option' ? ` Evidence grade: ${GRADE_LABELS[grade]}.` : '';
  return `${title} — ${section} guide from MenoVerdict.${g}`;
}

export function renderSocialImage(opts: {
  variant: SocialVariant;
  title: string;
  section: string;
  description?: string;
  grade?: EvidenceGrade | null;
}): ImageResponse {
  const { variant, title, section, description, grade } = opts;
  const size = SOCIAL_SIZE[variant];
  const pin = variant === 'pin';
  const badge = grade && grade !== 'per_option' ? GRADE_COLORS[grade] : undefined;
  const titleSize = pin ? (title.length > 70 ? 66 : 78) : title.length > 70 ? 52 : 62;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#1F5A4C',
          color: '#ffffff',
          padding: pin ? '90px 80px' : '64px 72px',
          position: 'relative',
        }}
      >
        {/* Ring motif, as on the site's heroes. */}
        {[220, 330, 440].map((r) => (
          <div
            key={r}
            style={{
              position: 'absolute',
              right: -r / 2,
              top: -r / 2,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              border: '2px solid rgba(255,255,255,0.10)',
            }}
          />
        ))}

        <div style={{ display: 'flex', flexDirection: 'column', gap: pin ? 36 : 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: '#2C7A66',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              M
            </div>
            <div style={{ display: 'flex', fontSize: 34, fontWeight: 700 }}>
              Meno<span style={{ color: '#9fd4c3' }}>Verdict</span>
            </div>
          </div>
          <div style={{ display: 'flex', fontSize: pin ? 28 : 24, letterSpacing: 3, color: '#cfe2da', textTransform: 'uppercase' }}>
            {section}
          </div>
          <div style={{ display: 'flex', fontSize: titleSize, fontWeight: 700, lineHeight: 1.15, maxWidth: pin ? 840 : 1000 }}>
            {title}
          </div>
          {pin && description && (
            <div style={{ display: 'flex', fontSize: 34, lineHeight: 1.4, color: '#e4eeea', maxWidth: 840 }}>{description}</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: pin ? 28 : 18 }}>
          {badge && grade && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: badge.bg,
                  color: badge.fg,
                  borderRadius: 999,
                  padding: '10px 26px',
                  fontSize: pin ? 34 : 28,
                  fontWeight: 700,
                }}
              >
                <div style={{ width: 16, height: 16, borderRadius: 8, background: badge.fg }} />
                {GRADE_LABELS[grade]}
              </div>
              <div style={{ display: 'flex', fontSize: pin ? 26 : 22, color: '#cfe2da' }}>AI-assisted grade</div>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              fontSize: pin ? 26 : 22,
              color: '#cfe2da',
              gap: 24,
            }}
          >
            <div style={{ display: 'flex', maxWidth: pin ? 640 : 760 }}>
              Not medical advice. Compiled from published sources with AI help, not by a doctor.
            </div>
            <div style={{ display: 'flex', color: '#ffffff', fontWeight: 700 }}>menoverdict.com</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
