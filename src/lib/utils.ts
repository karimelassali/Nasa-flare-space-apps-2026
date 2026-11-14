export { cn } from 'cn';
import type { MeasurementValue } from '@/types/flare';

export function formatCompactParam(value: number | null, unit: string, range: [number, number] | null = null): string {
  if (value !== null && Number.isFinite(value)) return `${value} ${unit}`;
  return range ? `Study range: ${range[0]}–${range[1]} ${unit}` : 'Not reported';
}

export function formatNumericParam(
  value: number | null,
  unit: string,
  range: [number, number] | null = null
): string {
  const point = formatCompactParam(value, unit);
  return range ? `${point}; study range: ${range[0]}–${range[1]} ${unit} (not a single test)` : point;
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
