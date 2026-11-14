import { Badge, type BadgeVariant } from '@/components/ui/badge';
import type { EvidenceClassification } from '@/types/flare';

const VARIANT_MAP: Record<EvidenceClassification, BadgeVariant> = {
  'Approximate condition match': 'emerald',
  'Cross-platform environmental analog': 'cyan',
  'Same platform / differing conditions': 'warning',
  'Partial evidence': 'violet',
  'Insufficient evidence': 'error',
};

interface EvidenceRankBadgeProps {
  classification: EvidenceClassification;
  className?: string;
}

export function EvidenceRankBadge({
  classification,
  className,
}: EvidenceRankBadgeProps) {
  return (
    <Badge variant={VARIANT_MAP[classification]} className={className}>
      {classification}
    </Badge>
  );
}
