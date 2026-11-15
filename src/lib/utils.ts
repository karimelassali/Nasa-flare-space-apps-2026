export { cn } from 'cn';
import type { MeasurementValue } from '@/types/flare';

export function formatCompactParam(value: number | null, unit: string, range: [number, number] | null = null): string {
  // Short on purpose: this is used inside narrow table cells.
  if (value !== null && Number.isFinite(value)) return `${value} ${unit}`;
  return range ? `Reported range: ${range[0]}–${range[1]} ${unit}` : 'Not reported';
}

export function formatNumericParam(
  value: number | null,
  unit: string,
  range: [number, number] | null = null
): string {
  if (value !== null && Number.isFinite(value)) {
    const point = `${value} ${unit}`;
    return range ? `${point}; reported range: ${range[0]}–${range[1]} ${unit} (see source conditions)` : point;
  }
  return range
    ? `Not reported (point value); reported range: ${range[0]}–${range[1]} ${unit} (see source conditions)`
    : 'Not reported';
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
