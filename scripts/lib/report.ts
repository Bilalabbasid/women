/** Shared reporting for validators: collect issues, print a summary, exit non-zero on errors. */
export interface Issue {
  level: 'error' | 'warning';
  where: string;
  message: string;
}

export class Report {
  issues: Issue[] = [];
  info: string[] = [];
  constructor(readonly name: string) {}

  error(where: string, message: string) {
    this.issues.push({ level: 'error', where, message });
  }
  warn(where: string, message: string) {
    this.issues.push({ level: 'warning', where, message });
  }
  note(line: string) {
    this.info.push(line);
  }

  get errors() {
    return this.issues.filter((i) => i.level === 'error');
  }
  get warnings() {
    return this.issues.filter((i) => i.level === 'warning');
  }

  /** Prints the report and sets the exit code. Returns true when there are no errors. */
  finish(): boolean {
    const out: string[] = [`\n== ${this.name} ==`];
    for (const line of this.info) out.push(`  ${line}`);
    for (const i of [...this.errors, ...this.warnings]) {
      out.push(`  ${i.level === 'error' ? 'ERROR' : 'warn '}  ${i.where}: ${i.message}`);
    }
    out.push(`  ${this.errors.length} error(s), ${this.warnings.length} warning(s)`);
    console.log(out.join('\n'));
    if (this.errors.length) process.exitCode = 1;
    return this.errors.length === 0;
  }
}
