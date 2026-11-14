'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ErrorBar,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Info } from 'lucide-react';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CompatibleMeasurementPair } from '@/lib/matching/coverage';
import type { EvidenceRecord } from '@/types/flare';

interface ScientificChartProps {
  recordA: EvidenceRecord;
  recordB: EvidenceRecord;
  compatiblePairs: CompatibleMeasurementPair[];
  incompatibilityReason: string | null;
}

export function ScientificChart({
  recordA,
  recordB,
  compatiblePairs,
  incompatibilityReason,
}: ScientificChartProps) {
  if (compatiblePairs.length === 0) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <div>
            <span className="font-mono-telemetry text-[11px] text-[#D97706] block">
              Compatibility Guard · Qualitative Mode
            </span>
            <CardTitle className="text-base">
              Quantitative Comparison Chart Omitted
            </CardTitle>
          </div>
          <CardAction>
            <Badge variant="warning">Qualitative Only</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
              {incompatibilityReason}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div>
          <span className="font-mono-telemetry text-[11px] text-[#059669] block">
            Unit-Matched Numerical Measurements
          </span>
          <CardTitle className="text-base">
            Unit-Aligned Quantitative Comparison ({compatiblePairs.length} metric{compatiblePairs.length > 1 ? 's' : ''})
          </CardTitle>
        </div>
        <CardAction>
          <Badge variant="emerald">Units Matched</Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="rounded-lg bg-[#FFFBEB] border border-[#FDE68A] p-3.5 flex items-start gap-2.5 text-xs text-[#92400E] leading-relaxed">
          <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Comparison limits:</span> These records report the same physical quantity and unit. Their sample geometry, atmosphere, and flow conditions may still differ. Missing uncertainty is labeled <span className="font-semibold">Not reported</span>; it is never plotted as zero.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {compatiblePairs.map((pair) => {
          const chartData = [
            {
              name: `${recordA.investigationName} (${recordA.id})`,
              value: pair.recordAValue,
              error: pair.recordAUncertainty ?? undefined,
            },
            {
              name: `${recordB.investigationName} (${recordB.id})`,
              value: pair.recordBValue,
              error: pair.recordBUncertainty ?? undefined,
            },
          ];

          const hasUncertainties =
            pair.recordAUncertainty !== null &&
            pair.recordBUncertainty !== null;

          return (
            <div
              key={pair.key}
              className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-4 flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display text-sm font-semibold text-[#0F172A]">
                  {pair.label}
                </span>
                <Badge variant="cyan">Unit: {pair.unit}</Badge>
              </div>

              <div
                className="h-[240px] w-full"
                aria-label={`Bar chart comparing ${pair.label} in ${pair.unit} between ${recordA.investigationName} and ${recordB.investigationName}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 16, right: 16, left: 8, bottom: 16 }}
                  >
                    <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748B"
                      tick={{ fill: '#334155', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#64748B"
                      tick={{ fill: '#334155', fontSize: 11 }}
                      label={{
                        value: pair.unit,
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#64748B',
                        fontSize: 11,
                      }}
                    />
                    <Tooltip
                      formatter={(val: number) => [`${val} ${pair.unit}`, pair.label]}
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
                      isAnimationActive={false}
                      dataKey="value"
                      name={`${pair.label} (${pair.unit})`}
                      fill="#D97706"
                      radius={[4, 4, 0, 0]}
                      barSize={54}
                    >
                      {hasUncertainties ? (
                        <ErrorBar
                          dataKey="error"
                          width={6}
                          strokeWidth={1.5}
                          stroke="#0284C7"
                        />
                      ) : null}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono-telemetry text-[#334155]">
                <div className="rounded-md bg-[#FFFFFF] p-2.5 border border-[#F1F5F9]">
                  <span className="text-[#D97706]">A:</span> {pair.recordAValue}
                  {pair.recordAUncertainty !== null ? ` ± ${pair.recordAUncertainty}` : ''}{' '}
                  {pair.unit}
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Uncertainty:{' '}
                    {pair.recordAUncertainty !== null
                      ? `±${pair.recordAUncertainty} ${pair.unit}`
                      : 'Not reported (error bar suppressed)'}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">{pair.recordANote}</div>
                </div>
                <div className="rounded-md bg-[#FFFFFF] p-2.5 border border-[#F1F5F9]">
                  <span className="text-[#0284C7]">B:</span> {pair.recordBValue}
                  {pair.recordBUncertainty !== null ? ` ± ${pair.recordBUncertainty}` : ''}{' '}
                  {pair.unit}
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Uncertainty:{' '}
                    {pair.recordBUncertainty !== null
                      ? `±${pair.recordBUncertainty} ${pair.unit}`
                      : 'Not reported (error bar suppressed)'}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">{pair.recordBNote}</div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </CardContent>
    </Card>
  );
}
