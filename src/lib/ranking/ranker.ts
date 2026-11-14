import type {
  EvidenceClassification,
  EvidenceRecord,
  Platform,
  RankedEvidenceResult,
  ScenarioParameters,
} from '@/types/flare';

export const OXYGEN_TOLERANCE_PCT = 2.5;
export const PRESSURE_TOLERANCE_KPA = 12.0;
export const AIRFLOW_TOLERANCE_CMS = 5.5;

export const RANKING_TOLERANCES_EXPLANATION =
  'Retrieval tolerances: ±2.5 percentage points O₂, ±12.0 kPa and ±5.5 cm/s. These are search settings, not experimental uncertainties. Exact equality is distinguished from approximate matches and study-range overlap. Unknown fields never match; range overlap does not prove that a combination was tested.';

const QUESTION_TAG_KEYWORDS: Record<string, string[]> = {
  airflow: ['airflow', 'flow', 'ventilation', 'velocity', 'concurrent', 'opposed', 'quiescent', 'cm/s'],
  'flame-spread': ['spread', 'flame', 'propagation', 'burn', 'rate', 'growth'],
  extinction: ['extinguish', 'extinction', 'quench', 'loi', 'limiting oxygen', 'suppress', 'blow-off', 'blowoff'],
  materials: ['material', 'combustible', 'pmma', 'sibal', 'cotton', 'nomex', 'polymer', 'fabric', 'heptane'],
  smoke: ['smoke', 'product', 'toxic', 'co2', 'co', 'soot', 'cool flame', 'cool-flame'],
  'oxygen-pressure': ['oxygen', 'o2', 'pressure', 'kpa', 'exploration', '34%', '56.5', 'atmosphere'],
};

function isValueWithinDocumentedCondition(
  target: number,
  point: number | null,
  range: [number, number] | null,
  tolerance: number,
  unit: string
): {
  matched: boolean;
  matchKind: 'exact_point' | 'approximate_point' | 'broad_range' | 'none';
  known: boolean;
  detail: string;
} {
  // 1. Check documented single test-point first when available
  if (point !== null) {
    const delta = Math.abs(target - point);
    if (delta < 1e-9) {
      return {
        matched: true,
        matchKind: 'exact_point',
        known: true,
        detail: `${target} ${unit} equals the stored source value (${point} ${unit}); source rounding and experimental differences still apply`,
      };
    }
    if (delta <= tolerance) {
      return {
        matched: true,
        matchKind: 'approximate_point',
        known: true,
        detail: `${target} ${unit} within ±${tolerance} ${unit} tolerance of documented test point ${point} ${unit} (Δ=${delta.toFixed(1)} ${unit})`,
      };
    }
  }

  // 2. Check documented multi-test / investigation range when available
  if (range) {
    const [min, max] = range;
    if (target >= min && target <= max) {
      return {
        matched: true,
        matchKind: 'broad_range',
        known: true,
        detail:
          min === max
            ? `${target} ${unit} matches documented ${min} ${unit}`
            : `${target} ${unit} falls within documented investigation range ${min}–${max} ${unit} (broad range overlap; does not prove this exact combination was tested)`,
      };
    }
    if (point === null) {
      return {
        matched: false,
        matchKind: 'none',
        known: true,
        detail: `requested ${target} ${unit} outside documented range ${min}–${max} ${unit}`,
      };
    }
  }

  if (point !== null) {
    return {
      matched: false,
      matchKind: 'none',
      known: true,
      detail: `requested ${target} ${unit} vs documented test point ${point} ${unit} (outside ±${tolerance} ${unit} tolerance)`,
    };
  }

  return {
    matched: false,
    matchKind: 'none',
    known: false,
    detail: 'Not reported in source record (unknown fields are never treated as matches)',
  };
}

function getExpectedPlatformForMission(
  missionId: ScenarioParameters['missionId']
): Platform | null {
  if (missionId === 'iss') return 'ISS';
  if (missionId === 'cygnus') return 'Cygnus';
  return null;
}

