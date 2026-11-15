'use client';

import Link from 'next/link';
import { ArrowUpRight, Database, Download, ExternalLink, FileText, Info, Search, ShieldAlert } from 'lucide-react';
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import type { AIAnalysisResponse } from '@/types/flare';
import type { RecordProvenance } from '@/lib/evidence/provenance';
import { triggerBrowserDownload } from '@/lib/export/brief';

export type AgentAnswer = {
  kind: 'guide' | 'evidence';
  answer?: string;
  analysis?: AIAnalysisResponse;
  actions: { label: string; href: string; description: string }[];
  citations: { id: string; title: string; investigation: string; sourceUrl: string; sourceDocument: string; limitations: string[]; recordType: string; provenance: RecordProvenance }[];
  contextIds: string[];
  scenarioNote?: string;
  brief?: string;
};

export function EvidenceAnswer({ answer }: { answer: AgentAnswer }) {
  const { analysis } = answer;
  return (
    <div className="space-y-5 text-sm leading-relaxed text-slate-700">
      {answer.answer && <p>{answer.answer}</p>}
      {analysis && <>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md bg-sky-50 px-2.5 py-1 font-medium text-sky-800">
            {analysis.responseMode === 'deterministic_fallback' ? 'Retrieval-based summary · No AI configured' : `AI-selected records · ${analysis.responseMode === 'nvidia' ? 'NVIDIA' : analysis.responseMode === 'gemini' ? 'Gemini' : 'OpenAI'} · Text rendered from sources`}
          </span>
          <span className="text-slate-500">{answer.citations.length} cited records</span>
        </div>
        <ChainOfThought defaultOpen={false}>
          <ChainOfThoughtHeader>
            Reasoning &amp; NASA evidence trace ({answer.citations.length} records)
          </ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <ChainOfThoughtStep
              icon={Search}
              label="Matched NASA PSI investigations"
              description={`Retrieved ${answer.citations.length} audited record${answer.citations.length === 1 ? '' : 's'} from primary NTRS reports.`}
              status="complete"
            >
              {answer.citations.length > 0 ? (
                <ChainOfThoughtSearchResults>
                  {answer.citations.map((c) => (
                    <ChainOfThoughtSearchResult key={c.id}>
                      {c.investigation} · {c.id}
                    </ChainOfThoughtSearchResult>
                  ))}
                </ChainOfThoughtSearchResults>
              ) : null}
            </ChainOfThoughtStep>
            {analysis.evidenceSummary ? (
              <ChainOfThoughtStep
                icon={Database}
                label="Synthesized evidence bounds"
                description={analysis.evidenceSummary}
                status="complete"
              />
            ) : null}
            {analysis.limitations.length > 0 ? (
              <ChainOfThoughtStep
                icon={ShieldAlert}
                label="Verified limitations & uncertainty"
                description={analysis.limitations[0]}
                status="complete"
              />
            ) : null}
          </ChainOfThoughtContent>
        </ChainOfThought>
        <p className="text-[15px] text-slate-900">{analysis.plainLanguageExplanation}</p>
        <div className="space-y-3">
          {answer.citations.map((citation, index) => {
            const claims = analysis.claims?.filter((c) => c.recordId === citation.id) ?? [];
            const conditions = analysis.recordConditions?.find((c) => c.recordId === citation.id);
            return <article key={citation.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-600">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">{citation.investigation}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{citation.provenance.label} · {citation.id}</p>
                </div>
                <a href={citation.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-sky-700 hover:underline" aria-label={`Open NASA source for ${citation.investigation}`}>
                  Source <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <div className="space-y-3 p-4">
                {claims.filter((c) => c.field === 'findings').map((c) => <p key={c.field}>{c.text}</p>)}
                {claims.some((c) => c.field !== 'findings') && <dl className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
                  {claims.filter((c) => c.field !== 'findings').map((c) => <div key={c.field}><dt className="text-xs font-semibold text-slate-900">{c.label}</dt><dd className="mt-1 text-xs leading-relaxed">{c.text}</dd></div>)}
                </dl>}
                <details className="text-xs">
                  <summary className="cursor-pointer py-1 font-medium text-sky-800">Test conditions & source details</summary>
                  <div className="mt-2 space-y-2 border-l-2 border-sky-100 pl-3">
                    {conditions && <p>{conditions.text}</p>}
                    <p>{citation.sourceDocument}</p><p>{citation.provenance.scope}</p>
                    {citation.limitations.map((l) => <p key={l}>{l}</p>)}
                  </div>
                </details>
              </div>
            </article>;
          })}
        </div>
        <details className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-2.5">
          <summary className="cursor-pointer text-xs font-medium text-amber-900">Interpretation, limitations & analysis method</summary>
          <div className="mt-3 space-y-3 text-xs">
            <p className="font-medium">Research interpretations below are distinct from reported measurements.</p>
            <ul className="list-disc space-y-2 pl-4">{analysis.engineeringImplications.map((item) => <li key={item}>{item}</li>)}</ul>
            <ul className="list-disc space-y-2 pl-4">{analysis.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
            <p>{analysis.providerNote}</p>
            {answer.scenarioNote && <p>{answer.scenarioNote}</p>}
          </div>
        </details>
      </>}
      {answer.actions.length > 0 && <div className="grid gap-2 sm:grid-cols-2">
        {answer.actions.map((action) => <Link key={action.href} href={action.href} className="group rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-sky-400 hover:bg-sky-50/40">
          <span className="flex items-center justify-between gap-2 font-semibold text-sky-800">{action.label}<ArrowUpRight className="h-4 w-4 shrink-0" /></span>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">{action.description}</p>
        </Link>)}
      </div>}
      {answer.brief && <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3">
        <button type="button" onClick={() => triggerBrowserDownload('flare-evidence-brief.md', answer.brief!, 'text/markdown;charset=utf-8')} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium hover:bg-slate-100"><FileText className="h-4 w-4" />Download Markdown</button>
        <button type="button" onClick={() => triggerBrowserDownload('flare-evidence-brief.json', JSON.stringify(answer, null, 2), 'application/json;charset=utf-8')} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium hover:bg-slate-100"><Download className="h-4 w-4" />Download JSON</button>
      </div>}
      {!answer.citations.length && analysis && <p className="flex gap-2 text-xs text-slate-500"><Info className="h-4 w-4 shrink-0" />No scientific conclusion is supported by this search.</p>}
    </div>
  );
}
