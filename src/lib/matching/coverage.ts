import type {
  EvidenceRecord,
  MeasurementValue,
} from '@/types/flare';

export interface OxygenBin {
  id: string;
  label: string;
  min: number;
  max: number;
  minExclusive?: boolean;
  maxExclusive?: boolean;
}

export interface AirflowBin {
  id: string;
  label: string;
  min: number;
  max: number;
  minExclusive?: boolean;
  maxExclusive?: boolean;
}

export const OXYGEN_BINS: OxygenBin[] = [
  { id: 'o2-low', label: '< 18% O₂', min: 0, max: 18, maxExclusive: true },
  { id: 'o2-norm', label: '18 ≤ O₂ < 23%', min: 18, max: 23, maxExclusive: true },
  { id: 'o2-mod', label: '23–30% O₂', min: 23, max: 30 },
  { id: 'o2-high', label: '> 30% O₂', min: 30, max: 100, minExclusive: true },
];

export const AIRFLOW_BINS: AirflowBin[] = [
  { id: 'flow-0', label: '0 cm/s (Quiescent)', min: 0, max: 0 },
  { id: 'flow-low', label: '0 < flow ≤ 15 cm/s', min: 0, max: 15, minExclusive: true },
  { id: 'flow-mid', label: '15 < flow ≤ 25 cm/s', min: 15, max: 25, minExclusive: true },
  { id: 'flow-high', label: '> 25 cm/s', min: 25, max: 500, minExclusive: true },
];

export interface HeatmapCell {
  oxygenBinId: string;
  oxygenLabel: string;
  airflowBinId: string;
  airflowLabel: string;
  records: EvidenceRecord[];
  count: number;
}

/**
 * A record belongs in a bin only when its tested conditions actually fall
 * inside that bin: a reported point value must lie in the bin, and a
 * reported range must lie wholly inside the bin. A range that merely
 * overlaps a bin (e.g. BASS-II's 16.4–21.0% O₂ or 1–53 cm/s airflow)
 * spans several bins and therefore establishes no single tested pair —
 * such records are not assigned to any cell (see findRangeSpanningRecords).
 * Point values with no range, and ranges with no point value, are handled
 * the same way: whatever is reported must be fully inside the bin.
 */
function recordInBin(
  point: number | null,
  range: [number, number] | null,
  bin: OxygenBin | AirflowBin
): boolean {
  const inBin = (v: number) =>
    (bin.minExclusive ? v > bin.min : v >= bin.min) &&
    (bin.maxExclusive ? v < bin.max : v <= bin.max);
  if (point !== null && !inBin(point)) return false;
  if (range !== null && (!inBin(range[0]) || !inBin(range[1]))) return false;
  return point !== null || range !== null;
}

export function buildCoverageHeatmap(records: EvidenceRecord[]): HeatmapCell[] {
  const cells: HeatmapCell[] = [];

  for (const oBin of OXYGEN_BINS) {
    for (const fBin of AIRFLOW_BINS) {
      const matching = records.filter(
        (rec) =>
          recordInBin(rec.oxygenPercent, rec.oxygenRangePct, oBin) &&
          recordInBin(rec.airflowCms, rec.airflowRangeCms, fBin)
      );

      cells.push({
        oxygenBinId: oBin.id,
        oxygenLabel: oBin.label,
        airflowBinId: fBin.id,
        airflowLabel: fBin.label,
        records: matching,
        count: matching.length,
      });
    }
  }

  return cells;
}

/**
 * Records that carry oxygen/airflow data but match no heatmap cell because
 * a reported range spans more than one bin. These are range-spanning
 * studies, not missing data — they must be shown separately, not forced
 * into a cell they do not establish.
 */
export function findRangeSpanningRecords(
  records: EvidenceRecord[],
  cells: HeatmapCell[]
): EvidenceRecord[] {
  const placed = new Set(cells.flatMap((c) => c.records.map((r) => r.id)));
  return records.filter(
    (r) =>
      !placed.has(r.id) &&
      (r.oxygenPercent !== null ||
        r.oxygenRangePct !== null ||
        r.airflowCms !== null ||
        r.airflowRangeCms !== null)
  );
}

export interface InvestigationDistributionItem {
  investigationName: string;
  count: number;
  observations: number;
  overviews: number;
}

export function buildInvestigationDistribution(
  records: EvidenceRecord[]
): InvestigationDistributionItem[] {
  const map = new Map<string, InvestigationDistributionItem>();

  for (const r of records) {
    const current = map.get(r.investigationName) ?? {
      investigationName: r.investigationName,
      count: 0,
      observations: 0,
      overviews: 0,
    };
    current.count += 1;
    if (r.recordType === 'experimental_observation') {
      current.observations += 1;
    } else {
      current.overviews += 1;
    }
    map.set(r.investigationName, current);
  }

  return Array.from(map.values());
}

export interface CompletenessSummary {
  totalRecords: number;
  withOxygenPoint: number;
  withPressurePoint: number;
  withAirflowPoint: number;
  withFlameSpreadRate: number;
  withLimitingOxygenIndex: number;
  withDoi: number;
}

