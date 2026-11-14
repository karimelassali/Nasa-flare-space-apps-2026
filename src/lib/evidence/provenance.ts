import provenance from '@/data/provenance.json';

export interface RecordProvenance {
  level: string;
  label: string;
  sourceUrl: string;
  locator: string;
  reviewedAt: string;
  scope: string;
}

export function getRecordProvenance(id: string): RecordProvenance {
  return (provenance as Record<string, RecordProvenance>)[id] ?? {
    level: 'manual_review', label: 'Manual review required', sourceUrl: '', locator: '', reviewedAt: '',
    scope: 'No provenance entry exists for this record. Do not use its claims as verified evidence.',
  };
}
