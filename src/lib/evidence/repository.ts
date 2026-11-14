import rawEvidence from '@/data/evidence.json';
import rawInvestigations from '@/data/investigations.json';
import {
  EvidenceCorpusSchema,
  InvestigationCorpusSchema,
} from '@/lib/validation/schemas';
import type {
  EvidenceRecord,
  FuelType,
  InvestigationOverview,
  MeasurementValue,
  MissionPreset,
  Platform,
} from '@/types/flare';

function inferFuelType(materialText: string): FuelType {
  if (/aerosol|diagnostic|particle count/i.test(materialText)) return 'Not applicable';
  if (/gaseous|burner|methane|ethylene|propane|butane|gas-jet|coflow/i.test(materialText)) {
    return 'Gaseous Surrogate';
  }
  if (/droplet|liquid|heptane|methanol/i.test(materialText)) {
    return 'Liquid Droplet';
  }
  if (/thermoplastic|pmma|polymer/i.test(materialText)) {
    return 'Thick Solid Polymer';
  }
  if (/cotton|fabric|sibal|nomex|textile/i.test(materialText)) return 'Thin Solid Fabric';
  return 'Mixed / Other';
}

function inferTags(haystack: string): string[] {
  const lower = haystack.toLowerCase();
  const tagRules: Array<[string, RegExp]> = [
    ['airflow', /airflow|flow|ventilation|velocity|concurrent|opposed|quiescent|cm\/s/],
    ['flame-spread', /spread|flame|propagation|burn|rate|growth/],
    ['extinction', /extinguish|extinction|quench|loi|limiting oxygen|suppress/],
    ['materials', /material|combustible|pmma|sibal|cotton|nomex|silicone|heptane/],
    ['smoke', /smoke|product|toxic|co2|co\b|soot|cool flame/],
    ['oxygen-pressure', /oxygen|o2|o₂|pressure|kpa|hpa|atm|exploration/],
  ];
  const matched = tagRules.filter(([, re]) => re.test(lower)).map(([tag]) => tag);
  return matched.length > 0 ? matched : ['microgravity', 'combustion'];
}

function normalizeInvestigation(raw: Record<string, unknown>): Record<string, unknown> {
  if (
    typeof raw.name === 'string' &&
    typeof raw.program === 'string' &&
    typeof raw.verifiedAt === 'string'
  ) {
    return raw;
  }

  return {
    id: String(raw.id ?? ''),
    name: String(raw.code ?? raw.name ?? raw.id ?? ''),
    program: String(raw.title ?? raw.program ?? raw.code ?? ''),
    platform: raw.platform,
    facility: String(raw.facility ?? ''),
    principalInvestigator:
      typeof raw.principalInvestigator === 'string'
        ? raw.principalInvestigator
        : null,
    summary: String(raw.summary ?? ''),
    status: String(raw.status ?? 'Completed'),
    sourceUrl: String(raw.sourceUrl ?? 'https://ntrs.nasa.gov/'),
    verifiedAt: String(raw.verifiedAt ?? '2026-11-14'),
  };
}