function computeQuestionOverlap(question: string, record: EvidenceRecord): number {
  const lower = question.toLowerCase();
  let score = 0;

  for (const [tag, keywords] of Object.entries(QUESTION_TAG_KEYWORDS)) {
    const questionHits = keywords.some((kw) => lower.includes(kw));
    if (questionHits && record.tags.includes(tag)) {
      score += 2;
    }
  }

  // Direct lexical hits against title, material, findings
  const tokens = lower
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4);
  const haystack = `${record.investigationName} ${record.experimentTitle} ${record.material} ${record.findings}`.toLowerCase();
  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 1;
    }
  }

  return score;
}

function getTierOrder(classification: EvidenceClassification): number {
  switch (classification) {
    case 'Approximate condition match':
      return 1;
    case 'Cross-platform environmental analog':
      return 2;
    case 'Same platform / differing conditions':
      return 3;
    case 'Partial evidence':
      return 4;
    case 'Insufficient evidence':
      return 5;
  }
}

const CANONICAL_MATERIAL_TOKENS = [
  'sibal',
  'pmma',
  'nomex',
  'heptane',
  'silicone',
  'ethylene',
  'methane',
];

function isMaterialMatch(requested: string, documented: string): boolean {
  const reqLower = requested.toLowerCase();
  const docLower = documented.toLowerCase();
  if (
    reqLower === docLower ||
    docLower.includes(reqLower) ||
    reqLower.includes(docLower)
  ) {
    return true;
  }
  return CANONICAL_MATERIAL_TOKENS.some(
    (token) => reqLower.includes(token) && docLower.includes(token)
  );
}

