'use client';

import { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAllEvidenceRecords } from '@/lib/evidence/repository';
import { findCompatibleNumericalMeasurements } from '@/lib/matching/coverage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExperimentSelector } from '@/components/comparison/ExperimentSelector';
import { ComparisonTable } from '@/components/comparison/ComparisonTable';
import { ScientificChart } from '@/components/comparison/ScientificChart';
import { LoadingState } from '@/components/ui/LoadingState';

function CompareWorkspace() {
  const records = useMemo(() => getAllEvidenceRecords(), []);
  const searchParams = useSearchParams();
  const router = useRouter();
  const idsParam = searchParams.get('ids');

  const initialPair = useMemo(() => {
    const defaultA = records[0]?.id ?? '';
    const defaultB =
      records.find((r) => r.id === 'EV-PSI100-01')?.id ??
      records[1]?.id ??
      defaultA;

    if (!idsParam) return { a: defaultA, b: defaultB };

    const parts = [...new Set(idsParam
      .split(',')
      .map((s) => s.trim())
      .filter((id) => records.some((r) => r.id === id)))];

    if (parts.length >= 2) return { a: parts[0], b: parts[1] };
    if (parts.length === 1) {
      const alt =
        records.find((r) => r.id !== parts[0])?.id ?? defaultB;
      return { a: parts[0], b: alt };
    }
    return { a: defaultA, b: defaultB };
  }, [idsParam, records]);

  const updatePair = (a: string, b: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('ids', `${a},${b}`);
    router.replace(`/compare?${params}`, { scroll: false });
  };

  const recordA =
    records.find((r) => r.id === initialPair.a) ?? records[0];
  const recordB =
    records.find((r) => r.id === initialPair.b) ?? records[1] ?? records[0];

  const compatibility = useMemo(
    () => findCompatibleNumericalMeasurements(recordA, recordB),
    [recordA, recordB]
  );

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-5 sm:p-6 gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="cyan">Side-by-Side Experiment Comparison</Badge>
        </div>
        <h2 className="font-display text-2xl font-semibold text-[#0F172A]">
          Compare NASA Microgravity Combustion Records
        </h2>
        <p className="text-sm text-[#334155] max-w-3xl leading-relaxed">
          Inspect test conditions, combustible fuels, observed findings, and limitations side-by-side. Numerical bar charts are rendered only when both records report compatible physical quantities with identical units.
        </p>
      </Card>

      <div data-tour="compare-selectors">
        <ExperimentSelector
          records={records}
          selectedAId={recordA.id}
          selectedBId={recordB.id}
          onChangeA={(id) => updatePair(id, recordB.id)}
          onChangeB={(id) => updatePair(recordA.id, id)}
          onSwap={() => updatePair(recordB.id, recordA.id)}
        />
      </div>

      <ScientificChart
        recordA={recordA}
        recordB={recordB}
        compatiblePairs={compatibility.compatiblePairs}
        incompatibilityReason={compatibility.incompatibilityReason}
      />

      <ComparisonTable recordA={recordA} recordB={recordB} />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <LoadingState
          label="Loading Experiment Comparison Workspace..."
          sublabel="Validating compatible numerical quantities and units."
        />
      }
    >
      <CompareWorkspace />
    </Suspense>
  );
}