function normalizeEvidenceRecord(raw: Record<string, unknown>): Record<string, unknown> {
  if (
    typeof raw.experimentTitle === 'string' &&
    Array.isArray(raw.measurements) &&
    Array.isArray(raw.evidenceLimitations)
  ) {
    return raw;
  }

  const conditions = (raw.conditions ?? {}) as Record<string, unknown>;
  const conditionRange = (raw.conditionRange ?? {}) as Record<string, unknown>;
  const meas = (raw.measurements ?? {}) as Record<string, unknown>;
  const links = Array.isArray(raw.links)
    ? (raw.links as Array<Record<string, unknown>>)
    : [];

  const note =
    typeof meas.measurementNotes === 'string' && meas.measurementNotes.trim()
      ? meas.measurementNotes.trim()
      : 'Documented in NASA primary source.';

  const rawId = String(raw.id ?? '');
  const labels: Record<string, string> = {
    flameSpreadRate: 'Concurrent flame spread rate',
    opposedFlameSpreadRate: 'Maximum opposed rib flame spread rate',
    rodTipRegressionRate: 'Rod tip regression velocity',
    minimumOxygenBoundary: 'Minimum oxygen on study flammability boundary',
    limitingOxygenIndex: 'Limiting oxygen index',
    burnDurationSec: 'Solid-sample burn duration',
    dropletBurnDuration: 'Droplet burn duration',
    forcedFlowDuration: 'Forced-flow protocol duration',
  };
  const normalizedMeasurements: MeasurementValue[] = Object.entries(meas)
    .filter(([key, value]) => key in labels && value !== null && typeof value === 'object')
    .map(([key, value]) => {
      const measurement = value as Record<string, unknown>;
      return {
        key,
        label: labels[key],
        value: typeof measurement.value === 'number' ? measurement.value : null,
        uncertainty: typeof measurement.uncertainty === 'number' ? measurement.uncertainty : null,
        unit: String(measurement.unit ?? 'Not reported'),
        conditionNote: typeof measurement.conditionNote === 'string' ? measurement.conditionNote : note,
        scope: key === 'minimumOxygenBoundary' ? 'study_boundary' : key === 'forcedFlowDuration' ? 'protocol_duration' : 'test_point',
      };
    });

  const observations: string[] = [];
  if (typeof raw.sampleGeometry === 'string' && raw.sampleGeometry.trim()) {
    observations.push(`Sample geometry: ${raw.sampleGeometry.trim()}`);
  }
  if (typeof meas.measurementNotes === 'string' && meas.measurementNotes.trim()) {
    observations.push(meas.measurementNotes.trim());
  }

  const experimentTitle = String(raw.title ?? raw.experimentTitle ?? '');
  const findings = String(raw.finding ?? raw.findings ?? '');
  const engineeringInterpretation = String(
    raw.interpretation ?? raw.engineeringInterpretation ?? ''
  );
  const material = String(raw.material ?? '');

  return {
    id: rawId,
    recordType:
      raw.recordType === 'experiment_observation'
        ? 'experimental_observation'
        : raw.recordType,
    investigationId: String(raw.investigationId ?? ''),
    investigationName: String(
      raw.experimentCode ?? raw.investigationName ?? raw.investigationId ?? ''
    ),
    experimentTitle,
    platform: raw.platform,
    facility: String(raw.facility ?? ''),
    material,
    fuelType:
      typeof raw.fuelType === 'string'
        ? raw.fuelType
        : inferFuelType(`${String(raw.materialCategory ?? '')} ${material}`),
    oxygenPercent:
      (conditions.oxygenPercent as number | null | undefined) ?? null,
    oxygenRangePct:
      (conditionRange.oxygenRangePct as [number, number] | null | undefined) ??
      null,
    pressureKpa:
      (conditions.pressureKpa as number | null | undefined) ?? null,
    pressureRangeKpa:
      (conditionRange.pressureRangeKpa as [number, number] | null | undefined) ??
      null,
    airflowCms: (conditions.airflowCms as number | null | undefined) ?? null,
    airflowRangeCms:
      (conditionRange.airflowRangeCms as [number, number] | null | undefined) ??
      null,
    gravityContext:
      (conditions.gravityLevel as string | undefined) ??
      (raw.gravityContext as string | undefined) ??
      'Microgravity',
    flowConfiguration:
      typeof raw.flowConfiguration === 'string' ? raw.flowConfiguration : null,
    observations,
    measurements: normalizedMeasurements,
    findings,
    engineeringInterpretation,
    sourceUrl: String(raw.sourceUrl ?? links[0]?.url ?? 'https://ntrs.nasa.gov/'),
    doi: typeof raw.doi === 'string' ? raw.doi : null,
    sourceDocument: String(raw.sourceDocument ?? ''),
    evidenceLimitations: Array.isArray(raw.evidenceLimitations)
      ? raw.evidenceLimitations
      : typeof raw.evidenceLimitations === 'string' &&
          raw.evidenceLimitations.trim()
        ? [raw.evidenceLimitations.trim()]
        : ['Consult primary NASA report for experimental boundaries.'],
    verifiedAt: String(raw.verifiedAt ?? '2026-11-14'),
    tags: Array.isArray(raw.tags)
      ? raw.tags
      : inferTags(
          `${experimentTitle} ${findings} ${engineeringInterpretation} ${material}`
        ),
  };
}

const normalizedEvidence = (rawEvidence as Array<Record<string, unknown>>).map(
  normalizeEvidenceRecord
);
const normalizedInvestigations = (
  rawInvestigations as Array<Record<string, unknown>>
).map(normalizeInvestigation);

const parsedEvidence = EvidenceCorpusSchema.parse(normalizedEvidence);
const parsedInvestigations = InvestigationCorpusSchema.parse(
  normalizedInvestigations
);

