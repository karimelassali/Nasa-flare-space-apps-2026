'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Filter, RotateCcw, ShieldAlert } from 'lucide-react';
import {
  PSI_OXYGEN_BINS,
  PSI_PRESSURE_BINS,
  buildPsiCoverageHeatmap,
  getAllPsiGasDropletTests,
  getPsiCorpusSummary,
  type PsiGasDropletTest,
  type PsiHeatmapCell,
} from '@/lib/evidence/psi-dataset';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';

const PAGE_SIZE = 20;

export function PsiGasDropletExplorer() {
  const allTests = useMemo(() => getAllPsiGasDropletTests(), []);
  const summary = useMemo(() => getPsiCorpusSummary(allTests), [allTests]);

  const [investigationFilter, setInvestigationFilter] = useState<'All' | 'ACME' | 'CFI' | 'SPICE'>('All');
  const [fuelFilter, setFuelFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideDuplicates, setHideDuplicates] = useState(true);
  const [selectedCell, setSelectedCell] = useState<PsiHeatmapCell | null>(null);
  const [page, setPage] = useState(1);

  const fuelOptions = useMemo(
    () => ['All', ...Array.from(new Set(allTests.map((t) => t.fuel))).sort()],
    [allTests]
  );

  const filteredTests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allTests.filter((t) => {
      if (hideDuplicates && t.flags.includes('duplicate_row')) return false;
      if (investigationFilter !== 'All' && t.investigation !== investigationFilter) return false;
      if (fuelFilter !== 'All' && t.fuel !== fuelFilter) return false;
      if (q) {
        const hay = `${t.id} ${t.investigation} ${t.fuel} ${t.geometry} ${t.outcome ?? ''} ${t.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allTests, hideDuplicates, investigationFilter, fuelFilter, searchQuery]);

  const heatmapCells = useMemo(
    () => buildPsiCoverageHeatmap(filteredTests),
    [filteredTests]
  );

  const cellLookup = useMemo(() => {
    const map = new Map<string, PsiHeatmapCell>();
    for (const c of heatmapCells) {
      map.set(`${c.oxygenBinId}::${c.pressureBinId}`, c);
    }
    return map;
  }, [heatmapCells]);

  const activeRows = useMemo(() => {
    if (!selectedCell) return filteredTests;
    const ids = new Set(selectedCell.tests.map((t) => t.id));
    return filteredTests.filter((t) => ids.has(t.id));
  }, [filteredTests, selectedCell]);

  const totalPages = Math.max(1, Math.ceil(activeRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = activeRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetFilters = () => {
    setInvestigationFilter('All');
    setFuelFilter('All');
    setSearchQuery('');
    setHideDuplicates(true);
    setSelectedCell(null);
    setPage(1);
  };

  const selectedCellKey = selectedCell
    ? `${selectedCell.oxygenBinId}::${selectedCell.pressureBinId}`
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Separation & Provenance Banner */}
      <Card className="p-5 sm:p-6 gap-4 border-[#BAE6FD] bg-[#F8FAFC]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="cyan">NASA PSI Gas &amp; Droplet Dataset</Badge>
            <Badge variant="warning">Strictly Separate From Solid-Material Tests</Badge>
          </div>
          <h3 className="font-display text-xl font-semibold text-[#0F172A]">
            ACME · CFI (FLEX) · SPICE Row-Level Matrix ({summary.totalRows} rows)
          </h3>
          <p className="text-xs sm:text-sm text-[#334155] leading-relaxed max-w-4xl">
            Ingested via <code className="font-mono-telemetry text-[12px] bg-[#E2E8F0]/60 px-1.5 py-0.5 rounded">scripts/ingest_nasa.py --ingest-psi</code> from raw NASA Physical Sciences Informatics CSVs. Gas and liquid-droplet experiments measure oxygen, pressure, and burner/nozzle geometry differently from solid cabin materials, so they are kept in a dedicated dataset and never pooled into solid flammability verdicts.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-[#E2E8F0]">
          <div className="rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] p-3">
            <div className="text-[11px] text-[#64748B]">Total PSI Rows</div>
            <div className="font-mono-telemetry text-lg font-semibold text-[#0F172A] mt-0.5">
              {summary.totalRows}
            </div>
          </div>
          <div className="rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] p-3">
            <div className="text-[11px] text-[#64748B]">Unique (Non-Dup)</div>
            <div className="font-mono-telemetry text-lg font-semibold text-[#0284C7] mt-0.5">
              {summary.uniqueRows}
            </div>
          </div>
          <div className="rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] p-3">
            <div className="text-[11px] text-[#64748B]">ACME (CFI-G Gas)</div>
            <div className="font-mono-telemetry text-lg font-semibold text-[#059669] mt-0.5">
              {summary.byInvestigation.ACME}
            </div>
          </div>
          <div className="rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] p-3">
            <div className="text-[11px] text-[#64748B]">CFI (FLEX Droplet)</div>
            <div className="font-mono-telemetry text-lg font-semibold text-[#D97706] mt-0.5">
              {summary.byInvestigation.CFI}
            </div>
          </div>
          <div className="rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] p-3">
            <div className="text-[11px] text-[#64748B]">SPICE (Jet Flame)</div>
            <div className="font-mono-telemetry text-lg font-semibold text-[#7C3AED] mt-0.5">
              {summary.byInvestigation.SPICE}
            </div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="w-4 h-4 text-[#0284C7]" />
              PSI Test Row Filters
            </CardTitle>
            <CardDescription>
              {filteredTests.length} matching tests ({hideDuplicates ? `${summary.duplicateRows} flagged duplicate rows hidden` : 'including duplicate rows'})
            </CardDescription>
          </div>
          <CardAction>
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              <RotateCcw className="w-3.5 h-3.5 text-[#0284C7]" />
              Reset
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="psi-inv" className="text-xs font-medium text-[#334155]">
                Investigation
              </label>
              <select
                id="psi-inv"
                value={investigationFilter}
                onChange={(e) => {
                  setInvestigationFilter(e.target.value as 'All' | 'ACME' | 'CFI' | 'SPICE');
                  setSelectedCell(null);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A]"
              >
                <option value="All">All (ACME, CFI, SPICE)</option>
                <option value="ACME">ACME (Porous Burner Gas)</option>
                <option value="CFI">CFI (FLEX Liquid Droplet)</option>
                <option value="SPICE">SPICE (Coflow Jet Gas)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="psi-fuel" className="text-xs font-medium text-[#334155]">
                Fuel
              </label>
              <select
                id="psi-fuel"
                value={fuelFilter}
                onChange={(e) => {
                  setFuelFilter(e.target.value);
                  setSelectedCell(null);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A]"
              >
                {fuelOptions.map((fuel) => (
                  <option key={fuel} value={fuel}>
                    {fuel}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="psi-search" className="text-xs font-medium text-[#334155]">
                Search Test ID, Outcome, or Note
              </label>
              <input
                id="psi-search"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedCell(null);
                  setPage(1);
                }}
                placeholder="e.g. ACME-CFIG-001, cool flame, n-dodecane..."
                className="h-9 px-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A]"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-[#334155] cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={hideDuplicates}
              onChange={(e) => {
                setHideDuplicates(e.target.checked);
                setSelectedCell(null);
                setPage(1);
              }}
              className="rounded border-[#CBD5E1]"
            />
            Hide {summary.duplicateRows} flagged duplicate rows (show {summary.uniqueRows} unique rows)
          </label>
        </CardContent>
      </Card>

      {/* O2 x Pressure Heatmap */}
      <Card>
        <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-mono-telemetry text-[11px] text-[#0284C7] block">
              NASA PSI Gas &amp; Droplet Envelope
            </span>
            <CardTitle className="text-base">
              Oxygen Concentration vs. Ambient Pressure Matrix
            </CardTitle>
          </div>
          <CardDescription>
            Click a cell to filter the test table below ({selectedCell ? `${selectedCell.oxygenLabel} × ${selectedCell.pressureLabel}` : 'all cells'}).
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <div className="min-w-[600px] grid grid-cols-[140px_repeat(4,minmax(0,1fr))] gap-2">
              <div className="p-2 flex items-end font-mono-telemetry text-[11px] uppercase text-[#64748B]">
                O₂ \ Pressure
              </div>
              {PSI_PRESSURE_BINS.map((pBin) => (
                <div
                  key={pBin.id}
                  className="p-2 rounded-lg bg-[#FFFFFF] border border-[#F1F5F9] text-center font-mono-telemetry text-[11px] text-[#334155]"
                >
                  {pBin.label}
                </div>
              ))}

              {PSI_OXYGEN_BINS.map((oBin) => (
                <div key={oBin.id} className="contents">
                  <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#F1F5F9] flex items-center font-mono-telemetry text-[11px] text-[#0F172A]">
                    {oBin.label}
                  </div>
                  {PSI_PRESSURE_BINS.map((pBin) => {
                    const key = `${oBin.id}::${pBin.id}`;
                    const cell = cellLookup.get(key);
                    const count = cell?.count ?? 0;
                    const isSelected = selectedCellKey === key;
                    const breakdown = cell
                      ? (['ACME', 'CFI', 'SPICE'] as const)
                          .filter((k) => cell.byInvestigation[k] > 0)
                          .map((k) => `${k} ${cell.byInvestigation[k]}`)
                          .join(' · ')
                      : '';
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (!cell) return;
                          setSelectedCell(isSelected ? null : cell);
                          setPage(1);
                        }}
                        aria-pressed={isSelected}
                        className={cn(
                          'p-3 rounded-lg border text-left transition-all flex flex-col justify-between min-h-[76px] cursor-pointer',
                          isSelected
                            ? 'border-[#D97706] ring-1 ring-[#D97706]/50'
                            : 'border-[#E2E8F0] hover:border-[#CBD5E1]',
                          count === 0
                            ? 'bg-[#F8FAFC] text-[#64748B]'
                            : count < 20
                              ? 'bg-[#F1F5F9] text-[#0F172A]'
                              : count < 100
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
                          <span className="font-mono-telemetry text-[10px] px-1.5 py-0.5 rounded bg-[#FFFFFF]/80 text-[#334155]">
                            {count === 0 ? 'Gap' : `${count} tests`}
                          </span>
                        </div>
                        <span className="font-mono-telemetry text-[10px] text-[#475569] truncate w-full mt-1">
                          {breakdown || 'No PSI test row'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] p-3 text-xs text-[#92400E]">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
            <span>
              <strong>SPICE condition caveat:</strong> All SPICE rows sit in the 18–23% O₂ × 95–115 kPa bin because 21.0% O₂ and 101.0 kPa are documented coflow conditions from the SPICE report (p. 20), not per-row sensor readings (`conditions_from_doc`). ACME and CFI have `airflowCms: null` (non-duct apparatuses).
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Paginated Row Table */}
      <Card>
        <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              NASA PSI Test Rows ({activeRows.length})
            </CardTitle>
            <CardDescription>
              {selectedCell
                ? `Filtered to ${selectedCell.oxygenLabel} × ${selectedCell.pressureLabel}`
                : 'Showing all matching ACME, CFI, and SPICE rows'}
            </CardDescription>
          </div>
          {selectedCell ? (
            <CardAction>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedCell(null);
                  setPage(1);
                }}
              >
                Clear Cell Filter
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {pagedRows.length === 0 ? (
            <EmptyState
              title="No NASA PSI Rows Match These Filters"
              description="Adjust your investigation, fuel, or heatmap cell selection to inspect rows."
            />
          ) : (
            <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] font-mono-telemetry text-[11px] text-[#475569]">
                    <th className="py-2.5 px-3">Test ID</th>
                    <th className="py-2.5 px-3">Program</th>
                    <th className="py-2.5 px-3">Fuel / Phase</th>
                    <th className="py-2.5 px-3">O₂ (%)</th>
                    <th className="py-2.5 px-3">Pressure (kPa)</th>
                    <th className="py-2.5 px-3">Airflow (cm/s)</th>
                    <th className="py-2.5 px-3">Outcome / Metric</th>
                    <th className="py-2.5 px-3">Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {pagedRows.map((row: PsiGasDropletTest) => (
                    <tr key={`${row.id}-${row.sourceRow}`} className="hover:bg-[#F8FAFC]/80">
                      <td className="py-2.5 px-3 font-mono-telemetry font-medium text-[#0F172A] whitespace-nowrap">
                        {row.id}
                        <div className="text-[10px] text-[#64748B]">row {row.sourceRow}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge variant="cyan">{row.investigation}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-[#334155]">
                        <div className="font-medium text-[#0F172A]">{row.fuel}</div>
                        <div className="text-[11px] text-[#64748B]">{row.fuelPhase} · {row.geometry}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono-telemetry text-[#0F172A] whitespace-nowrap">
                        {row.oxygenPercent !== null ? `${row.oxygenPercent}%` : 'Not reported'}
                      </td>
                      <td className="py-2.5 px-3 font-mono-telemetry text-[#0F172A] whitespace-nowrap">
                        {row.pressureKpa !== null ? `${row.pressureKpa} kPa` : 'Not reported'}
                      </td>
                      <td className="py-2.5 px-3 font-mono-telemetry text-[#334155] whitespace-nowrap">
                        {row.airflowCms !== null ? `${row.airflowCms} cm/s` : 'Not reported'}
                      </td>
                      <td className="py-2.5 px-3 text-[#334155] max-w-[240px]">
                        <div>{row.outcome ?? 'No outcome column in CSV'}</div>
                        {row.keyMetricValue !== null ? (
                          <div className="font-mono-telemetry text-[11px] text-[#0284C7]">
                            {row.keyMetricName}: {row.keyMetricValue} {row.keyMetricUnit ?? ''}
                          </div>
                        ) : null}
                        {row.flags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {row.flags.map((f) => (
                              <span
                                key={f}
                                className="font-mono-telemetry text-[10px] px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E]"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <a
                          href={row.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#0284C7] hover:underline font-mono-telemetry text-[11px]"
                        >
                          NASA NTRS
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeRows.length > PAGE_SIZE ? (
            <div className="flex items-center justify-between pt-2 text-xs text-[#64748B]">
              <span className="font-mono-telemetry">
                Page {safePage} of {totalPages} ({activeRows.length} rows)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
