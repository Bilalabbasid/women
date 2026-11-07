import type { EvidenceGrade } from '../content/schema';

/** Every grade is shown with words, never color alone. */
export const GRADE_LABELS: Record<EvidenceGrade, string> = {
  strong: 'Strong evidence',
  moderate: 'Moderate evidence',
  limited: 'Limited evidence',
  not_supported: 'Not supported',
  harm_concern: 'Harm concern',
  comfort_only: 'Comfort only',
  per_option: 'Graded per option below',
};

