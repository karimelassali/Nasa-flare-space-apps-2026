import { z } from 'zod';
import {
  AIAnalysisResponseSchema,
  AIResponseModeSchema,
  AnalyzeRequestSchema,
  EvidenceClassificationSchema,
  EvidenceRecordSchema,
  FuelTypeSchema,
  GravityContextSchema,
  InvestigationOverviewSchema,
  MeasurementValueSchema,
  MissionPresetIdSchema,
  PlatformSchema,
  RecordTypeSchema,
  ScenarioParametersSchema,
} from '@/lib/validation/schemas';

export type Platform = z.infer<typeof PlatformSchema>;
export type GravityContext = z.infer<typeof GravityContextSchema>;
export type FuelType = z.infer<typeof FuelTypeSchema>;
export type RecordType = z.infer<typeof RecordTypeSchema>;
export type MissionPresetId = z.infer<typeof MissionPresetIdSchema>;
export type MeasurementValue = z.infer<typeof MeasurementValueSchema>;
export type InvestigationOverview = z.infer<typeof InvestigationOverviewSchema>;
export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;
export type ScenarioParameters = z.infer<typeof ScenarioParametersSchema>;
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type EvidenceClassification = z.infer<typeof EvidenceClassificationSchema>;
export type AIResponseMode = z.infer<typeof AIResponseModeSchema>;
export type AIAnalysisResponse = z.infer<typeof AIAnalysisResponseSchema>;

export interface MissionPreset {
  id: MissionPresetId;
  title: string;
  subtitle: string;
  description: string;
  platformTarget: Platform | 'Analog / Any' | 'Custom';
  provenanceNote: string;
  defaults: Omit<ScenarioParameters, 'missionId'>;
}

export interface RankedEvidenceResult {
  record: EvidenceRecord;
  classification: EvidenceClassification;
  relevanceTierOrder: number;
  alignedBoundaryCount: number;
  totalBoundaryCount: number;
  matchingParameters: string[];
  missingOrDifferingParameters: string[];
  questionOverlapScore: number;
}

export interface EpistemicCategory {
  label:
    | 'Experimental Observation'
    | 'Engineering Interpretation'
    | 'Environmental Analog'
    | 'Research Gap';
  description: string;
}
