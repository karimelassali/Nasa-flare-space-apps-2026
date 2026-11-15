import type { z } from 'zod';
import rawPsiTests from '@/data/psi-gas-droplet.json';
import { PsiGasDropletCorpusSchema, PsiGasDropletTestSchema } from '@/lib/validation/schemas';

export type PsiGasDropletTest = z.infer<typeof PsiGasDropletTestSchema>;

const parsedPsiTests = PsiGasDropletCorpusSchema.parse(rawPsiTests);

export interface PsiCorpusSummary {
  totalRows: number;
  uniqueRows: number;
  duplicateRows: number;
  byInvestigation: Record<'ACME' | 'CFI' | 'SPICE', number>;
}

export function getAllPsiGasDropletTests(): PsiGasDropletTest[] {
  return parsedPsiTests;
}

export function getPsiCorpusSummary(tests: PsiGasDropletTest[] = parsedPsiTests): PsiCorpusSummary {
  const duplicateRows = tests.filter((t) => t.flags.includes('duplicate_row')).length;
  return {
    totalRows: tests.length,
    uniqueRows: tests.length - duplicateRows,
    duplicateRows,
    byInvestigation: {
      ACME: tests.filter((t) => t.investigation === 'ACME').length,
      CFI: tests.filter((t) => t.investigation === 'CFI').length,
      SPICE: tests.filter((t) => t.investigation === 'SPICE').length,
    },
  };
}

export interface PsiBin {
  id: string;
  label: string;
  min: number;
  max: number;
  minExclusive?: boolean;
  maxExclusive?: boolean;
}

export const PSI_OXYGEN_BINS: PsiBin[] = [
  { id: 'psi-o2-low', label: '< 18% O₂', min: 0, max: 18, maxExclusive: true },
  { id: 'psi-o2-norm', label: '18–23% O₂', min: 18, max: 23, maxExclusive: true },
  { id: 'psi-o2-mod', label: '23–35% O₂', min: 23, max: 35, maxExclusive: true },
  { id: 'psi-o2-high', label: '≥ 35% O₂', min: 35, max: 100 },
];

export const PSI_PRESSURE_BINS: PsiBin[] = [
  { id: 'psi-p-low', label: '< 75 kPa', min: 0, max: 75, maxExclusive: true },
  { id: 'psi-p-sub', label: '75–95 kPa', min: 75, max: 95, maxExclusive: true },
  { id: 'psi-p-atm', label: '95–115 kPa', min: 95, max: 115 },
  { id: 'psi-p-high', label: '> 115 kPa', min: 115, max: 1000, minExclusive: true },
];

export interface PsiHeatmapCell {
  oxygenBinId: string;
  oxygenLabel: string;
  pressureBinId: string;
  pressureLabel: string;
  tests: PsiGasDropletTest[];
  count: number;
  byInvestigation: Record<'ACME' | 'CFI' | 'SPICE', number>;
}

function inPsiBin(val: number | null, bin: PsiBin): boolean {
  if (val === null) return false;
  const loOk = bin.minExclusive ? val > bin.min : val >= bin.min;
  const hiOk = bin.maxExclusive ? val < bin.max : val <= bin.max;
  return loOk && hiOk;
}

export function buildPsiCoverageHeatmap(tests: PsiGasDropletTest[]): PsiHeatmapCell[] {
  const cells: PsiHeatmapCell[] = [];
  for (const oBin of PSI_OXYGEN_BINS) {
    for (const pBin of PSI_PRESSURE_BINS) {
      const matching = tests.filter(
        (t) => inPsiBin(t.oxygenPercent, oBin) && inPsiBin(t.pressureKpa, pBin)
      );
      cells.push({
        oxygenBinId: oBin.id,
        oxygenLabel: oBin.label,
        pressureBinId: pBin.id,
        pressureLabel: pBin.label,
        tests: matching,
        count: matching.length,
        byInvestigation: {
          ACME: matching.filter((t) => t.investigation === 'ACME').length,
          CFI: matching.filter((t) => t.investigation === 'CFI').length,
          SPICE: matching.filter((t) => t.investigation === 'SPICE').length,
        },
      });
    }
  }
  return cells;
}