export function computeCorpusCompleteness(
  records: EvidenceRecord[]
): CompletenessSummary {
  let withOxygenPoint = 0;
  let withPressurePoint = 0;
  let withAirflowPoint = 0;
  let withFlameSpreadRate = 0;
  let withLimitingOxygenIndex = 0;
  let withDoi = 0;

  for (const r of records) {
    if (r.oxygenPercent !== null) withOxygenPoint += 1;
    if (r.pressureKpa !== null) withPressurePoint += 1;
    if (r.airflowCms !== null) withAirflowPoint += 1;
    if (r.doi !== null) withDoi += 1;

    if (
      r.measurements.some(
        (m) => m.key === 'flameSpreadRate' && m.value !== null
      )
    ) {
      withFlameSpreadRate += 1;
    }
    if (
      r.measurements.some(
        (m) => m.key === 'limitingOxygenIndex' && m.value !== null
      )
    ) {
      withLimitingOxygenIndex += 1;
    }
  }

  return {
    totalRecords: records.length,
    withOxygenPoint,
    withPressurePoint,
    withAirflowPoint,
    withFlameSpreadRate,
    withLimitingOxygenIndex,
    withDoi,
  };
}

export interface ResearchGapSummary {
  id: string;
  title: string;
  severity: 'High' | 'Moderate';
  description: string;
  corpusCount: number;
  caveat: string;
}

export function detectCorpusResearchGaps(
  records: EvidenceRecord[]
): ResearchGapSummary[] {
  const partialGravityCount = records.filter(
    (r) => r.gravityContext === 'Lunar' || r.gravityContext === 'Martian'
  ).length;

  const highO2LowPressureNumericCount = records.filter(
    (r) =>
      r.oxygenPercent !== null &&
      r.oxygenPercent >= 30 &&
      r.pressureKpa !== null &&
      r.pressureKpa <= 65 &&
      r.measurements.some((m) => m.value !== null)
  ).length;

  const smokeYieldNumericCount = records.filter((r) =>
    r.measurements.some(
      (m) =>
        (m.key === 'coYield' || m.key === 'sootYield') && m.value !== null
    )
  ).length;

  const sofieQuantitativeCount = records.filter(
    (r) =>
      r.investigationId.includes('SOFIE') &&
      r.measurements.some((m) => m.value !== null)
  ).length;

  const standardCaveat =
    'No supporting quantitative record in the currently loaded corpus. This does NOT prove NASA never studied that condition.';

  return [
    {
      id: 'gap-partial-gravity',
      title: 'Lunar (0.16g) & Martian (0.38g) Partial-Gravity Buoyancy Transition',
      severity: 'High',
      description:
        'Loaded corpus flight data is concentrated in orbital microgravity (~10⁻⁶ g). Partial-gravity buoyancy transitions affecting upward/concurrent spread and extinction limits lack quantitative spaceflight records here.',
      corpusCount: partialGravityCount,
      caveat: standardCaveat,
    },
    {
      id: 'gap-exploration-numeric',
      title: 'Quantitative Flame Spread Rates in Exploration Atmospheres (34% O₂ / 56.5 kPa)',
      severity: 'High',
      description:
        'The 34% O₂ / 56.5 kPa scenario is illustrative; its association with a particular SAFFIRE-V test has not been verified.',
      corpusCount: highO2LowPressureNumericCount,
      caveat: standardCaveat,
    },
    {
      id: 'gap-smoke-toxicity',
      title: 'Quantitative Smoke Particulate & CO/HCl Toxicant Yields',
      severity: 'Moderate',
      description:
        'SAFFIRE-IV/V and FLEX note combustion product dispersion and cool-flame intermediates, yet tabulated ppm/yield measurements are not ingested in the current JSON dataset.',
      corpusCount: smokeYieldNumericCount,
      caveat: standardCaveat,
    },
    {
      id: 'gap-sofie-release',
      title: 'SoFIE-MIST Point-by-Point Quantitative Matrix',
      severity: 'Moderate',
      description:
        'SoFIE-MIST is represented by historical overview sources. A point-by-point flight matrix has not been extracted in this corpus; current NASA release status is not assessed here.',
      corpusCount: sofieQuantitativeCount,
      caveat: standardCaveat,
    },
  ];
}

export interface CompatibleMeasurementPair {
  key: string;
  label: string;
  unit: string;
  recordAValue: number;
  recordAUncertainty: number | null;
  recordANote: string;
  recordBValue: number;
  recordBUncertainty: number | null;
  recordBNote: string;
}

export interface ComparisonCompatibilityResult {
  compatiblePairs: CompatibleMeasurementPair[];
  incompatibilityReason: string | null;
}

export function findCompatibleNumericalMeasurements(
  recordA: EvidenceRecord,
  recordB: EvidenceRecord
): ComparisonCompatibilityResult {
  const compatiblePairs: CompatibleMeasurementPair[] = [];

  const validA = recordA.measurements.filter(
    (m): m is MeasurementValue & { value: number } =>
      m.value !== null && Number.isFinite(m.value)
  );
  const validB = recordB.measurements.filter(
    (m): m is MeasurementValue & { value: number } =>
      m.value !== null && Number.isFinite(m.value)
  );

  for (const mA of validA) {
    const matchB = validB.find(
      (mB) => mB.key === mA.key && mB.unit === mA.unit && mB.scope === mA.scope
    );
    if (matchB) {
      compatiblePairs.push({
        key: mA.key,
        label: mA.label,
        unit: mA.unit,
        recordAValue: mA.value,
        recordAUncertainty: mA.uncertainty,
        recordANote: mA.conditionNote,
        recordBValue: matchB.value,
        recordBUncertainty: matchB.uncertainty,
        recordBNote: matchB.conditionNote,
      });
    }
  }

  if (compatiblePairs.length === 0) {
    return {
      compatiblePairs: [],
      incompatibilityReason:
        'No shared numerical measurement with identical physical quantities and units exists across both selected records (or one record reports "Not reported" / null). FLARE preserves scientific integrity by refusing to mix incompatible quantities or fabricate comparison values.',
    };
  }

  return {
    compatiblePairs,
    incompatibilityReason: null,
  };
}
