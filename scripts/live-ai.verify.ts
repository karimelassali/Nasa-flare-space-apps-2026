// Explicitly run with npm run verify:ai. Never runs in the offline test suite.
import { afterAll, expect, it, vi } from 'vitest';
import { loadEnvConfig } from '@next/env';
import { writeFileSync } from 'node:fs';
import { analyzeScenarioWithAI, type AIProviderName } from '../src/lib/ai/analyst';
import { renderRecordClaims } from '../src/lib/ai/grounding';
import { getAllEvidenceRecords } from '../src/lib/evidence/repository';
import { rankEvidenceCorpus } from '../src/lib/ranking/ranker';

loadEnvConfig(process.cwd());
const question = 'Compare BASS-II and FLEX';
const records = getAllEvidenceRecords().filter((r) => ['EV-PSI25-01', 'EV-PSI69-01'].includes(r.id));
const scenario = { missionId: 'iss' as const, oxygenPercent: 21, pressureKpa: 101.3, airflowCms: 10, material: 'Any', gravityContext: 'Microgravity' as const };
const results: object[] = [];

for (const provider of ['nvidia', 'gemini', 'openai'] as AIProviderName[]) {
  it(`checks live ${provider} connectivity and the returned source fields`, async () => {
    const categories: string[] = [];
    const logger = vi.spyOn(console, 'error').mockImplementation((label, category) => {
      if (label === 'AI provider failure category:' && typeof category === 'string') categories.push(category);
    });
    const start = Date.now();
    try {
      const response = await analyzeScenarioWithAI(question, scenario, rankEvidenceCorpus(records, scenario, question), records, { provider });
      const expected = records.flatMap((r) => renderRecordClaims(r));
      expect(response.citedEvidenceIds.slice().sort()).toEqual(records.map((r) => r.id).sort());
      expect(response.claims?.length).toBeGreaterThan(0);
      for (const claim of response.claims ?? []) expect(expected).toContainEqual(claim);
      results.push({ provider, responseMode: response.responseMode, realResponseVerified: response.responseMode === provider, milliseconds: Date.now() - start, categories, citedEvidenceIds: response.citedEvidenceIds, claimsMatchStoredSourceFields: true, providerNote: response.providerNote });
    } finally { logger.mockRestore(); }
  });
}

afterAll(() => {
  writeFileSync('docs/provider-verification.json', JSON.stringify({ checkedAt: new Date().toISOString(), question, validationScope: 'Actual provider request; citation IDs, selected fields and rendered claims checked against current local corpus. This is not an independent scientific review.', results }, null, 2) + '\n');
});
