import { Badge, type BadgeVariant } from './badge';

export type EpistemicLabel =
  | 'Experimental Observation'
  | 'Investigation Overview'
  | 'Engineering Interpretation'
  | 'Environmental Analog'
  | 'Research Gap';

const VARIANT_MAP: Record<EpistemicLabel, BadgeVariant> = {
  'Experimental Observation': 'emerald',
  'Investigation Overview': 'cyan',
  'Engineering Interpretation': 'warning',
  'Environmental Analog': 'cyan',
  'Research Gap': 'error',
};

interface ProvenanceBadgeProps {
  label: EpistemicLabel;
  className?: string;
}

export function ProvenanceBadge({ label, className }: ProvenanceBadgeProps) {
  return (
    <Badge variant={VARIANT_MAP[label]} className={className}>
      {label}
    </Badge>
  );
}
