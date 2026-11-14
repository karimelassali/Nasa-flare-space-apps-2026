import { ExternalLink, FileText, ShieldCheck } from 'lucide-react';
import { Badge } from './badge';
import type { EvidenceRecord } from '@/types/flare';
import { getRecordProvenance } from '@/lib/evidence/provenance';

interface SourceCitationProps {
  record: Pick<
    EvidenceRecord,
    'id' | 'investigationId' | 'investigationName' | 'sourceDocument' | 'sourceUrl' | 'doi' | 'verifiedAt' | 'recordType'
  >;
  compact?: boolean;
}

export function SourceCitation({ record, compact = false }: SourceCitationProps) {
  const provenance = getRecordProvenance(record.id);
  return (
    <div className="rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
          <span className="font-mono-telemetry text-xs font-medium text-[#0F172A]">
            Source Provenance · {record.investigationId}
          </span>
        </div>
        <Badge variant="secondary">
          {record.recordType === 'experimental_observation'
            ? 'Experimental Observation'
            : 'Investigation Overview'}
        </Badge>
      </div>

      <div className="flex items-start gap-2.5 text-xs text-[#334155]">
        <FileText className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-[#0F172A] font-medium leading-snug">
            {record.sourceDocument}
          </span>
          {!compact && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono-telemetry text-[11px] text-[#64748B]">
              <span>ID: {record.id}</span>
              <span>DOI: {record.doi ?? 'Not reported'}</span>
              <span>{provenance.label} · {provenance.reviewedAt}</span>
            </div>
          )}
          <p className="leading-relaxed">{provenance.scope}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#F1F5F9]">
        <span className="font-mono-telemetry text-[11px] text-[#64748B] truncate max-w-full sm:max-w-[70%]">
          {record.sourceUrl}
        </span>
        <a
          href={record.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-mono-telemetry text-xs text-[#0284C7] hover:text-[#D97706] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] rounded px-1.5 py-0.5"
        >
          <span>Open NASA Source</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
