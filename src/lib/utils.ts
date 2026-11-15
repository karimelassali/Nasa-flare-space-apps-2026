export { cn } from 'cn';
import type { MeasurementValue } from '@/types/flare';

export function formatCompactParam(value: number | null, unit: string, range: [number, number] | null = null): string {
  // Short on purpose: this is used inside narrow table cells. A range is
  // shown as the range itself, not as a sentence — callers that need the
  // "study range" explanation use formatNumericParam below.
  if (value !== null && Number.isFinite(value)) return `${value} ${unit}`;
  return range ? `${range[0]}–${range[1]} ${unit}` : 'Not reported';
}

export function formatNumericParam(
  value: number | null,
  unit: string,
  range: [number, number] | null = null
): string {
  if (!range) return value !== null && Number.isFinite(value) ? `${value} ${unit}` : 'Not reported';
  if (value !== null && Number.isFinite(value)) {
    return `${value} ${unit}; study range: ${range[0]}–${range[1]} ${unit} (not a single test)`;
  }
  return `Not reported; study range: ${range[0]}–${range[1]} ${unit} (not a single test)`;
}

export function formatMeasurementValue(measurement: MeasurementValue): string {
  if (measurement.value === null || !Number.isFinite(measurement.value)) return 'Not reported';
  const uncertainty = measurement.uncertainty === null
    ? ' (uncertainty not reported)'
    : ` ± ${measurement.uncertainty}`;
  return measurement.uncertainty === null
    ? `${measurement.value} ${measurement.unit}${uncertainty}`
    : `${measurement.value}${uncertainty} ${measurement.unit}`;
}
