'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExternalLink, Eye, RotateCcw } from 'lucide-react';
import { getAllEvidenceRecords } from '@/lib/evidence/repository';
import { getPsiCorpusSummary } from '@/lib/evidence/psi-dataset';
import {
  buildCoverageHeatmap,
  buildInvestigationDistribution,
  computeCorpusCompleteness,
  detectCorpusResearchGaps,
  findRangeSpanningRecords,
  type HeatmapCell,
} from '@/lib/matching/coverage';
import { formatCompactParam } from '@/lib/utils';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GravityCrossoverPanel } from '@/components/evidence/GravityCrossoverPanel';
import { Button } from '@/components/ui/button';
import { EvidenceHeatmap } from '@/components/evidence/EvidenceHeatmap';
import { PsiGasDropletExplorer } from '@/components/evidence/PsiGasDropletExplorer';
import { ResearchGapExplorer } from '@/components/evidence/ResearchGapExplorer';
import { ExperimentDetailsDrawer } from '@/components/knowledge/ExperimentDetailsDrawer';
import { EmptyState } from '@/components/ui/EmptyState';
import type { EvidenceRecord } from '@/types/flare';

export default function EvidenceAndGapsPage() {
  const allRecords = useMemo(() => getAllEvidenceRecords(), []);
  const psiSummary = useMemo(() => getPsiCorpusSummary(), []);
  const [corpusView, setCorpusView] = useState<'curated' | 'psi'>('curated');

  const [investigationFilter, setInvestigationFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [materialFilter, setMaterialFilter] = useState('All');
  const [minOxygen, setMinOxygen] = useState(10);
  const [maxOxygen, setMaxOxygen] = useState(40);
  const [minPressure, setMinPressure] = useState(40);
  const [maxPressure, setMaxPressure] = useState(110);
  const [minAirflow, setMinAirflow] = useState(0);
  const [maxAirflow, setMaxAirflow] = useState(35);

  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);
  const [inspectedRecord, setInspectedRecord] =
    useState<EvidenceRecord | null>(null);

  const investigationOptions = useMemo(
    () => [
      'All',
      ...Array.from(new Set(allRecords.map((r) => r.investigationName))),
    ],
    [allRecords]
  );
  const platformOptions = useMemo(
    () => ['All', ...Array.from(new Set(allRecords.map((r) => r.platform)))],
    [allRecords]
  );
  const materialOptions = useMemo(
    () => ['All', ...Array.from(new Set(allRecords.map((r) => r.material)))],
    [allRecords]
  );

  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      if (
        investigationFilter !== 'All' &&
        rec.investigationName !== investigationFilter
      ) {
        return false;
      }
      if (platformFilter !== 'All' && rec.platform !== platformFilter) {
        return false;
      }
      if (materialFilter !== 'All' && rec.material !== materialFilter) {
        return false;
      }

      const o2Ok =
        rec.oxygenRangePct !== null
          ? rec.oxygenRangePct[0] <= maxOxygen &&
            rec.oxygenRangePct[1] >= minOxygen
          : rec.oxygenPercent !== null
            ? rec.oxygenPercent >= minOxygen && rec.oxygenPercent <= maxOxygen
            : true;

      const pOk =
        rec.pressureRangeKpa !== null
          ? rec.pressureRangeKpa[0] <= maxPressure &&
            rec.pressureRangeKpa[1] >= minPressure
          : rec.pressureKpa !== null
            ? rec.pressureKpa >= minPressure && rec.pressureKpa <= maxPressure
            : true;

      const flowOk =
        rec.airflowRangeCms !== null
          ? rec.airflowRangeCms[0] <= maxAirflow &&
            rec.airflowRangeCms[1] >= minAirflow
          : rec.airflowCms !== null
            ? rec.airflowCms >= minAirflow && rec.airflowCms <= maxAirflow
            : true;

      return o2Ok && pOk && flowOk;
    });
  }, [
    allRecords,
    investigationFilter,
    platformFilter,
    materialFilter,
    minOxygen,
    maxOxygen,
    minPressure,
    maxPressure,
    minAirflow,
    maxAirflow,
  ]);

  const heatmapCells = useMemo(
    () => buildCoverageHeatmap(filteredRecords),
    [filteredRecords]
  );
  // Records with oxygen/airflow data whose reported range spans bins:
  // they establish no single tested pair, so they are listed separately
  // instead of being repeated across every cell their range touches.
  const rangeSpanningRecords = useMemo(
    () => findRangeSpanningRecords(filteredRecords, heatmapCells),
    [filteredRecords, heatmapCells]
  );
  const distribution = useMemo(
    () => buildInvestigationDistribution(filteredRecords),
    [filteredRecords]
  );
  const completeness = useMemo(
    () => computeCorpusCompleteness(filteredRecords),
    [filteredRecords]
  );
  const gaps = useMemo(
    () => detectCorpusResearchGaps(allRecords),
    [allRecords]
  );

  const populatedCellsCount = heatmapCells.filter((c) => c.count > 0).length;
  const observationCount = filteredRecords.filter(
    (r) => r.recordType === 'experimental_observation'
  ).length;
  const overviewCount = filteredRecords.length - observationCount;

  const resetFilters = () => {
    setInvestigationFilter('All');
    setPlatformFilter('All');
    setMaterialFilter('All');
    setMinOxygen(10);
    setMaxOxygen(40);
    setMinPressure(40);
    setMaxPressure(110);
    setMinAirflow(0);
    setMaxAirflow(35);
    setSelectedCell(null);
  };

  const selectedCellKey = selectedCell
    ? `${selectedCell.oxygenBinId}::${selectedCell.airflowBinId}`
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Tremor KPI Strip */}
      <Card className="p-5 sm:p-6 gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="cyan">Corpus Coverage &amp; Research Gap Matrix</Badge>
              <Badge variant="warning">
                +{psiSummary.totalRows} NASA PSI Gas/Droplet Rows
              </Badge>
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#0F172A]">
              Evidence Explorer
            </h2>
            <p className="text-sm text-[#334155] leading-relaxed">
              Every count and completeness ratio below is computed directly from FLARE&apos;s {allRecords.length} curated multi-investigation records and {psiSummary.totalRows} NASA PSI gas/droplet rows (ACME, CFI, SPICE), kept strictly separate. Unpopulated cells indicate absence in the loaded corpus—not negative safety evidence.
            </p>
          </div>

          <Tabs
            value={corpusView}
            onValueChange={(v) => setCorpusView(v as 'curated' | 'psi')}
          >
            <TabsList>
              <TabsTrigger value="curated">
                Curated Corpus ({allRecords.length})
              </TabsTrigger>
              <TabsTrigger value="psi">
                NASA PSI Gas &amp; Droplet ({psiSummary.totalRows})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 pt-4 border-t border-[#F1F5F9]">
          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] p-3.5">
            <div className="text-xs text-[#64748B]">Active Corpus Slice</div>
            <div className="font-mono-telemetry text-xl font-semibold text-[#0F172A] mt-1">
              {filteredRecords.length}{' '}
              <span className="text-xs font-normal text-[#64748B]">
                / {allRecords.length}
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] p-3.5">
            <div className="text-xs text-[#64748B]">Experimental Observations</div>
            <div className="font-mono-telemetry text-xl font-semibold text-[#059669] mt-1">
              {observationCount}
            </div>
          </div>
          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] p-3.5">
            <div className="text-xs text-[#64748B]">Investigation Overviews</div>
            <div className="font-mono-telemetry text-xl font-semibold text-[#D97706] mt-1">
              {overviewCount}
            </div>
          </div>
          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] p-3.5">
            <div className="text-xs text-[#64748B]">Populated Heatmap Bins</div>
            <div className="font-mono-telemetry text-xl font-semibold text-[#0284C7] mt-1">
              {populatedCellsCount}{' '}
              <span className="text-xs font-normal text-[#64748B]">
                / {heatmapCells.length}
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] p-3.5">
            <div className="text-xs text-[#64748B]">NASA PSI Gas/Droplet</div>
            <div className="font-mono-telemetry text-xl font-semibold text-[#0284C7] mt-1">
              {psiSummary.totalRows}{' '}
              <span className="text-xs font-normal text-[#64748B]">
                ({psiSummary.uniqueRows} unique)
              </span>
            </div>
          </div>
        </div>
      </Card>

      {corpusView === 'psi' ? (
        <PsiGasDropletExplorer />
      ) : (
        <>

      {/* Filters Card */}
      <Card data-tour="evidence-filters">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Parameter &amp; Metadata Filters</CardTitle>
            <CardDescription>
              {filteredRecords.length} of {allRecords.length} records active
            </CardDescription>
          </div>
          <CardAction>
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              <RotateCcw className="w-3.5 h-3.5 text-[#0284C7]" />
              Reset Filters
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ev-filter-inv" className="text-xs font-medium text-[#334155]">
                Investigation
              </label>
              <select
                id="ev-filter-inv"
                value={investigationFilter}
                onChange={(e) => setInvestigationFilter(e.target.value)}
                className="h-9 px-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] focus:border-[#0284C7] focus:outline-none"
              >
                {investigationOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ev-filter-plat" className="text-xs font-medium text-[#334155]">
                Platform
              </label>
              <select
                id="ev-filter-plat"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="h-9 px-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] focus:border-[#0284C7] focus:outline-none"
              >
                {platformOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ev-filter-mat" className="text-xs font-medium text-[#334155]">
                Material
              </label>
              <select
                id="ev-filter-mat"
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                className="h-9 px-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] focus:border-[#0284C7] focus:outline-none"
              >
                {materialOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] p-3 flex flex-col gap-2">
              <span className="font-mono-telemetry text-[11px] text-[#64748B]">
                Oxygen Range (% O₂)
              </span>
              <div className="flex items-center gap-2 text-xs font-mono-telemetry">
                <input
                  aria-label="Minimum Oxygen %"
                  type="number"
                  value={minOxygen}
                  onChange={(e) => setMinOxygen(Number(e.target.value) || 0)}
                  className="w-20 h-8 px-2 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A]"
                />
                <span className="text-[#64748B]">to</span>
                <input
                  aria-label="Maximum Oxygen %"
                  type="number"
                  value={maxOxygen}
                  onChange={(e) => setMaxOxygen(Number(e.target.value) || 40)}
                  className="w-20 h-8 px-2 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A]"
                />
              </div>
            </div>

            <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] p-3 flex flex-col gap-2">
              <span className="font-mono-telemetry text-[11px] text-[#64748B]">
                Pressure Range (kPa)
              </span>
              <div className="flex items-center gap-2 text-xs font-mono-telemetry">
                <input
                  aria-label="Minimum Pressure kPa"
                  type="number"
                  value={minPressure}
                  onChange={(e) => setMinPressure(Number(e.target.value) || 0)}
                  className="w-20 h-8 px-2 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A]"
                />
                <span className="text-[#64748B]">to</span>
                <input
                  aria-label="Maximum Pressure kPa"
                  type="number"
                  value={maxPressure}
                  onChange={(e) => setMaxPressure(Number(e.target.value) || 120)}
                  className="w-20 h-8 px-2 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A]"
                />
              </div>
            </div>

            <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] p-3 flex flex-col gap-2">
              <span className="font-mono-telemetry text-[11px] text-[#64748B]">
                Forced Airflow Range (cm/s)
              </span>
              <div className="flex items-center gap-2 text-xs font-mono-telemetry">
                <input
                  aria-label="Minimum Airflow cm/s"
                  type="number"
                  value={minAirflow}
                  onChange={(e) => setMinAirflow(Number(e.target.value) || 0)}
                  className="w-20 h-8 px-2 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A]"
                />
                <span className="text-[#64748B]">to</span>
                <input
                  aria-label="Maximum Airflow cm/s"
                  type="number"
                  value={maxAirflow}
                  onChange={(e) => setMaxAirflow(Number(e.target.value) || 50)}
                  className="w-20 h-8 px-2 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <div data-tour="evidence-heatmap">
      <EvidenceHeatmap
        cells={heatmapCells}
        selectedCellKey={selectedCellKey}
        onSelectCell={(cell) => setSelectedCell(cell)}
      />
      </div>

      {/* Range-spanning records: data exists, but no single tested pair */}
      {rangeSpanningRecords.length > 0 ? (
        <Card>
          <CardHeader>
            <span className="font-mono-telemetry text-[11px] text-[#D97706] block">
              Range-Spanning Records — Not Assigned to a Single Cell
            </span>
            <CardTitle className="text-base">
              {rangeSpanningRecords.length} record{rangeSpanningRecords.length === 1 ? '' : 's'} whose reported range spans bins
            </CardTitle>
            <CardDescription>
              These records do have oxygen/airflow data, but a reported range
              that crosses bin boundaries (for example a study range, not one
              test point) does not establish a tested oxygen–airflow pair, so
              they are not counted in any cell above.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {rangeSpanningRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2 font-mono-telemetry text-[11px]">
                    <span className="text-[#D97706]">{rec.investigationName}</span>
                    <span className="text-[#0284C7]">{rec.id}</span>
                  </div>
                  <h4 className="font-display text-sm font-semibold text-[#0F172A]">
                    {rec.experimentTitle}
                  </h4>
                  <span className="font-mono-telemetry text-[11px] text-[#64748B]">
                    O₂: {formatCompactParam(rec.oxygenPercent, '%', rec.oxygenRangePct)} · Flow: {formatCompactParam(rec.airflowCms, 'cm/s', rec.airflowRangeCms)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Selected Cell Inspector */}
      {selectedCell ? (
        <Card className="border-[#CBD5E1]">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <span className="font-mono-telemetry text-[11px] text-[#D97706] block">
                Selected Cell Inspector
              </span>
              <CardTitle className="text-base">
                {selectedCell.oxygenLabel} × {selectedCell.airflowLabel}
              </CardTitle>
            </div>
            <CardAction>
              <Button variant="secondary" size="sm" onClick={() => setSelectedCell(null)}>
                Clear Selection
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent>
            {selectedCell.records.length === 0 ? (
              <EmptyState
                title="No Supporting Record in Currently Loaded Corpus"
                description="Zero loaded records fall inside this oxygen and airflow bin under your current filters. This indicates a corpus gap here and does NOT prove NASA never tested these conditions."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {selectedCell.records.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2 font-mono-telemetry text-[11px]">
                        <span className="text-[#D97706]">{rec.investigationName}</span>
                        <span className="text-[#0284C7]">{rec.investigationId}</span>
                      </div>
                      <h4 className="font-display text-sm font-semibold text-[#0F172A]">
                        {rec.experimentTitle}
                      </h4>
                      <p className="text-xs text-[#334155] leading-relaxed">
                        {rec.findings}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#F1F5F9]">
                      <span className="font-mono-telemetry text-[11px] text-[#64748B]">
                        O₂: {formatCompactParam(rec.oxygenPercent, '%', rec.oxygenRangePct)} · Flow: {formatCompactParam(rec.airflowCms, 'cm/s', rec.airflowRangeCms)}
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={rec.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0284C7] hover:text-[#D97706]"
                          aria-label={`Source link for ${rec.id}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setInspectedRecord(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] font-mono-telemetry text-[11px] text-[#0F172A] cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-[#D97706]" />
                          Inspect
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Distribution Chart & Completeness Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <span className="font-mono-telemetry text-[11px] text-[#0284C7] block">
              Investigation Distribution
            </span>
            <CardTitle className="text-base">Records by NASA Program</CardTitle>
          </CardHeader>

          <CardContent>
            {distribution.length > 0 ? (
              <div
                className="h-[280px] w-full"
                aria-label="Bar chart showing count of experimental observations and investigation overviews per NASA program"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution} margin={{ top: 10, right: 16, left: 0, bottom: 32 }}>
                    <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="investigationName"
                      stroke="#64748B"
                      tick={{ fill: '#334155', fontSize: 10 }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="#64748B"
                      tick={{ fill: '#334155', fontSize: 11 }}
                      label={{
                        value: 'Record Count',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#64748B',
                        fontSize: 11,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                        color: '#0F172A',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar
                      dataKey="observations"
                      name="Experimental Observations"
                      stackId="a"
                      fill="#059669"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="overviews"
                      name="Investigation Overviews"
                      stackId="a"
                      fill="#D97706"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title="No Records in Filtered Slice"
                description="Adjust your filters to view investigation distribution."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <span className="font-mono-telemetry text-[11px] text-[#059669] block">
              Data Completeness Audit
            </span>
            <CardTitle className="text-base">
              Parameter Availability ({completeness.totalRecords} filtered)
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-3.5">
            {[
              {
                label: 'Point Oxygen Concentration (% O₂)',
                count: completeness.withOxygenPoint,
                color: '#D97706',
              },
              {
                label: 'Point Ambient Pressure (kPa)',
                count: completeness.withPressurePoint,
                color: '#0284C7',
              },
              {
                label: 'Point Forced Airflow (cm/s)',
                count: completeness.withAirflowPoint,
                color: '#059669',
              },
              {
                label: 'Measured Flame Spread Rate (mm/s)',
                count: completeness.withFlameSpreadRate,
                color: '#7C3AED',
              },
              {
                label: 'Measured Limiting Oxygen Index (% O₂)',
                count: completeness.withLimitingOxygenIndex,
                color: '#D97706',
              },
              {
                label: 'Peer-Reviewed Journal DOI Attached',
                count: completeness.withDoi,
                color: '#0284C7',
              },
            ].map((metric) => {
              const pct =
                completeness.totalRecords > 0
                  ? Math.round((metric.count / completeness.totalRecords) * 100)
                  : 0;
              return (
                <div key={metric.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#334155]">{metric.label}</span>
                    <span className="font-mono-telemetry text-[#0F172A]">
                      {metric.count} / {completeness.totalRecords} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#F8FAFC] border border-[#F1F5F9] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: metric.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <ResearchGapExplorer gaps={gaps} />

      <div data-tour="evidence-crossover">
        <GravityCrossoverPanel />
      </div>
        </>
      )}

      <ExperimentDetailsDrawer
        record={inspectedRecord}
        onClose={() => setInspectedRecord(null)}
      />
    </div>
  );
}
