import { getAllSolidTestRows, type SolidMaterialName, type SolidTestRecord } from '@/lib/evidence/solid-dataset';
import type { GravityContext } from '@/types/flare';

export type SameRowVerdict = 'Burned' | 'Mixed' | 'No Flame' | 'No Data';
export type VerdictConfidence = 'supported' | 'extrapolated' | 'no_data';

export interface ConditionVerdictQuery {
  material: string;
  oxygenPercent?: number | null;
  pressureKpa?: number | null;
  airflowCms?: number | null;
  thicknessMm?: number | null;
  flowDirection?: 'Opposed' | 'Concurrent' | null;
  gravityContext?: GravityContext | null;
}

export interface SourcedGap {
  parameter: string;
  reason: string;
  sourceRef: string;
  sourceUrl: string;
}

export interface ConditionVerdictResult {
  verdict: SameRowVerdict;
  confidence: VerdictConfidence;
  resolvedMaterial: SolidMaterialName | null;
  requestedMaterial: string;
  requestedParams: string[];
  materialRowCount: number;
  eligibleRowCount: number;
  excludedReusedCount: number;
  matchedRows: SolidTestRecord[];
  sourcedGaps: SourcedGap[];
  summary: string;
  caveats: string[];
}

const OXYGEN_TOLERANCE_PCT = 1.5;
const AIRFLOW_TOLERANCE_CMS = 2.5;
const THICKNESS_TOLERANCE_MM = 0.5;
const PRESSURE_TOLERANCE_KPA = 10.0;
const BASS_REPORT_URL = 'https://ntrs.nasa.gov/citations/20210011385';

export function resolveSolidMaterial(rawMaterial: string): SolidMaterialName | null {
  const m = rawMaterial.trim().toLowerCase();
  if (!m || m === 'any') return null;
  if (/pmma|acrylic|polymethyl/i.test(m)) return 'PMMA Acrylic';
  if (/sibal|cotton|fiberglass/i.test(m)) return 'SIBAL Fabric';
  if (/nomex/i.test(m)) return 'Nomex III';
  return null;
}

function rangesOverlap(aMin: number, aMax: number, bMin: number, bMax: number): boolean {
  return aMax >= bMin && bMax >= aMin;
}

function rowHasOxygen(row: SolidTestRecord): boolean {
  return row.oxygenRangePct !== null || row.oxygenInitialPct !== null;
}

function rowMatchesOxygen(row: SolidTestRecord, targetO2: number): boolean {
  const range = row.oxygenRangePct ?? (row.oxygenInitialPct !== null ? [row.oxygenInitialPct, row.oxygenInitialPct] : null);
  if (!range) return false;
  return rangesOverlap(range[0], range[1], targetO2 - OXYGEN_TOLERANCE_PCT, targetO2 + OXYGEN_TOLERANCE_PCT);
}

function rowHasAirflow(row: SolidTestRecord): boolean {
  return row.airflowRangeCms !== null || row.airflowCms !== null;
}

function rowMatchesAirflow(row: SolidTestRecord, targetFlow: number): boolean {
  const range = row.airflowRangeCms ?? (row.airflowCms !== null ? [row.airflowCms, row.airflowCms] : null);
  if (!range) return false;
  return rangesOverlap(range[0], range[1], targetFlow - AIRFLOW_TOLERANCE_CMS, targetFlow + AIRFLOW_TOLERANCE_CMS);
}

function buildRequestedParams(query: ConditionVerdictQuery): string[] {
  const params: string[] = [`Material: ${query.material}`];
  if (query.gravityContext) params.push(`Gravity: ${query.gravityContext}`);
  if (query.oxygenPercent != null) params.push(`O₂: ${query.oxygenPercent.toFixed(1)}% (±${OXYGEN_TOLERANCE_PCT}%)`);
  if (query.pressureKpa != null) params.push(`Pressure: ${query.pressureKpa.toFixed(1)} kPa (±${PRESSURE_TOLERANCE_KPA} kPa)`);
  if (query.airflowCms != null) params.push(`Airflow: ${query.airflowCms.toFixed(1)} cm/s (±${AIRFLOW_TOLERANCE_CMS} cm/s)`);
  if (query.thicknessMm != null) params.push(`Thickness: ${query.thicknessMm.toFixed(1)} mm (±${THICKNESS_TOLERANCE_MM} mm)`);
  if (query.flowDirection) params.push(`Flow Direction: ${query.flowDirection}`);
  return params;
}

/**
 * Strict Same-Row Condition Verdict Engine:
 * A test row counts ONLY if that single row records EVERY requested parameter.
 * When any requested parameter is missing from the row or untested in the solid corpus,
 * the engine abstains with `No Data` and emits explicit sourced gaps.
 */