export const MISSION_PRESETS: MissionPreset[] = [
  {
    id: 'iss',
    title: 'International Space Station',
    subtitle: 'Orbital Microgravity Research Laboratory',
    description:
      'Explore microgravity combustion research conducted aboard the ISS.',
    platformTarget: 'ISS',
    provenanceNote:
      'Reference baseline: 21.0% O₂, 101.3 kPa, Microgravity (~10⁻⁶ g). Default 10.0 cm/s is a BASS-II experimental duct flow reference—not an assumed uniform ISS cabin ventilation velocity.',
    defaults: {
      oxygenPercent: 21.0,
      pressureKpa: 101.3,
      airflowCms: 10.0,
      material: 'Any',
      gravityContext: 'Microgravity',
    },
  },
  {
    id: 'cygnus',
    title: 'Cygnus Cargo Spacecraft',
    subtitle: 'SAFFIRE Large-Scale Fire Testbed',
    description:
      'Investigate larger-scale spacecraft fire experiments from the SAFFIRE program.',
    platformTarget: 'Cygnus',
    provenanceNote:
      'Reference baseline: 21.0% O₂, 101.0 kPa, 20.0 cm/s SAFFIRE-I/II flow duct setpoint in uncrewed post-ISS departure Cygnus vehicles.',
    defaults: {
      oxygenPercent: 21.0,
      pressureKpa: 101.0,
      airflowCms: 20.0,
      material: 'SIBAL (75% Cotton / 25% Fiberglass)',
      gravityContext: 'Microgravity',
    },
  },
  {
    id: 'exploration',
    title: 'Exploration Atmosphere Scenario',
    subtitle: 'Illustrative 34% O₂ / 56.5 kPa Planning Envelope',
    description:
      'Illustrative NASA exploration atmosphere boundary scenario (34.0% O₂, 56.5 kPa / 8.2 psia).',
    platformTarget: 'Analog / Any',
    provenanceNote:
      'Illustrative exploration atmosphere scenario (34.0% O₂, 56.5 kPa / 8.2 psia from NASA pre-flight exploration planning bounds in NTRS 20170000230, Section IV, p. 7). Note: Actual post-flight SAFFIRE-V tests ran at 25.4–26.9% O₂ and 70.7–76.1 kPa (NTRS 20210011521 Table 1; NTRS 20210017838); 34% O₂ / 56.5 kPa is NOT a measured SAFFIRE-V test point.',
    defaults: {
      oxygenPercent: 34.0,
      pressureKpa: 56.5,
      airflowCms: 20.0,
      material: 'Cast PMMA (Polymethyl Methacrylate)',
      gravityContext: 'Microgravity',
    },
  },
  {
    id: 'custom',
    title: 'Custom Spacecraft',
    subtitle: 'Parametric Boundary Configuration',
    description: 'Define your own environmental parameters.',
    platformTarget: 'Custom',
    provenanceNote:
      'User-defined boundary conditions. FLARE searches the source-linked NASA corpus and explicitly identifies matching conditions vs. environmental gaps.',
    defaults: {
      oxygenPercent: 21.0,
      pressureKpa: 101.3,
      airflowCms: 15.0,
      material: 'Any',
      gravityContext: 'Microgravity',
    },
  },
];

export const RESEARCH_QUESTION_PRESETS: string[] = [
  'How does airflow influence flame spread?',
  'What causes flames to extinguish in microgravity?',
  'How do combustible materials behave?',
  'What is known about smoke and combustion products?',
  'How do oxygen and pressure influence combustion?',
];

export const MATERIAL_OPTIONS: string[] = [
  'Any',
  'SIBAL (75% Cotton / 25% Fiberglass)',
  'Cast PMMA (Polymethyl Methacrylate)',
  'Nomex (Aramid)',
  'Heptane Droplet',
  'Gaseous Burner (Ethylene/Methane Solid Surrogate)',
];

export function getAllEvidenceRecords(): EvidenceRecord[] {
  return parsedEvidence;
}

export function getAllInvestigations(): InvestigationOverview[] {
  return parsedInvestigations;
}

export function getEvidenceById(id: string): EvidenceRecord | undefined {
  return parsedEvidence.find((record) => record.id === id);
}

export function getEvidenceByIds(ids: string[]): EvidenceRecord[] {
  const idSet = new Set(ids);
  return parsedEvidence.filter((record) => idSet.has(record.id));
}

export function getUniqueInvestigationsList(): string[] {
  return Array.from(
    new Set(parsedEvidence.map((r) => r.investigationName))
  );
}

export function getUniqueMaterialsList(): string[] {
  return Array.from(new Set(parsedEvidence.map((r) => r.material)));
}

export function getUniquePlatformsList(): Platform[] {
  return Array.from(new Set(parsedEvidence.map((r) => r.platform)));
}

export interface CorpusStatistics {
  totalRecords: number;
  experimentalObservationCount: number;
  investigationOverviewCount: number;
  uniqueInvestigationCount: number;
  recordsWithNumericalMeasurements: number;
  platformCounts: Record<string, number>;
}

export function getCorpusStatistics(
  records: EvidenceRecord[] = parsedEvidence
): CorpusStatistics {
  const platformCounts: Record<string, number> = {};
  let experimentalObservationCount = 0;
  let investigationOverviewCount = 0;
  let recordsWithNumericalMeasurements = 0;
  const investigationIds = new Set<string>();

  for (const record of records) {
    investigationIds.add(record.investigationId);
    platformCounts[record.platform] =
      (platformCounts[record.platform] ?? 0) + 1;

    if (record.recordType === 'experimental_observation') {
      experimentalObservationCount += 1;
    } else {
      investigationOverviewCount += 1;
    }

    const hasNumeric = record.measurements.some(
      (m) => m.value !== null && Number.isFinite(m.value)
    );
    if (hasNumeric) {
      recordsWithNumericalMeasurements += 1;
    }
  }

  return {
    totalRecords: records.length,
    experimentalObservationCount,
    investigationOverviewCount,
    uniqueInvestigationCount: investigationIds.size,
    recordsWithNumericalMeasurements,
    platformCounts,
  };
}
