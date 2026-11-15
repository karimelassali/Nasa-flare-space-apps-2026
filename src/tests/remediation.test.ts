import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAllEvidenceRecords, getAllInvestigations } from '@/lib/evidence/repository';
import { comparisonRecords, mentionedRecords } from '@/lib/agent/retrieval';
import { buildCoverageHeatmap, findCompatibleNumericalMeasurements, findRangeSpanningRecords } from '@/lib/matching/coverage';
import { buildSourceResponse, validateSelection } from '@/lib/ai/grounding';
import { getRecordProvenance } from '@/lib/evidence/provenance';
import { POST as agentPost } from '@/app/api/agent/route';
import { POST as analyzePost } from '@/app/api/analyze/route';
import { classifyAndEvaluateRecord } from '@/lib/ranking/ranker';

const records = getAllEvidenceRecords();
const get = (id: string) => records.find((r) => r.id === id)!;
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('Submission regression checks', () => {
  it('puts continuous boundary values in exactly one correctly labeled coverage cell', () => {
    for (const [oxygen, flow, oxygenBinId, airflowBinId] of [
      [17.999, 0, 'o2-low', 'flow-0'],
      [18, 0.1, 'o2-norm', 'flow-low'],
      [23, 15.1, 'o2-mod', 'flow-mid'],
      [30.5, 25.1, 'o2-high', 'flow-high'],
    ] as const) {
      const cells = buildCoverageHeatmap([{ ...get('EV-PSI69-01'), oxygenPercent: oxygen, airflowCms: flow, oxygenRangePct: null, airflowRangeCms: null }]).filter((cell) => cell.count > 0);
      expect(cells).toHaveLength(1);
      expect(cells[0]).toMatchObject({ oxygenBinId, airflowBinId });
    }
  });
  it('selects one record per named investigation and respects exact names', () => {
    const matches = mentionedRecords('Compare BASS-II and FLEX', records);
    const pair = comparisonRecords('Compare BASS-II and FLEX', matches);
    expect(pair.map((r) => r.investigationName)).toEqual(['BASS-II', 'FLEX']);
    expect(mentionedRecords('FLEX-2', records).map((r) => r.investigationName)).toEqual(['FLEX-2']);
    expect(mentionedRecords('SAFFIRE-III', records).every((r) => r.investigationName === 'SAFFIRE-III')).toBe(true);
    expect(mentionedRecords('preflex', records)).toEqual([]);
    const explicit = mentionedRecords('Compare EV-PSI25-01 and EV-PSI25-02', records);
    expect(comparisonRecords('Compare EV-PSI25-01 and EV-PSI25-02', explicit)).toHaveLength(2);
  });

  it('does not compare rod regression, opposed-flow maxima or protocol time as concurrent spread or burn time', () => {
    const rod = get('EV-PSI25-02');
    expect(rod.measurements.find((m) => m.key === 'rodTipRegressionRate')?.value).toBe(0.0385);
    expect(rod.measurements.find((m) => m.key === 'minimumOxygenBoundary')?.scope).toBe('study_boundary');
    expect(findCompatibleNumericalMeasurements(rod, get('EV-PSI98-01')).compatiblePairs).toEqual([]);
    expect(findCompatibleNumericalMeasurements(get('EV-SAFFIRE-V-01'), get('EV-PSI98-01')).compatiblePairs).toEqual([]);
    expect(get('EV-SAFFIRE-V-01').measurements.find((m) => m.key === 'forcedFlowDuration')?.scope).toBe('protocol_duration');
    expect(findCompatibleNumericalMeasurements(get('EV-PSI98-01'), get('EV-PSI100-01')).compatiblePairs).toHaveLength(2);
  });

  it('rejects unknown fields, out-of-scope citations, partial comparisons and generated prose', () => {
    const available = [get('EV-PSI25-01'), get('EV-PSI69-01')];
    const valid = { evidenceSelections: available.map((r) => ({ recordId: r.id, includeFinding: true, measurementKeys: [] })) };
    const response = validateSelection(valid, 'Compare BASS-II and FLEX', available, 'gemini', 'Test');
    expect(response?.responseMode).toBe('gemini');
    expect(response?.claims?.every((c) => c.text === get(c.recordId).findings)).toBe(true);
    expect(validateSelection({ ...valid, advice: 'Keep oxygen below 13.5%' }, 'Compare BASS-II and FLEX', available, 'gemini', 'Test')).toBeNull();
    expect(validateSelection({ evidenceSelections: [valid.evidenceSelections[0]] }, 'Compare BASS-II and FLEX', available, 'gemini', 'Test')).toBeNull();
    expect(validateSelection({ evidenceSelections: [{ recordId: 'EV-PSI98-01', includeFinding: true, measurementKeys: [] }] }, 'Report', available, 'gemini', 'Test')).toBeNull();
    expect(validateSelection({ evidenceSelections: [{ recordId: available[0].id, includeFinding: true, measurementKeys: ['madeUpTemperature'] }] }, 'Report', available, 'gemini', 'Test')).toBeNull();
  });

  it('renders missing values honestly and keeps complete sourced fallback briefs', async () => {
    for (const key of ['NVIDIA_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY']) vi.stubEnv(key, '');
    const result = await agentPost(new Request('http://localhost/api/agent', { method: 'POST', body: JSON.stringify({ message: 'Compare BASS-II and FLEX and export a brief' }) }));
    const body = await result.json();
    expect(body.actions[0].href).toContain('EV-PSI25-01%2CEV-PSI69-01');
    expect(body.citations.map((r: { investigation: string }) => r.investigation)).toEqual(expect.arrayContaining(['BASS-II', 'FLEX']));
    expect(body.brief).toContain('14.8 s');
    expect(body.brief).not.toMatch(/: null|undefined/);
    expect(body.analysis.evidenceSummary.length).toBeGreaterThan(50);
    const noMatches = buildSourceResponse('unknown', [], 'deterministic_fallback', 'Test');
    expect(noMatches.citedEvidenceIds).toEqual([]);
  });

  it('rejects invalid IDs and malformed API requests instead of silently changing the evidence scope', async () => {
    expect((await agentPost(new Request('http://localhost/api/agent', { method: 'POST', body: '{' }))).status).toBe(400);
    expect((await agentPost(new Request('http://localhost/api/agent', { method: 'POST', body: JSON.stringify({ message: 'hello', contextIds: ['fake'] }) }))).status).toBe(400);
    const invalid = await analyzePost(new Request('http://localhost/api/analyze', { method: 'POST', body: JSON.stringify({ scenario: { missionId: 'iss', oxygenPercent: 21, pressureKpa: 101.3, airflowCms: 10, material: 'Any', gravityContext: 'Microgravity' }, question: 'Compare results', retrievedEvidenceIds: ['fake'] }) }));
    expect(invalid.status).toBe(400);
  });

  it('covers all 27 records and 21 overviews with explicit review depth, without assumed cabin values', () => {
    for (const record of [...records, ...getAllInvestigations()]) {
      const provenance = getRecordProvenance(record.id);
      expect(provenance.level).not.toBe('manual_review');
      expect(provenance.sourceUrl).toMatch(/^https:\/\/(?:[\w-]+\.)*nasa\.gov\//);
    }
    expect(get('EV-DAFT-01').fuelType).toBe('Not applicable');
    for (const id of ['EV-DAFT-01', 'EV-SAME-01', 'EV-FLEX-2-01']) {
      expect(get(id).oxygenPercent).toBeNull();
      expect(get(id).pressureKpa).toBeNull();
    }
  });

  it('does not call a near value an exact test point', () => {
    const result = classifyAndEvaluateRecord(get('EV-PSI98-01'), { missionId: 'cygnus', oxygenPercent: 21.05, pressureKpa: 100.05, airflowCms: 20.05, material: 'Any', gravityContext: 'Microgravity' }, 'Airflow');
    expect(result.matchingParameters.join(' ')).not.toContain('exact test-point match');
  });

  it('assigns a record to a heatmap cell only when its conditions fall inside that bin', () => {
    const cells = buildCoverageHeatmap(records);
    const cellsFor = (id: string) => cells.filter((c) => c.records.some((r) => r.id === id));
    // Point-tested records land in exactly one cell.
    expect(cellsFor('EV-PSI98-01')).toHaveLength(1);
    expect(cellsFor('EV-PSI98-01')[0]).toMatchObject({ oxygenBinId: 'o2-norm', airflowBinId: 'flow-mid' });
    expect(cellsFor('EV-PSI69-01')).toHaveLength(1);
    expect(cellsFor('EV-PSI69-01')[0]).toMatchObject({ oxygenBinId: 'o2-norm', airflowBinId: 'flow-0' });
    // Range-spanning records establish no single tested pair: BASS-II's
    // oxygen range (16.4–21.0%) and airflow range (1–53 cm/s) cross bins,
    // as do SoFIE-MIST's ranges — so they appear in zero cells.
    expect(cellsFor('EV-PSI25-01')).toHaveLength(0);
    expect(cellsFor('EV-PSI25-02')).toHaveLength(0);
    expect(cellsFor('EV-SOFIE-MIST-01')).toHaveLength(0);
    // …but they are not lost: they are reported as range-spanning.
    const spanning = findRangeSpanningRecords(records, cells).map((r) => r.id);
    expect(spanning).toContain('EV-PSI25-01');
    expect(spanning).toContain('EV-PSI25-02');
    expect(spanning).toContain('EV-SOFIE-MIST-01');
    expect(spanning).not.toContain('EV-PSI98-01');
    // No record appears twice in one cell, and no cell repeats the same
    // investigation list as another cell with different bins.
    for (const cell of cells) {
      expect(new Set(cell.records.map((r) => r.id)).size).toBe(cell.records.length);
    }
  });

  it('does not answer creative-writing prompts with a templated evidence answer', async () => {
    for (const key of ['NVIDIA_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY']) vi.stubEnv(key, '');
    const result = await agentPost(new Request('http://localhost/api/agent', { method: 'POST', body: JSON.stringify({ message: 'Write a haiku about a flame in microgravity' }) }));
    const body = await result.json();
    expect(body.kind).toBe('guide');
    expect(body.citations).toEqual([]);
    expect(body.answer).toMatch(/do not write poems/i);
  });
});
