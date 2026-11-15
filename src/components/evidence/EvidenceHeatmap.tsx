'use client';

import { cn } from '@/lib/utils';
import {
  AIRFLOW_BINS,
  OXYGEN_BINS,
  type HeatmapCell,
} from '@/lib/matching/coverage';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface EvidenceHeatmapProps {
  cells: HeatmapCell[];
  selectedCellKey: string | null;
  onSelectCell: (cell: HeatmapCell) => void;
}

export function EvidenceHeatmap({
  cells,
  selectedCellKey,
  onSelectCell,
}: EvidenceHeatmapProps) {
  const cellLookup = new Map<string, HeatmapCell>();
  for (const c of cells) {
    cellLookup.set(`${c.oxygenBinId}::${c.airflowBinId}`, c);
  }

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-mono-telemetry text-[11px] text-[#0284C7] block">
            Tested-Pair Coverage Matrix
          </span>
          <CardTitle className="text-base">
            Oxygen Concentration vs. Forced Airflow Coverage
          </CardTitle>
        </div>
        <CardDescription>
          Click any cell to inspect associated NASA records or gap boundaries.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <div className="min-w-[600px] grid grid-cols-[170px_repeat(4,minmax(0,1fr))] gap-2">
            {/* Top-left corner */}
            <div className="p-2 flex items-end font-mono-telemetry text-[11px] uppercase text-[#64748B]">
              O₂ \ Flow
            </div>

            {/* Column headers */}
            {AIRFLOW_BINS.map((fBin) => (
              <div
                key={fBin.id}
                className="p-2 rounded-lg bg-[#FFFFFF] border border-[#F1F5F9] text-center font-mono-telemetry text-[11px] text-[#334155]"
              >
                {fBin.label}
              </div>
            ))}

            {/* Rows */}
            {OXYGEN_BINS.map((oBin) => (
              <div key={oBin.id} className="contents">
                <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#F1F5F9] flex items-center font-mono-telemetry text-[11px] text-[#0F172A]">
                  {oBin.label}
                </div>

                {AIRFLOW_BINS.map((fBin) => {
                  const key = `${oBin.id}::${fBin.id}`;
                  const cell = cellLookup.get(key);
                  const count = cell?.count ?? 0;
                  const isSelected = selectedCellKey === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => cell && onSelectCell(cell)}
                      aria-pressed={isSelected}
                      aria-label={`${oBin.label} oxygen, ${fBin.label} airflow: ${count} records`}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-all flex flex-col justify-between min-h-[76px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]',
                        isSelected
                          ? 'border-[#D97706] ring-1 ring-[#D97706]/50'
                          : 'border-[#E2E8F0] hover:border-[#CBD5E1]',
                        count === 0
                          ? 'bg-[#F8FAFC] text-[#64748B]'
                          : count === 1
                            ? 'bg-[#F1F5F9] text-[#0F172A]'
                            : count === 2
                              ? 'bg-[#E0F2FE] text-[#0F172A]'
                              : 'bg-[#BAE6FD] text-[#0F172A]'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={cn(
                            'font-mono-telemetry text-lg font-semibold',
                            count === 0 ? 'text-[#64748B]' : 'text-[#0284C7]'
                          )}
                        >
                          {count}
                        </span>
                        <span className="font-mono-telemetry text-[10px] px-1.5 py-0.5 rounded bg-[#F8FAFC]/75 text-[#334155]">
                          {count === 0
                            ? 'Empty'
                            : count === 1
                              ? '1 record'
                              : `${count} records`}
                        </span>
                      </div>
                      <span className="font-mono-telemetry text-[10px] text-[#64748B] truncate w-full mt-1">
                        {count === 0
                          ? 'No loaded record'
                          : // Several records share one investigation name (e.g. two
                            // BASS-II records); collapse repeats so the preview
                            // lists each investigation once, with its record count.
                            (() => {
                              const byInvestigation = new Map<string, number>();
                              for (const r of cell?.records ?? []) {
                                byInvestigation.set(
                                  r.investigationName,
                                  (byInvestigation.get(r.investigationName) ?? 0) + 1
                                );
                              }
                              return [...byInvestigation.entries()]
                                .map(([name, n]) => (n > 1 ? `${name} ×${n}` : name))
                                .join(', ');
                            })()}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#64748B]">
          <div className="flex flex-wrap items-center gap-4 font-mono-telemetry">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#F8FAFC] border border-[#E2E8F0]" />
              0 records (corpus gap)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#F1F5F9] border border-[#E2E8F0]" />
              1 record
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#E0F2FE] border border-[#E2E8F0]" />
              2 records
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#BAE6FD] border border-[#E2E8F0]" />
              3+ records
            </span>
          </div>
          <span>
            A record appears in a cell only when its reported point value, or
            its full reported range, falls inside that bin. Records whose
            range spans bins are listed below, not assigned to a single cell.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
