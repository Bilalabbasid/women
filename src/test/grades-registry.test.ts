/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import { GRADE_REGISTRY, requireGrade, gradeForPage } from '@/lib/grades/registry';
import { EVIDENCE_CATALOG } from '@/components/tools/does-it-work-checker';
import { renderMarkdown } from '@/lib/content/markdown';

const render = (md: string) => renderMarkdown(md, { knownPaths: new Set(), isAlwaysValid: () => true }).html;

describe('grade registry', () => {
  it('has unique ids and every entry names a treatment and a use', () => {
    const ids = GRADE_REGISTRY.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of GRADE_REGISTRY) {
      expect(g.treatment.length, g.id).toBeGreaterThan(2);
      expect(g.use.length, g.id).toBeGreaterThan(2);
    }
  });

  it('the evidence checker shows exactly the registry grade for every entry', () => {
    for (const e of EVIDENCE_CATALOG) {
      expect(e.grade, e.id).toBe(requireGrade(e.gradeId).grade);
    }
  });

  it('resolves the conflicts found in the audit, one way everywhere', () => {
    expect(requireGrade('cooling-comfort').grade).toBe('comfort_only');
    expect(requireGrade('cooling-vms').grade).toBe('not_supported');
    expect(requireGrade('cbt-hypnosis-vms').grade).toBe('strong');
    expect(requireGrade('ssri-snri-vms').grade).toBe('strong');
    expect(gradeForPage('/does-it-work/cooling-products/')?.grade).toBe('comfort_only');
    // Oxybutynin is no longer grouped (as Strong) with SSRIs, SNRIs and gabapentin.
    const oxy = EVIDENCE_CATALOG.find((e) => e.id === 'oxybutynin');
    expect(oxy?.grade).toBe(requireGrade('oxybutynin-vms').grade);
  });

  it('renders :grade{id} from the registry, in tables too', () => {
    const html = render('| Option | Grade |\n| --- | --- |\n| CBT | :grade{id="cbt-hypnosis-vms"} |');
    expect(html).toContain('class="grade grade-strong" data-grade-id="cbt-hypnosis-vms"');
    expect(html).toContain('Strong evidence');
  });

  it('fails loudly on an unknown grade id instead of showing nothing', () => {
    expect(() => render('Graded :grade{id="no-such-grade"}.')).toThrow(/Unknown grade id/);
  });

  it('parses citations separated by commas, so no raw [@ keys leak', () => {
    const r = renderMarkdown('Fact [@a-source, @b-source].', { knownPaths: new Set(), isAlwaysValid: () => true });
    expect(r.html).not.toContain('[@');
    expect(r.citations).toEqual(['a-source', 'b-source']);
  });
});