export function evaluateStrictSameRowVerdict(
  query: ConditionVerdictQuery,
  allRows: SolidTestRecord[] = getAllSolidTestRows()
): ConditionVerdictResult {
  const requestedParams = buildRequestedParams(query);
  const resolvedMaterial = resolveSolidMaterial(query.material);
  const baseCaveats = [
    'Observed NASA BASS-II / BASS test outcomes only — not a flight-safety rating or flammability prediction.',
    'Gas and droplet tests (ACME, CFI, SPICE) are kept strictly separate and never pooled into solid-material verdicts.',
  ];

  if (!resolvedMaterial) {
    return {
      verdict: 'No Data',
      confidence: 'no_data',
      resolvedMaterial: null,
      requestedMaterial: query.material,
      requestedParams,
      materialRowCount: 0,
      eligibleRowCount: 0,
      excludedReusedCount: 0,
      matchedRows: [],
      sourcedGaps: [
        {
          parameter: 'Material',
          reason:
            query.material.trim().toLowerCase() === 'any' || !query.material.trim()
              ? 'Select a specific solid material. The row-level NASA BASS-II solid corpus covers PMMA Acrylic, SIBAL Fabric, and Nomex III.'
              : `"${query.material}" is not in FLARE's row-level NASA BASS-II solid corpus (which covers PMMA Acrylic, SIBAL Fabric, and Nomex III). Foams, wiring, and unlisted polymers are an untested gap here.`,
          sourceRef: 'NASA/TM-20210011385 (Tables 5.1, 7.1, A.2)',
          sourceUrl: BASS_REPORT_URL,
        },
      ],
      summary: `No Data: "${query.material}" has zero row-level tests in the BASS-II solid-material corpus.`,
      caveats: baseCaveats,
    };
  }

  const allMaterialRows = allRows.filter((r) => r.material === resolvedMaterial);
  const activeRows = allMaterialRows.filter((r) => !r.reusedSample);
  const excludedReusedCount = allMaterialRows.length - activeRows.length;
  const sourcedGaps: SourcedGap[] = [];
  const tableRef = activeRows[0]?.tableRef ?? 'NASA/TM-20210011385';
  const printedPage = activeRows[0]?.printedPage ?? '';

  if (query.gravityContext && query.gravityContext !== 'Microgravity') {
    sourcedGaps.push({
      parameter: 'Gravity',
      reason: `All ${activeRows.length} ${resolvedMaterial} rows in ${tableRef} (${printedPage}) were conducted in ISS microgravity (~10⁻⁶ g). ${query.gravityContext} gravity is untested in this dataset.`,
      sourceRef: `${tableRef}, ${printedPage}`,
      sourceUrl: BASS_REPORT_URL,
    });
  }

  if (query.pressureKpa != null) {
    const withPressure = activeRows.filter((r) => r.pressureKpa !== null);
    if (withPressure.length === 0) {
      sourcedGaps.push({
        parameter: 'Ambient Pressure (kPa)',
        reason: `${tableRef} (${printedPage}) does not record per-row ambient pressure (kPa). Same-row pressure matching cannot be established from this table alone.`,
        sourceRef: `${tableRef}, ${printedPage}`,
        sourceUrl: BASS_REPORT_URL,
      });
    }
  }

  if (query.airflowCms != null) {
    const withFlow = activeRows.filter(rowHasAirflow);
    if (withFlow.length === 0) {
      sourcedGaps.push({
        parameter: 'Airflow Velocity (cm/s)',
        reason:
          resolvedMaterial === 'Nomex III'
            ? `${tableRef} (${printedPage}) prints fan and air instrument display readings only, not physical airflow velocity (cm/s).`
            : `${tableRef} (${printedPage}) does not record physical airflow velocity (cm/s) for ${resolvedMaterial}.`,
        sourceRef: `${tableRef}, ${printedPage}`,
        sourceUrl: BASS_REPORT_URL,
      });
    }
  }

  if (query.thicknessMm != null) {
    const withThickness = activeRows.filter((r) => r.thicknessMm !== null);
    if (withThickness.length === 0) {
      sourcedGaps.push({
        parameter: 'Sample Thickness (mm)',
        reason: `${tableRef} (${printedPage}) does not record sample thickness (mm) for ${resolvedMaterial}.`,
        sourceRef: `${tableRef}, ${printedPage}`,
        sourceUrl: BASS_REPORT_URL,
      });
    }
  }

  // Strictly keep ONLY rows that individually contain EVERY requested parameter
  const eligibleRows = activeRows.filter((row) => {
    if (query.gravityContext && row.gravityContext !== query.gravityContext) return false;
    if (query.oxygenPercent != null && !rowHasOxygen(row)) return false;
    if (query.pressureKpa != null && row.pressureKpa === null) return false;
    if (query.airflowCms != null && !rowHasAirflow(row)) return false;
    if (query.thicknessMm != null && row.thicknessMm === null) return false;
    if (query.flowDirection && row.flowDirection !== query.flowDirection) return false;
    return true;
  });

  if (eligibleRows.length === 0) {
    if (sourcedGaps.length === 0) {
      sourcedGaps.push({
        parameter: 'Combined Row Coverage',
        reason: `No single ${resolvedMaterial} row in ${tableRef} (${printedPage}) records all requested parameters simultaneously.`,
        sourceRef: `${tableRef}, ${printedPage}`,
        sourceUrl: BASS_REPORT_URL,
      });
    }
    return {
      verdict: 'No Data',
      confidence: 'no_data',
      resolvedMaterial,
      requestedMaterial: query.material,
      requestedParams,
      materialRowCount: activeRows.length,
      eligibleRowCount: 0,
      excludedReusedCount,
      matchedRows: [],
      sourcedGaps,
      summary: `No Data: 0 of ${activeRows.length} ${resolvedMaterial} rows in ${tableRef} record all requested parameters on the same row.`,
      caveats: baseCaveats,
    };
  }

  const matchedRows = eligibleRows.filter((row) => {
    if (query.oxygenPercent != null && !rowMatchesOxygen(row, query.oxygenPercent)) return false;
    if (query.pressureKpa != null && (row.pressureKpa === null || Math.abs(row.pressureKpa - query.pressureKpa) > PRESSURE_TOLERANCE_KPA)) {
      return false;
    }
    if (query.airflowCms != null && !rowMatchesAirflow(row, query.airflowCms)) return false;
    if (query.thicknessMm != null && (row.thicknessMm === null || Math.abs(row.thicknessMm - query.thicknessMm) > THICKNESS_TOLERANCE_MM)) {
      return false;
    }
    return true;
  });

  if (matchedRows.length === 0) {
    const o2Vals = eligibleRows
      .flatMap((r) => r.oxygenRangePct ?? (r.oxygenInitialPct !== null ? [r.oxygenInitialPct] : []))
      .filter((v): v is number => v !== null);
    const flowVals = eligibleRows
      .flatMap((r) => r.airflowRangeCms ?? (r.airflowCms !== null ? [r.airflowCms] : []))
      .filter((v): v is number => v !== null);
    const thickVals = eligibleRows.map((r) => r.thicknessMm).filter((v): v is number => v !== null);

    const rangeParts: string[] = [];
    if (o2Vals.length) rangeParts.push(`O₂ ${Math.min(...o2Vals).toFixed(1)}–${Math.max(...o2Vals).toFixed(1)}%`);
    if (flowVals.length) rangeParts.push(`airflow ${Math.min(...flowVals).toFixed(1)}–${Math.max(...flowVals).toFixed(1)} cm/s`);
    if (thickVals.length) rangeParts.push(`thickness ${Math.min(...thickVals).toFixed(1)}–${Math.max(...thickVals).toFixed(1)} mm`);

    sourcedGaps.push({
      parameter: 'Condition Window',
      reason: `${eligibleRows.length} ${resolvedMaterial} rows contain the requested fields, but none fall within the matching window. Observed ranges in ${tableRef}: ${rangeParts.join(', ')}.`,
      sourceRef: `${tableRef}, ${printedPage}`,
      sourceUrl: BASS_REPORT_URL,
    });

    return {
      verdict: 'No Data',
      confidence: 'no_data',
      resolvedMaterial,
      requestedMaterial: query.material,
      requestedParams,
      materialRowCount: activeRows.length,
      eligibleRowCount: eligibleRows.length,
      excludedReusedCount,
      matchedRows: [],
      sourcedGaps,
      summary: `No Data: ${eligibleRows.length} eligible ${resolvedMaterial} rows exist, but 0 match the requested condition window.`,
      caveats: baseCaveats,
    };
  }

  const outcomes = new Set(matchedRows.map((r) => r.outcome));
  let verdict: SameRowVerdict;
  if (outcomes.size === 1 && outcomes.has('Burned')) {
    verdict = 'Burned';
  } else if (outcomes.size === 1 && outcomes.has('No Flame')) {
    verdict = 'No Flame';
  } else {
    verdict = 'Mixed';
  }

  const confidence: VerdictConfidence = matchedRows.length >= 5 ? 'supported' : 'extrapolated';
  const caveats = [...baseCaveats];
  if (matchedRows.some((r) => r.o2Uncertain)) {
    caveats.push('Included GMT45-T1/T2 carry NASA footnote b: O₂ readings in those two tests might be inaccurate.');
  }
  if (excludedReusedCount > 0 && resolvedMaterial === 'SIBAL Fabric') {
    caveats.push(`${excludedReusedCount} reused SIBAL samples in Table 7.1 are excluded from verdicts per NASA/TM-20210011385.`);
  }

  return {
    verdict,
    confidence,
    resolvedMaterial,
    requestedMaterial: query.material,
    requestedParams,
    materialRowCount: activeRows.length,
    eligibleRowCount: eligibleRows.length,
    excludedReusedCount,
    matchedRows,
    sourcedGaps,
    summary: `${verdict} (${confidence === 'supported' ? 'Supported' : 'Extrapolated'}): ${matchedRows.length} of ${eligibleRows.length} eligible ${resolvedMaterial} rows in ${tableRef} (${printedPage}) match every requested condition.`,
    caveats,
  };
}
