/**
 * The one grade registry: treatment × use → grade. Every grade a reader sees
 * for a treatment (badges, tables, the evidence checker, homepage cards, verdict
 * pages) is read from content/_grades/grades.json, so the same treatment can't be
 * "Strong" on one page and "Moderate" on another. Edit grades there, nowhere else.
 *
 * Grades are set from the evidence alone. MenoVerdict carries no ads,
 * affiliate links or sponsored content.
 */
import data from '../../../content/_grades/grades.json';
import type { EvidenceGrade } from '../content/schema';

export type RegistryGrade = Exclude<EvidenceGrade, 'per_option'>;

export interface GradeEntry {
  /** Stable id, e.g. "cbt-hypnosis-vms". */
  id: string;
  /** What is being graded, as readers would name it. */
  treatment: string;
  /** For what, e.g. "hot flashes and night sweats". A grade is always for a use. */
  use: string;
  grade: RegistryGrade;
  /** Source registry ids the grade rests on. */
  sources: string[];
  /** ISO date the grade was last checked against its sources. */
  last_checked: string;
  /** Verdict pages whose own evidence_grade must equal this grade. */
  pages?: string[];
  /** Editor-only context (why this grade). Never rendered. */
  notes?: string;
}

export const GRADE_REGISTRY: readonly GradeEntry[] = data as GradeEntry[];

const byId = new Map(GRADE_REGISTRY.map((g) => [g.id, g]));

export function getGrade(id: string): GradeEntry | undefined {
  return byId.get(id);
}

/** Throws for an unknown id, so a typo fails the build instead of showing no grade. */
export function requireGrade(id: string): GradeEntry {
  const g = byId.get(id);
  if (!g) throw new Error(`Unknown grade id "${id}" (content/_grades/grades.json)`);
  return g;
}

/** The registry entry that decides a verdict page's own grade, if any. */
export function gradeForPage(url: string): GradeEntry | undefined {
  return GRADE_REGISTRY.find((g) => g.pages?.includes(url));
}
