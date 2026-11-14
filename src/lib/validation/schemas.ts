import { z } from 'zod';

export const PlatformSchema = z.enum([
  'ISS',
  'Cygnus',
  'Space Shuttle',
  'Drop Tower / Ground Analog',
]);

export const GravityContextSchema = z.enum([
  'Microgravity',
  'Lunar',
  'Martian',
  'Earth',
]);

export const FuelTypeSchema = z.enum([
  'Thin Solid Fabric',
  'Thick Solid Polymer',
  'Liquid Droplet',
  'Gaseous Surrogate',
  'Mixed / Other',
  'Not applicable',
]);

export const RecordTypeSchema = z.enum([
  'experimental_observation',
  'investigation_overview',
]);

export const MissionPresetIdSchema = z.enum([
  'iss',
  'cygnus',
  'exploration',
  'custom',
]);

export const MeasurementValueSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  value: z.number().nullable(),
  uncertainty: z.number().nonnegative().nullable(),
  unit: z.string().min(1),
  conditionNote: z.string().min(1),
  scope: z.enum(['test_point', 'study_boundary', 'protocol_duration']).default('test_point'),
});

export const NumericRangeSchema = z.tuple([z.number(), z.number()])
  .refine(([low, high]) => low <= high, 'Range must be ascending');

export const InvestigationOverviewSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  program: z.string().min(1),
  platform: PlatformSchema,
  facility: z.string().min(1),
  principalInvestigator: z.string().nullable(),
  summary: z.string().min(1),
  status: z.string().min(1),
  sourceUrl: z.string().url(),
  verifiedAt: z.string().min(1),
});

export const EvidenceRecordSchema = z.object({
  id: z.string().min(1),
  recordType: RecordTypeSchema,
  investigationId: z.string().min(1),
  investigationName: z.string().min(1),
  experimentTitle: z.string().min(1),
  platform: PlatformSchema,
  facility: z.string().min(1),
  material: z.string().min(1),
  fuelType: FuelTypeSchema,
  oxygenPercent: z.number().min(0).max(100).nullable(),
  oxygenRangePct: NumericRangeSchema.nullable(),
  pressureKpa: z.number().min(0).max(1000).nullable(),
  pressureRangeKpa: NumericRangeSchema.nullable(),
  airflowCms: z.number().min(0).max(500).nullable(),
  airflowRangeCms: NumericRangeSchema.nullable(),
  gravityContext: GravityContextSchema,
  flowConfiguration: z.string().nullable(),
  observations: z.array(z.string().min(1)),
  measurements: z.array(MeasurementValueSchema),
  findings: z.string().min(1),
  engineeringInterpretation: z.string().min(1),
  sourceUrl: z.string().url(),
  doi: z.string().nullable(),
  sourceDocument: z.string().min(1),
  evidenceLimitations: z.array(z.string().min(1)).min(1),
  verifiedAt: z.string().min(1),
  tags: z.array(z.string().min(1)),
});

export const EvidenceCorpusSchema = z.array(EvidenceRecordSchema);
export const InvestigationCorpusSchema = z.array(InvestigationOverviewSchema);

export const ScenarioParametersSchema = z.object({
  missionId: MissionPresetIdSchema,
  oxygenPercent: z.number().min(10).max(100),
  pressureKpa: z.number().min(10).max(350),
  airflowCms: z.number().min(0).max(100),
  material: z.string().min(1),
  gravityContext: GravityContextSchema,
});

export const AnalyzeRequestSchema = z.object({
  scenario: ScenarioParametersSchema,
  question: z.string().trim().min(3).max(800),
  retrievedEvidenceIds: z.array(z.string().min(1)).max(25),
});

export const EvidenceClassificationSchema = z.enum([
  'Approximate condition match',
  'Same platform / differing conditions',
  'Cross-platform environmental analog',
  'Partial evidence',
  'Insufficient evidence',
]);

export const AIResponseModeSchema = z.enum([
  'nvidia',
  'gemini',
  'openai',
  'deterministic_fallback',
]);

export const AIAnalysisResponseSchema = z.object({
  question: z.string().min(1),
  plainLanguageExplanation: z.string().min(1),
  evidenceSummary: z.string().min(1),
  engineeringImplications: z.array(z.string().min(1)).min(1),
  limitations: z.array(z.string().min(1)).min(1),
  citedEvidenceIds: z.array(z.string().min(1)),
  responseMode: AIResponseModeSchema,
  providerNote: z.string().optional(),
  claims: z.array(z.object({ recordId: z.string(), field: z.string(), label: z.string(), text: z.string(), sourceUrl: z.string().url() })).optional(),
  recordConditions: z.array(z.object({ recordId: z.string(), text: z.string() })).optional(),
});
