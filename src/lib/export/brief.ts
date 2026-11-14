import { getRecordProvenance, type RecordProvenance } from '@/lib/evidence/provenance';
import { formatMeasurementValue, formatNumericParam } from '@/lib/utils';
import type {
  AIAnalysisResponse,
  EvidenceRecord,
  MissionPreset,
  RankedEvidenceResult,
  ScenarioParameters,
} from '@/types/flare';

export interface ResearchBriefPayload {
  title: string;
  generatedAt: string;
  disclaimer: string;
  researchQuestion: string;
  missionScenario: {
    id: string;
    title: string;
    provenanceNote: string;
  };
  environmentalParameters: ScenarioParameters;
  rankedEvidence: Array<{
    id: string;
    investigationId: string;
    investigationName: string;
    recordType: string;
    classification: string;
    alignedBoundaryCount: number;
    platform: string;
    material: string;
    documentedConditions: {
      oxygenPercent: string;
      pressureKpa: string;
      airflowCms: string;
      gravityContext: string;
    };
    measurements: Array<{
      key: string;
      value: number | null;
      uncertainty: number | null;
      unit: string;
      scope: string;
      label: string;
      formattedValue: string;
      conditionNote: string;
    }>;
    documentedFindings: string;
    provenance: RecordProvenance;
    engineeringInterpretation: string;
    limitations: string[];
    sourceDocument: string;
    sourceUrl: string;
    doi: string | null;
  }>;
  analysisSynthesis: AIAnalysisResponse;
}

const NON_CERTIFICATION_DISCLAIMER =
  'PRE-MISSION RESEARCH INTELLIGENCE ONLY. FLARE is an independent research tool for the NASA Space Apps Challenge 2026. It is NOT a NASA-certified safety engine, onboard fire detector, or operational emergency response directive.';

export function buildEngineeringBriefPayload(
  question: string,
  preset: MissionPreset,
  scenario: ScenarioParameters,
  rankedResults: RankedEvidenceResult[],
  analysis: AIAnalysisResponse
): ResearchBriefPayload {
  return {
    title: 'FLARE Engineering Research Brief — Microgravity Fire Safety Intelligence',
    generatedAt: new Date().toISOString(),
    disclaimer: NON_CERTIFICATION_DISCLAIMER,
    researchQuestion: question,
    missionScenario: {
      id: preset.id,
      title: preset.title,
      provenanceNote: preset.provenanceNote,
    },
    environmentalParameters: scenario,
    rankedEvidence: rankedResults.map((item) => ({
      id: item.record.id,
      investigationId: item.record.investigationId,
      investigationName: item.record.investigationName,
      recordType: item.record.recordType,
      classification: item.classification,
      alignedBoundaryCount: item.alignedBoundaryCount,
      platform: item.record.platform,
      material: item.record.material,
      documentedConditions: {
        oxygenPercent: formatNumericParam(
          item.record.oxygenPercent,
          '%',
          item.record.oxygenRangePct
        ),
        pressureKpa: formatNumericParam(
          item.record.pressureKpa,
          'kPa',
          item.record.pressureRangeKpa
        ),
        airflowCms: formatNumericParam(
          item.record.airflowCms,
          'cm/s',
          item.record.airflowRangeCms
        ),
        gravityContext: item.record.gravityContext,
      },
      measurements: item.record.measurements.map((m) => ({
        key: m.key, value: m.value, uncertainty: m.uncertainty, unit: m.unit, scope: m.scope,
        label: m.label,
        formattedValue: formatMeasurementValue(m),
        conditionNote: m.conditionNote,
      })),
      documentedFindings: item.record.findings,
      provenance: getRecordProvenance(item.record.id),
      engineeringInterpretation: item.record.engineeringInterpretation,
      limitations: item.record.evidenceLimitations,
      sourceDocument: item.record.sourceDocument,
      sourceUrl: item.record.sourceUrl,
      doi: item.record.doi,
    })),
    analysisSynthesis: analysis,
  };
}

