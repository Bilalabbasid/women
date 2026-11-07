import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

/**
 * Real reader quotes from content/_quotes.yaml. Only entries with permission are
 * shown; with none, the "What readers told us" section is hidden everywhere.
 */
const QuoteSchema = z.object({
  text: z.string().min(1).max(400),
  page: z.string().regex(/^\/.*\/$/),
  received: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  permission: z.literal(true),
});
const FileSchema = z.object({ quotes: z.array(QuoteSchema).default([]) });

export type ReaderQuote = z.infer<typeof QuoteSchema>;

export function parseQuotes(raw: string): ReaderQuote[] {
  return FileSchema.parse(parseYaml(raw) ?? {}).quotes;
}

let cache: ReaderQuote[] | null = null;
export function readerQuotesFor(url: string, root = path.join(process.cwd(), 'content')): ReaderQuote[] {
  if (!cache) {
    const file = path.join(root, '_quotes.yaml');
    cache = fs.existsSync(file) ? parseQuotes(fs.readFileSync(file, 'utf8')) : [];
  }
  return cache.filter((q) => q.page === url);
}