export function classifyAndEvaluateRecord(
  record: EvidenceRecord,
  scenario: ScenarioParameters,
  question: string
): RankedEvidenceResult {
  const matchingParameters: string[] = [];
  const missingOrDifferingParameters: string[] = [];

  // 1. Gravity check
  const gravityMatch = record.gravityContext === scenario.gravityContext;
  if (gravityMatch) {
    matchingParameters.push(`Gravity (${record.gravityContext})`);
  } else {
    missingOrDifferingParameters.push(
      `Gravity (requested ${scenario.gravityContext} vs documented ${record.gravityContext})`
    );
  }

  // 2. Material check
  const isAnyMaterial =
    scenario.material === 'Any' || scenario.material.trim() === '';
  const materialExactMatch =
    isAnyMaterial || isMaterialMatch(scenario.material, record.material);
  if (isAnyMaterial) {
    matchingParameters.push(`Material scope (All; record tests ${record.material})`);
  } else if (materialExactMatch) {
    matchingParameters.push(`Material (${record.material})`);
  } else {
    missingOrDifferingParameters.push(
      `Material (requested ${scenario.material} vs documented ${record.material})`
    );
  }

  // 3. Oxygen check
  const o2Check = isValueWithinDocumentedCondition(
    scenario.oxygenPercent,
    record.oxygenPercent,
    record.oxygenRangePct,
    OXYGEN_TOLERANCE_PCT,
    '% O₂'
  );
  if (o2Check.matched) {
    matchingParameters.push(`Oxygen % (${o2Check.detail})`);
  } else {
    missingOrDifferingParameters.push(`Oxygen % (${o2Check.detail})`);
  }

  // 4. Pressure check
  const pCheck = isValueWithinDocumentedCondition(
    scenario.pressureKpa,
    record.pressureKpa,
    record.pressureRangeKpa,
    PRESSURE_TOLERANCE_KPA,
    'kPa'
  );
  if (pCheck.matched) {
    matchingParameters.push(`Pressure kPa (${pCheck.detail})`);
  } else {
    missingOrDifferingParameters.push(`Pressure kPa (${pCheck.detail})`);
  }

  // 5. Airflow check
  const flowCheck = isValueWithinDocumentedCondition(
    scenario.airflowCms,
    record.airflowCms,
    record.airflowRangeCms,
    AIRFLOW_TOLERANCE_CMS,
    'cm/s'
  );
  if (flowCheck.matched) {
    matchingParameters.push(`Airflow cm/s (${flowCheck.detail})`);
  } else {
    missingOrDifferingParameters.push(`Airflow cm/s (${flowCheck.detail})`);
  }

  const expectedPlatform = getExpectedPlatformForMission(scenario.missionId);
  const samePlatform =
    expectedPlatform !== null && record.platform === expectedPlatform;
  const isDifferentSpecifiedPlatform =
    expectedPlatform !== null && record.platform !== expectedPlatform;

  const atmosphericMatches =
    (o2Check.matched ? 1 : 0) +
    (pCheck.matched ? 1 : 0) +
    (flowCheck.matched ? 1 : 0);

  const allThreePointMatched =
    (o2Check.matchKind === 'exact_point' || o2Check.matchKind === 'approximate_point') &&
    (pCheck.matchKind === 'exact_point' || pCheck.matchKind === 'approximate_point') &&
    (flowCheck.matchKind === 'exact_point' || flowCheck.matchKind === 'approximate_point');

  const alignedBoundaryCount =
    (gravityMatch ? 1 : 0) +
    (materialExactMatch ? 1 : 0) +
    atmosphericMatches;

  const questionOverlapScore = computeQuestionOverlap(question, record);

  // Critical scientific credibility rule:
  // Never label a record "Approximate condition match" solely because it came from the selected spacecraft or overlapped a broad investigation range.
  // "Approximate condition match" requires an experimental_observation with documented single-point oxygen, pressure, and airflow within tolerance,
  // matching gravity and material, and (if a specific spacecraft platform was selected) matching that platform.
  let classification: EvidenceClassification;

  if (
    record.recordType === 'experimental_observation' &&
    !isDifferentSpecifiedPlatform &&
    gravityMatch &&
    materialExactMatch &&
    allThreePointMatched
  ) {
    classification = 'Approximate condition match';
  } else if (
    !samePlatform &&
    gravityMatch &&
    atmosphericMatches >= 2 &&
    (materialExactMatch || isAnyMaterial || atmosphericMatches === 3)
  ) {
    classification = 'Cross-platform environmental analog';
  } else if (samePlatform) {
    classification = 'Same platform / differing conditions';
  } else if (
    gravityMatch &&
    (atmosphericMatches >= 1 || questionOverlapScore >= 2 || materialExactMatch)
  ) {
    classification = 'Partial evidence';
  } else {
    classification = 'Insufficient evidence';
  }

  return {
    record,
    classification,
    relevanceTierOrder: getTierOrder(classification),
    alignedBoundaryCount,
    totalBoundaryCount: 5,
    matchingParameters,
    missingOrDifferingParameters,
    questionOverlapScore,
  };
}

export function rankEvidenceCorpus(
  records: EvidenceRecord[],
  scenario: ScenarioParameters,
  question: string
): RankedEvidenceResult[] {
  const evaluated = records.map((record) =>
    classifyAndEvaluateRecord(record, scenario, question)
  );

  return evaluated.sort((a, b) => {
    // 1. Primary: Classification tier order
    if (a.relevanceTierOrder !== b.relevanceTierOrder) {
      return a.relevanceTierOrder - b.relevanceTierOrder;
    }

    // 2. Experimental observations outrank investigation overviews when tied
    if (a.record.recordType !== b.record.recordType) {
      return a.record.recordType === 'experimental_observation' ? -1 : 1;
    }

    // 3. Number of aligned boundary conditions
    if (a.alignedBoundaryCount !== b.alignedBoundaryCount) {
      return b.alignedBoundaryCount - a.alignedBoundaryCount;
    }

    // 4. Question keyword / tag overlap
    if (a.questionOverlapScore !== b.questionOverlapScore) {
      return b.questionOverlapScore - a.questionOverlapScore;
    }

    // 5. Deterministic ID tie-breaker
    return a.record.id.localeCompare(b.record.id);
  });
}