export function generateBriefMarkdown(payload: ResearchBriefPayload): string {
  const lines: string[] = [
    `# ${payload.title}`,
    '',
    `> **Disclaimer:** ${payload.disclaimer}`,
    `> **Generated:** ${payload.generatedAt}`,
    '',
    '## 1. Research Question',
    payload.researchQuestion,
    '',
    '## 2. Selected Mission Scenario',
    `- **Scenario:** ${payload.missionScenario.title} (\`${payload.missionScenario.id}\`)`,
    `- **Scenario Provenance:** ${payload.missionScenario.provenanceNote}`,
    '',
    '## 3. Configured Environmental Parameters',
    `- **Oxygen Concentration:** ${payload.environmentalParameters.oxygenPercent.toFixed(1)}% O₂`,
    `- **Ambient Pressure:** ${payload.environmentalParameters.pressureKpa.toFixed(1)} kPa`,
    `- **Forced Airflow Velocity:** ${payload.environmentalParameters.airflowCms.toFixed(1)} cm/s`,
    `- **Target Material:** ${payload.environmentalParameters.material}`,
    `- **Gravity Context:** ${payload.environmentalParameters.gravityContext}`,
    '',
    '## 4. Ranked NASA Evidence',
    ...payload.rankedEvidence.flatMap((ev) => [
      `### ${ev.investigationName} — ${ev.id} (${ev.classification})`,
      `- **Investigation ID:** ${ev.investigationId} | **Record Type:** ${ev.recordType}`,
      `- **Platform & Material:** ${ev.platform} · ${ev.material}`,
      `- **Documented Conditions:** O₂: ${ev.documentedConditions.oxygenPercent} | Pressure: ${ev.documentedConditions.pressureKpa} | Airflow: ${ev.documentedConditions.airflowCms} | Gravity: ${ev.documentedConditions.gravityContext}`,
      `- **Boundary Alignment:** ${ev.alignedBoundaryCount} / 5 criteria`,
      `- **Documented Experimental Findings:** ${ev.documentedFindings}`,
      `- **Documented Measurements:** ${
        ev.measurements.length > 0
          ? ev.measurements
              .map((m) => `${m.label}: ${m.formattedValue}`)
              .join('; ')
          : 'Not reported'
      }`,
      `- **Engineering Interpretation:** ${ev.engineeringInterpretation}`,
      `- **Source Reference:** ${ev.sourceDocument} (${ev.sourceUrl})${ev.doi ? ` | DOI: ${ev.doi}` : ''}`,
      '',
    ]),
    '## 5. Analysis Synthesis Summary (Review Against Sources)',
    payload.analysisSynthesis.evidenceSummary,
    '',
    '## 6. Engineering Implications (Cautious Interpretation)',
    ...payload.analysisSynthesis.engineeringImplications.map((imp) => `- ${imp}`),
    '',
    '## 7. Evidence Limitations & Research Gaps',
    ...payload.analysisSynthesis.limitations.map((lim) => `- ${lim}`),
    '',
    '## 8. Source References',
    ...payload.rankedEvidence.map(
      (ev) => `- [${ev.id}] ${ev.investigationName} (${ev.investigationId}): ${ev.sourceDocument} — ${ev.sourceUrl}`
    ),
    '',
    '## 9. AI & Verification Disclosure',
    `- **Response Mode:** ${payload.analysisSynthesis.responseMode}`,
    `- **Provider Note:** ${payload.analysisSynthesis.providerNote ?? 'Standard grounded analysis'}`,
    `- **Cited Evidence IDs:** ${payload.analysisSynthesis.citedEvidenceIds.join(', ') || 'None'}`,
    `- **Plain-Language Synthesis:** ${payload.analysisSynthesis.plainLanguageExplanation}`,
    '',
  ];

  return lines.join('\n');
}

export function generateSingleRecordMarkdown(record: EvidenceRecord): string {
  const lines: string[] = [
    `# FLARE Evidence Record — ${record.investigationName} (${record.id})`,
    '',
    `> **Disclaimer:** ${NON_CERTIFICATION_DISCLAIMER}`,
    '',
    `- **Investigation ID:** ${record.investigationId}`,
    `- **Experiment Title:** ${record.experimentTitle}`,
    `- **Record Type:** ${record.recordType}`,
    `- **Platform / Facility:** ${record.platform} / ${record.facility}`,
    `- **Material / Fuel Type:** ${record.material} (${record.fuelType})`,
    `- **Oxygen:** ${formatNumericParam(record.oxygenPercent, '%', record.oxygenRangePct)}`,
    `- **Pressure:** ${formatNumericParam(record.pressureKpa, 'kPa', record.pressureRangeKpa)}`,
    `- **Airflow:** ${formatNumericParam(record.airflowCms, 'cm/s', record.airflowRangeCms)}`,
    `- **Gravity:** ${record.gravityContext}`,
    '',
    '## Experimental Observations',
    ...record.observations.map((o) => `- ${o}`),
    '',
    '## Measurements',
    ...(record.measurements.length > 0
      ? record.measurements.map(
          (m) => `- **${m.label}:** ${formatMeasurementValue(m)} (${m.conditionNote})`
        )
      : ['- Not reported']),
    '',
    '## Documented Findings',
    record.findings,
    '',
    '## Engineering Interpretation',
    record.engineeringInterpretation,
    '',
    '## Limitations',
    ...record.evidenceLimitations.map((l) => `- ${l}`),
    '',
    '## Source Provenance',
    `- **Document:** ${record.sourceDocument}`,
    `- **URL:** ${record.sourceUrl}`,
    `- **DOI:** ${record.doi ?? 'Not reported'}`,
    `- **Provenance:** ${getRecordProvenance(record.id).label} (${getRecordProvenance(record.id).reviewedAt})`,
    '',
  ];

  return lines.join('\n');
}

export function triggerBrowserDownload(
  filename: string,
  content: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
