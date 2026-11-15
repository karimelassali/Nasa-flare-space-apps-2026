'use client';

import { getRecordProvenance } from '@/lib/evidence/provenance';

import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ChevronRight,
  Download,
  FilterX,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { triggerBrowserDownload } from '@/lib/export/brief';
import { cn, formatCompactParam } from '@/lib/utils';
import type { EvidenceRecord } from '@/types/flare';

interface KnowledgeTableProps {
  records: EvidenceRecord[];
  onSelectRecord: (record: EvidenceRecord) => void;
}

type SortKey = 'id' | 'investigationName' | 'oxygenPercent' | 'pressureKpa' | 'airflowCms';

const INVESTIGATION_PILLS = ['All', 'BASS', 'FLEX', 'ACME', 'SAFFIRE', 'SoFIE'] as const;

export function KnowledgeTable({ records, onSelectRecord }: KnowledgeTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [fuelFilter, setFuelFilter] = useState<string>('All');
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>('All');
  const [programPill, setProgramPill] = useState<(typeof INVESTIGATION_PILLS)[number]>('All');
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const platforms = useMemo(
    () => ['All', ...Array.from(new Set(records.map((r) => r.platform)))],
    [records]
  );

  const fuelTypes = useMemo(
    () => ['All', ...Array.from(new Set(records.map((r) => r.fuelType)))],
    [records]
  );

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matched = records.filter((record) => {
      if (platformFilter !== 'All' && record.platform !== platformFilter) {
        return false;
      }
      if (fuelFilter !== 'All' && record.fuelType !== fuelFilter) {
        return false;
      }
      if (recordTypeFilter !== 'All' && record.recordType !== recordTypeFilter) {
        return false;
      }
      if (
        programPill !== 'All' &&
        !record.investigationName.toUpperCase().includes(programPill.toUpperCase())
      ) {
        return false;
      }
      if (!q) return true;

      const haystack = [
        record.id,
        record.investigationId,
        record.investigationName,
        record.experimentTitle,
        record.platform,
        record.facility,
        record.material,
        record.fuelType,
        record.findings,
        record.sourceDocument,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });

    return [...matched].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (sortKey === 'id' || sortKey === 'investigationName') {
        return a[sortKey].localeCompare(b[sortKey]) * dir;
      }
      const valA = a[sortKey] ?? -1;
      const valB = b[sortKey] ?? -1;
      return (valA - valB) * dir;
    });
  }, [
    records,
    searchQuery,
    platformFilter,
    fuelFilter,
    recordTypeFilter,
    programPill,
    sortKey,
    sortDirection,
  ]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setPlatformFilter('All');
    setFuelFilter('All');
    setRecordTypeFilter('All');
    setProgramPill('All');
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    platformFilter !== 'All' ||
    fuelFilter !== 'All' ||
    recordTypeFilter !== 'All' ||
    programPill !== 'All';

  const handleExportFilteredJson = () => {
    triggerBrowserDownload(
      'flare-filtered-nasa-evidence.json',
      JSON.stringify(filteredRecords.map((record) => ({ ...record, provenance: getRecordProvenance(record.id) })), null, 2),
      'application/json;charset=utf-8'
    );
  };

  return (
    <Card className="overflow-hidden">
      {/* Toolbar outside table element so role="table" only contains data rows */}
      <div className="p-5 border-b border-[#E2E8F0] space-y-4 bg-[#FFFFFF]">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PSI/NTRS ID (e.g., PSI-69), campaign (BASS, SAFFIRE), material, or finding..."
              aria-label="Search NASA Knowledge Base"
              className="w-full h-9 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] pl-9 pr-3 text-xs text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              aria-label="Filter by platform"
              className="h-9 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
            >
              {platforms.map((p) => (
                <option key={p} value={p} className="bg-[#FFFFFF]">
                  {p === 'All' ? 'All Platforms' : p}
                </option>
              ))}
            </select>

            <select
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value)}
              aria-label="Filter by fuel category"
              className="h-9 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
            >
              {fuelTypes.map((f) => (
                <option key={f} value={f} className="bg-[#FFFFFF]">
                  {f === 'All' ? 'All Fuel Types' : f}
                </option>
              ))}
            </select>

            <select
              value={recordTypeFilter}
              onChange={(e) => setRecordTypeFilter(e.target.value)}
              aria-label="Filter by record type"
              className="h-9 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
            >
              <option value="All" className="bg-[#FFFFFF]">
                All Record Types
              </option>
              <option value="experimental_observation" className="bg-[#FFFFFF]">
                Experimental Observation
              </option>
              <option value="investigation_overview" className="bg-[#FFFFFF]">
                Investigation Overview
              </option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportFilteredJson}
              className="h-9"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export ({filteredRecords.length})</span>
            </Button>
          </div>
        </div>

        {/* Program Quick-Filter Pills + Result Count */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {INVESTIGATION_PILLS.map((pill) => {
              const active = programPill === pill;
              return (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setProgramPill(pill)}
                  className={cn(
                    'px-2.5 py-1 rounded-md font-mono-telemetry text-[11px] border transition-colors cursor-pointer',
                    active
                      ? 'bg-[#F1F5F9] border-[#0284C7]/60 text-[#0F172A]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#334155]'
                  )}
                >
                  {pill === 'All' ? 'All Campaigns' : pill}
                </button>
              );
            })}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-mono-telemetry text-[11px] text-[#D97706] hover:bg-[#D97706]/10 transition-colors cursor-pointer"
              >
                <FilterX className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <span className="font-mono-telemetry text-[11px] text-[#64748B] tabular-nums">
            Showing <span className="text-[#0F172A]">{filteredRecords.length}</span> of{' '}
            {records.length} records
          </span>
        </div>
      </div>

      {/* Table Body */}
      <CardContent className="p-0">
        {filteredRecords.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No matching NASA records"
              description="No NASA PSI or NTRS corpus entries match the active search string and parameter filters."
            />
          </div>
        ) : (
          <Table>
            {/* Explicit column widths so the 9-column table fits the
                content column at desktop width instead of pushing the
                Type / Inspect columns off-screen. */}
            <colgroup>
              <col style={{ width: 118 }} />
              <col style={{ width: 104 }} />
              <col />
              <col style={{ width: 84 }} />
              <col style={{ width: 88 }} />
              <col style={{ width: 96 }} />
              <col style={{ width: 92 }} />
              <col style={{ width: 92 }} />
              <col style={{ width: 76 }} />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort('id')}
                    className="inline-flex items-center gap-1 hover:text-[#0F172A] cursor-pointer"
                  >
                    <span>Record / PSI ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort('investigationName')}
                    className="inline-flex items-center gap-1 hover:text-[#0F172A] cursor-pointer"
                  >
                    <span>Investigation</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>Experiment & Material</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('oxygenPercent')}
                    className="inline-flex items-center gap-1 hover:text-[#0F172A] cursor-pointer ml-auto"
                  >
                    <span>O₂</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('pressureKpa')}
                    className="inline-flex items-center gap-1 hover:text-[#0F172A] cursor-pointer ml-auto"
                  >
                    <span>Pressure</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('airflowCms')}
                    className="inline-flex items-center gap-1 hover:text-[#0F172A] cursor-pointer ml-auto"
                  >
                    <span>Airflow</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Inspect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow
                  key={record.id}
                  onClick={() => onSelectRecord(record)}
                  className="cursor-pointer group"
                >
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono-telemetry text-xs text-[#0F172A] font-medium">
                        {record.id}
                      </span>
                      <span className="font-mono-telemetry text-[11px] text-[#0284C7]">
                        {record.investigationId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-[#0F172A] whitespace-nowrap">
                    {record.investigationName}
                  </TableCell>
                  <TableCell className="min-w-[170px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-[#0F172A] font-medium line-clamp-1 group-hover:text-[#D97706] transition-colors">
                        {record.experimentTitle}
                      </span>
                      <span className="text-[11px] text-[#64748B] line-clamp-1">
                        {record.material} · {record.fuelType}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="outline" className="text-[11px]">
                      {record.platform}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono-telemetry text-xs text-[#0F172A] tabular-nums whitespace-nowrap">
                    {formatCompactParam(record.oxygenPercent, '%', record.oxygenRangePct)}
                  </TableCell>
                  <TableCell className="text-right font-mono-telemetry text-xs text-[#0F172A] tabular-nums whitespace-nowrap">
                    {formatCompactParam(record.pressureKpa, 'kPa', record.pressureRangeKpa)}
                  </TableCell>
                  <TableCell className="text-right font-mono-telemetry text-xs text-[#0F172A] tabular-nums whitespace-nowrap">
                    {formatCompactParam(record.airflowCms, 'cm/s', record.airflowRangeCms)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge
                      variant={
                        record.recordType === 'experimental_observation'
                          ? 'emerald'
                          : 'cyan'
                      }
                      className="text-[10px]"
                    >
                      {record.recordType === 'experimental_observation'
                        ? 'Observation'
                        : 'Overview'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecord(record);
                      }}
                      aria-label={`Inspect ${record.id}`}
                      className="inline-flex items-center gap-1 font-mono-telemetry text-[11px] text-[#64748B] group-hover:text-[#0284C7] transition-colors cursor-pointer"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
