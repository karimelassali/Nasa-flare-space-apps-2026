import type { EvidenceRecord } from '@/types/flare';

const normalize = (value: string) => value.toLowerCase().replace(/[–—−]/g, '-');
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Both boundaries matter: FLEX must not match FLEX-2, nor SAFFIRE-I SAFFIRE-III. */
export function mentionedRecords(text: string, records: EvidenceRecord[]): EvidenceRecord[] {
  const input = normalize(text);
  const matches = (name: string) => new RegExp(`(?:^|[^a-z0-9-])${escape(normalize(name))}(?![a-z0-9-])`).test(input);
  return records.filter((record) => [record.id, record.investigationId, record.investigationName].some(matches))
    .sort((a, b) => {
      const position = (r: EvidenceRecord) => Math.min(...[r.id, r.investigationId, r.investigationName]
        .map((s) => input.indexOf(normalize(s))).filter((i) => i >= 0));
      return position(a) - position(b);
    });
}

export function comparisonRecords(text: string, records: EvidenceRecord[]): EvidenceRecord[] {
  const explicit = records.filter((r) => new RegExp(`(?:^|[^a-z0-9-])${escape(r.id)}(?![a-z0-9-])`, 'i').test(text));
  if (explicit.length >= 2) return explicit.slice(0, 2);
  const byInvestigation = new Map<string, EvidenceRecord>();
  for (const record of records) {
    if (!byInvestigation.has(record.investigationId)) byInvestigation.set(record.investigationId, record);
  }
  return [...byInvestigation.values()].slice(0, 2);
}

export function retrieveQuestionRecords(text: string, records: EvidenceRecord[], contextIds: string[]): EvidenceRecord[] {
  const mentions = mentionedRecords(text, records);
  if (mentions.length) return mentions;
  if (/\b(these|those|them|their|that (test|record|experiment)|it|the (first|second)|export|brief|download)\b/i.test(text) && contextIds.length) {
    return records.filter((r) => contextIds.includes(r.id));
  }
  const stopwords = new Set([
    'what', 'does', 'show', 'about', 'find', 'evidence', 'how', 'the', 'and', 'for', 'with',
    'nasa', 'research', 'tell', 'have', 'can', 'are', 'from', 'results', 'compare', 'all',
    'any', 'not', 'this', 'that', 'you', 'your', 'ignore', 'instructions', 'system', 'prompt',
  ]);
  const terms = normalize(text).match(/[a-z0-9]+/g)?.filter((t) => t.length > 2 && !stopwords.has(t)) ?? [];
  return records.map((record) => {
    const haystack = normalize(`${record.investigationName} ${record.material} ${record.findings} ${record.tags.join(' ')}`);
    const score = terms.filter((t) => new RegExp(`(?:^|[^a-z0-9])${escape(t)}(?![a-z0-9])`).test(haystack)).length;
    return { record, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 8).map((item) => item.record);
}
