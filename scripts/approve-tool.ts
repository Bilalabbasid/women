/**
 * Records clinical approval of a tool's logic, stamping a hash of the logic
 * file AND the code files it lists.
 *
 *   npm run tool:approve -- symptom-tracker --reviewer jane-doe-md [--date 2026-11-20]
 *
 * Use it ONLY after the named clinician has reviewed the logic file and the
 * behaviour of this exact version. Any later change to the logic file or to
 * the listed code resets approval, and production hides the tool again.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { loadToolLogic, TOOLS_DIR } from '../src/lib/tools/logic';
import { loadContent } from '../src/lib/content/loader';

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--reviewer' && args[args.indexOf(a) - 1] !== '--date');
const reviewerId = args.includes('--reviewer') ? args[args.indexOf('--reviewer') + 1] : null;
const date = args.includes('--date') ? args[args.indexOf('--date') + 1] : new Date().toISOString().slice(0, 10);

function fail(msg: string): never {
  console.error(`approve-tool: ${msg}`);
  process.exit(1);
}

if (!id) fail('pass the tool id, for example symptom-tracker');
if (!reviewerId) fail('pass --reviewer <person-id>');
const reviewer = loadContent().people.get(reviewerId);
if (!reviewer?.roles.includes('clinical_reviewer')) fail(`"${reviewerId}" is not a clinical reviewer in people.yaml`);
if (!reviewer.verified) fail(`"${reviewerId}" is not verified by the owner yet`);

const { tools, errors } = loadToolLogic();
if (errors.length) fail(`fix the logic files first:\n${errors.join('\n')}`);
const tool = tools.find((t) => t.logic.id === id);
if (!tool) fail(`no logic file content/_tools/${id}.yaml`);

const file = path.join(TOOLS_DIR(), `${id}.yaml`);
const doc = parseDocument(fs.readFileSync(file, 'utf8'));
doc.set('status', 'clinician_approved');
doc.set('reviewer', reviewerId);
doc.set('reviewed_at', date);
doc.set('approved_hash', tool.hash);
fs.writeFileSync(file, doc.toString());
console.log(`approve-tool: ${id} approved by ${reviewerId} on ${date}, hash ${tool.hash.slice(0, 12)}…`);
