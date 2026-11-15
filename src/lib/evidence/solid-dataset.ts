import type { z } from 'zod';
import rawSolidTests from '@/data/solid-tests.json';
import { SolidTestCorpusSchema, SolidTestRecordSchema } from '@/lib/validation/schemas';

export type SolidTestRecord = z.infer<typeof SolidTestRecordSchema>;
export type SolidMaterialName = SolidTestRecord['material'];

const parsedSolidTests = SolidTestCorpusSchema.parse(rawSolidTests);

export function getAllSolidTestRows(): SolidTestRecord[] {
  return parsedSolidTests;
}

export function getSolidDatasetSummary(rows: SolidTestRecord[] = parsedSolidTests) {
  const active = rows.filter((r) => !r.reusedSample);
  return {
    totalRows: rows.length,
    activeRows: active.length,
    reusedExcludedRows: rows.length - active.length,
    byMaterial: {
      'PMMA Acrylic': active.filter((r) => r.material === 'PMMA Acrylic').length,
      'SIBAL Fabric': active.filter((r) => r.material === 'SIBAL Fabric').length,
      'Nomex III': active.filter((r) => r.material === 'Nomex III').length,
    },
  };
}
