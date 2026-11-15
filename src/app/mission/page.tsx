'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, CheckCircle2, Database, Image as ImageIcon, Layers, X } from 'lucide-react';
import {
  MISSION_PRESETS,
  RESEARCH_QUESTION_PRESETS,
  getAllEvidenceRecords,
  getAllInvestigations,
} from '@/lib/evidence/repository';
import { rankEvidenceCorpus } from '@/lib/ranking/ranker';
import { ScenarioParametersSchema } from '@/lib/validation/schemas';
import { cn } from '@/lib/utils';
import { useDialogFocus } from '@/lib/use-dialog-focus';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MissionSelector } from '@/components/mission/MissionSelector';
import { EnvironmentControls } from '@/components/mission/EnvironmentControls';
import { EvidenceCard } from '@/components/mission/EvidenceCard';
import { AIAnalysisPanel } from '@/components/mission/AIAnalysisPanel';
import { MaterialScreeningMatrix } from '@/components/mission/MaterialScreeningMatrix';
import { ExportControls } from '@/components/mission/ExportControls';
import { ExperimentDetailsDrawer } from '@/components/knowledge/ExperimentDetailsDrawer';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import type {
  AIAnalysisResponse,
  EvidenceRecord,
  MissionPreset,
  RankedEvidenceResult,
  ScenarioParameters,
} from '@/types/flare';

const DEFAULT_PRESET = MISSION_PRESETS[0];

export default function MissionModePage() {
  const allRecords = useMemo(() => getAllEvidenceRecords(), []);
  const investigations = useMemo(() => getAllInvestigations(), []);
  const recordsById = useMemo(
    () => new Map(allRecords.map((r) => [r.id, r])),
    [allRecords]
  );

  const [selectedPreset, setSelectedPreset] =
    useState<MissionPreset>(DEFAULT_PRESET);
  const [scenario, setScenario] = useState<ScenarioParameters>({
    missionId: DEFAULT_PRESET.id,
    ...DEFAULT_PRESET.defaults,
  });
  const [question, setQuestion] = useState<string>(RESEARCH_QUESTION_PRESETS[0]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analysisGeneration = useRef(0);

  const [rankedResults, setRankedResults] = useState<
    RankedEvidenceResult[] | null
  >(null);
  const [analysisResult, setAnalysisResult] =
    useState<AIAnalysisResponse | null>(null);
  const [resultsTab, setResultsTab] = useState('all');
  const [showSplash, setShowSplash] = useState(false);
  const splashRef = useRef<HTMLDivElement>(null);
  useDialogFocus(showSplash, splashRef, () => setShowSplash(false));
  const [showAllResults, setShowAllResults] = useState(false);

  const [inspectedRecord, setInspectedRecord] =
    useState<EvidenceRecord | null>(null);

  const isModifiedFromPreset = useMemo(() => {
    const d = selectedPreset.defaults;
    return (
      scenario.oxygenPercent !== d.oxygenPercent ||
      scenario.pressureKpa !== d.pressureKpa ||
      scenario.airflowCms !== d.airflowCms ||
      scenario.material !== d.material ||
      scenario.gravityContext !== d.gravityContext
    );
  }, [scenario, selectedPreset]);

  const invalidateAnalysis = () => {
    analysisGeneration.current += 1;
    setRankedResults(null);
    setAnalysisResult(null);
    setApiError(null);
    setIsAnalyzing(false);
  };

  const handleSelectPreset = (preset: MissionPreset) => {
    invalidateAnalysis();
    setSelectedPreset(preset);
    setScenario({
      missionId: preset.id,
      ...preset.defaults,
    });
  };

  const handleResetBaseline = () => {
    invalidateAnalysis();
    setScenario({
      missionId: selectedPreset.id,
      ...selectedPreset.defaults,
    });
  };

  const handleAnalyze = async (overrideQuestion?: string) => {
    setApiError(null);

    const activeQuestion =
      typeof overrideQuestion === 'string' ? overrideQuestion : question;
    const trimmedQuestion = activeQuestion.trim();
    if (trimmedQuestion.length < 3) {
      setApiError(
        'Please select a research question or enter at least 3 characters.'
      );
      return;
    }

    const validScenario = ScenarioParametersSchema.safeParse(scenario);
    if (!validScenario.success) {
      setApiError(
        'Environmental parameters are out of valid physical bounds.'
      );
      return;
    }

    const generation = ++analysisGeneration.current;
    setAnalysisResult(null);
    // Deterministic retrieval and classification against the local corpus
    const ranked = rankEvidenceCorpus(
      allRecords,
      validScenario.data,
      trimmedQuestion
    );
    setRankedResults(ranked);
    setResultsTab('all');
    setShowAllResults(false);
    setIsAnalyzing(true);

    try {
      const retrievedEvidenceIds = ranked.slice(0, 8).map((r) => r.record.id);
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: validScenario.data,
          question: trimmedQuestion,
          retrievedEvidenceIds,
        }),
      });

      if (!response.ok) {
        const errPayload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          errPayload.error ?? `Analysis request failed (${response.status})`
        );
      }

      const data = (await response.json()) as AIAnalysisResponse;
      if (generation === analysisGeneration.current) setAnalysisResult(data);
    } catch (err) {
      if (generation !== analysisGeneration.current) return;
      setApiError(
        err instanceof Error
          ? err.message
          : 'Failed to synthesize evidence via /api/analyze.'
      );
      setAnalysisResult(null);
    } finally {
      if (generation === analysisGeneration.current) setIsAnalyzing(false);
    }
  };


  const currentStep = analysisResult ? 3 : question.trim().length >= 3 ? 2 : 1;

  const summaryCounts = useMemo(() => {
    if (!rankedResults) {
      return { direct: 0, analogs: 0, samePlatform: 0, observations: 0 };
    }
    return {
      direct: rankedResults.filter(
        (r) => r.classification === 'Approximate condition match'
      ).length,
      analogs: rankedResults.filter(
        (r) => r.classification === 'Cross-platform environmental analog'
      ).length,
      samePlatform: rankedResults.filter(
        (r) => r.classification === 'Same platform / differing conditions'
      ).length,
      observations: rankedResults.filter(
        (r) => r.record.recordType === 'experimental_observation'
      ).length,
    };
  }, [rankedResults]);

  const filteredRankedResults = useMemo(() => {
    if (!rankedResults) return [];
    if (resultsTab === 'aligned') {
      return rankedResults.filter(
        (r) =>
          r.classification === 'Approximate condition match' ||
          r.classification === 'Cross-platform environmental analog' ||
          r.classification === 'Same platform / differing conditions'
      );
    }
    if (resultsTab === 'observations') {
      return rankedResults.filter(
        (r) => r.record.recordType === 'experimental_observation'
      );
    }
    return rankedResults;
  }, [rankedResults, resultsTab]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header & 3-Stage Workflow Strip */}
      <Card className="p-5 sm:p-6 gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex flex-col gap-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="cyan">Pre-Mission Research Workspace</Badge>
              <span className="font-mono-telemetry text-[11px] text-[#64748B]">
                {allRecords.length} source-linked records · {investigations.length} NASA campaigns
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSplash(true)}
                className="h-6 px-2 text-[11px] gap-1 ml-auto"
              >
                <ImageIcon className="w-3 h-3 text-[#D97706]" />
                <span>Mission Poster</span>
              </Button>
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#0F172A] tracking-tight">
              Mission Fire-Safety Evidence Intelligence
            </h2>
            <p className="text-sm text-[#334155] leading-relaxed">
              Configure spacecraft atmospheric parameters, formulate a combustion safety inquiry, and retrieve deterministically ranked NASA PSI and NTRS evidence with full provenance boundaries.
            </p>
          </div>

          {/* 3-Stage Stepper */}
          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            {[
              { step: 1, title: 'Select Environment' },
              { step: 2, title: 'Define Question' },
              { step: 3, title: 'Analyze Evidence' },
            ].map((item) => {
              const active = currentStep >= item.step;
              return (
                <div
                  key={item.step}
                  className={cn(
                    'rounded-lg px-3 py-2.5 border flex flex-col gap-1 min-w-[110px]',
                    active
                      ? 'bg-[#F1F5F9] border-[#CBD5E1]'
                      : 'bg-[#FFFFFF] border-[#F1F5F9] opacity-70'
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono-telemetry text-[10px] font-medium text-[#D97706]">
                      0{item.step}
                    </span>
                    {currentStep > item.step || (item.step === 3 && analysisResult) ? (
                      <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                    ) : null}
                  </div>
                  <span className="text-xs font-medium text-[#0F172A]">
                    {item.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Boundary Readout Bar */}
        <div className="pt-4 border-t border-[#F1F5F9] flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#64748B] mr-1">Active envelope:</span>
          <Badge variant="outline">
            Scenario: <span className="text-[#0F172A] ml-1">{selectedPreset.title}</span>
          </Badge>
          <Badge variant="outline">
            O₂: <span className="text-[#D97706] ml-1">{scenario.oxygenPercent.toFixed(1)}%</span>
          </Badge>
          <Badge variant="outline">
            Pressure: <span className="text-[#0284C7] ml-1">{scenario.pressureKpa.toFixed(1)} kPa</span>
          </Badge>
          <Badge variant="outline">
            Flow: <span className="text-[#059669] ml-1">{scenario.airflowCms.toFixed(1)} cm/s</span>
          </Badge>
          <Badge variant="outline">
            Gravity: <span className="text-[#0F172A] ml-1">{scenario.gravityContext}</span>
          </Badge>
        </div>
      </Card>

      {/* Stage 1: Spacecraft / Environment Presets */}
      <div data-tour="mission-presets">
        <MissionSelector
          presets={MISSION_PRESETS}
          selectedId={selectedPreset.id}
          onSelect={handleSelectPreset}
        />
      </div>

      {/* Stage 2: Environment Controls & Agent/Scenario Action Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8" data-tour="mission-controls">
          <EnvironmentControls
            preset={selectedPreset}
            scenario={scenario}
            isModifiedFromPreset={isModifiedFromPreset}
            onChange={(next) => { invalidateAnalysis(); setScenario(next); }}
            onReset={handleResetBaseline}
          />
        </div>
        <div className="lg:col-span-4" data-tour="mission-question">
          <Card className="h-full p-5 flex flex-col justify-between gap-4 bg-[#FFFFFF]">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono-telemetry text-[11px] font-medium px-1.5 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0] text-[#0369A1]">
                  STAGE 02B
                </span>
                <span className="font-display text-sm font-semibold text-[#0F172A]">
                  Scenario Evaluation &amp; Agent
                </span>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed">
                Define a scenario question to rank all {allRecords.length} audited NASA records, or open the Research Agent for multi-turn synthesis.
              </p>
              <label htmlFor="mission-question-input" className="sr-only">
                Scenario research question
              </label>
              <input
                id="mission-question-input"
                type="text"
                value={question}
                onChange={(e) => {
                  invalidateAnalysis();
                  setQuestion(e.target.value);
                }}
                placeholder="Ask a fire-safety boundary question..."
                className="w-full h-9 px-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0369A1] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2.5">
              <Button
                variant="default"
                size="default"
                disabled={isAnalyzing || !question.trim()}
                onClick={() => {
                  void handleAnalyze();
                }}
                className="w-full justify-center"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isAnalyzing ? 'Analyzing Scenario...' : 'Analyze Configured Scenario'}</span>
              </Button>
              <Link
                href="/agent"
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 text-xs font-medium text-[#0369A1] transition-colors hover:bg-[#F0F9FF] hover:border-[#0369A1]/40"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Ask Research Agent</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Stage 3: Analysis Results Workspace */}
      {!rankedResults && isAnalyzing ? (
        <LoadingState
          label="Synthesizing with NVIDIA Nemotron NIM..."
          sublabel="Generating evidence-grounded research brief from retrieved NASA PSI and NTRS records..."
        />
      ) : null}

      {apiError ? (
        <ErrorState
          message={apiError}
          onRetry={() => {
            void handleAnalyze();
          }}
        />
      ) : null}

      {!rankedResults && !isAnalyzing && !apiError ? (
        <Card className="p-5 sm:p-6 bg-[#FFFFFF] border-dashed border-[#E2E8F0]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-2xl">
              <div className="w-10 h-10 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] flex items-center justify-center text-[#0284C7] shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono-telemetry text-[11px] font-medium text-[#059669]">
                    STAGE 03 // EVIDENCE WORKSPACE READY
                  </span>
                </div>
                <h3 className="font-display text-sm font-semibold text-[#0F172A]">
                  Ready to Rank &amp; Synthesize {allRecords.length} NASA-linked records (review pending)
                </h3>
                <p className="text-xs text-[#334155] leading-relaxed">
                  Click <strong className="text-[#0F172A]">Analyze Configured Scenario</strong> to classify matching records across the NASA corpus, generate an evidence-grounded research brief, and unlock Markdown/JSON exports.
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="default"
              onClick={() => {
                void handleAnalyze();
              }}
              className="shrink-0"
            >
              <Layers className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Analyze Configured Scenario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      ) : null}

      {rankedResults ? (
        <div className="flex flex-col gap-6">
          {/* Tremor Classification KPI Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-[#059669]" />
                <span className="text-xs text-[#334155]">Approximate Matches</span>
              </div>
              <div className="font-mono-telemetry text-2xl font-semibold text-[#0F172A] pl-3">
                {summaryCounts.direct}
              </div>
              <span className="text-[11px] text-[#64748B] pl-3">
                Within ±2.5% O₂, ±12 kPa, ±5.5 cm/s
              </span>
            </Card>

            <Card className="p-4 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-[#0284C7]" />
                <span className="text-xs text-[#334155]">Environmental Analogs</span>
              </div>
              <div className="font-mono-telemetry text-2xl font-semibold text-[#0F172A] pl-3">
                {summaryCounts.analogs}
              </div>
              <span className="text-[11px] text-[#64748B] pl-3">
                Cross-platform aligned conditions
              </span>
            </Card>

            <Card className="p-4 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-[#D97706]" />
                <span className="text-xs text-[#334155]">Same Platform / Diff.</span>
              </div>
              <div className="font-mono-telemetry text-2xl font-semibold text-[#0F172A] pl-3">
                {summaryCounts.samePlatform}
              </div>
              <span className="text-[11px] text-[#64748B] pl-3">
                Differing atmosphere or airflow
              </span>
            </Card>

            <Card className="p-4 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-[#D97706]" />
                <span className="text-xs text-[#334155]">Cited in Synthesis</span>
              </div>
              <div className="font-mono-telemetry text-2xl font-semibold text-[#0F172A] pl-3">
                {analysisResult ? analysisResult.citedEvidenceIds.length : '…'}
              </div>
              <span className="text-[11px] text-[#64748B] pl-3">
                Out of {rankedResults.length} evaluated records
              </span>
            </Card>
          </div>

          {analysisResult ? (
            <ExportControls
              question={question.trim()}
              preset={selectedPreset}
              scenario={scenario}
              rankedResults={rankedResults}
              analysis={analysisResult}
            />
          ) : null}

          {isAnalyzing ? (
            <LoadingState
              label="Preparing your evidence brief..."
              sublabel="Selecting source fields from the retrieved NASA records."
            />
          ) : analysisResult ? (
            <AIAnalysisPanel
              analysis={analysisResult}
              recordsById={recordsById}
              onSelectCitation={(rec) => setInspectedRecord(rec)}
            />
          ) : null}

          <div data-tour="mission-screening">
            <MaterialScreeningMatrix
              scenario={scenario}
              recordsById={recordsById}
              onInspectRecord={(rec) => setInspectedRecord(rec)}
            />
          </div>

          {/* Ranked NASA Evidence Feed */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-telemetry text-[11px] font-medium px-1.5 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0] text-[#059669]">
                    STAGE 03
                  </span>
                  <h2 className="font-display text-base font-semibold text-[#0F172A]">
                    Ranked NASA Evidence Records ({rankedResults.length})
                  </h2>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Deterministic boundary-condition ranking (±2.5% O₂, ±12.0 kPa, ±5.5 cm/s tolerances; unknown fields never match; alignment count is not statistical confidence)
                </p>
              </div>

              <Tabs value={resultsTab} onValueChange={setResultsTab}>
                <TabsList>
                  <TabsTrigger value="all">
                    All ({rankedResults.length})
                  </TabsTrigger>
                  <TabsTrigger value="aligned">
                    Aligned (
                    {summaryCounts.direct +
                      summaryCounts.analogs +
                      summaryCounts.samePlatform}
                    )
                  </TabsTrigger>
                  <TabsTrigger value="observations">
                    Observations ({summaryCounts.observations})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {filteredRankedResults.length > 0 ? (
              <div className="flex flex-col gap-4">
                {(showAllResults ? filteredRankedResults : filteredRankedResults.slice(0, 6)).map((result) => {
                  const overallIndex = rankedResults.findIndex(
                    (r) => r.record.id === result.record.id
                  );
                  return (
                    <EvidenceCard
                      key={result.record.id}
                      result={result}
                      rankIndex={overallIndex >= 0 ? overallIndex : 0}
                      onInspect={(rec) => setInspectedRecord(rec)}
                    />
                  );
                })}
                {filteredRankedResults.length > 6 && (
                  <Button variant="secondary" onClick={() => setShowAllResults(!showAllResults)}>
                    {showAllResults ? 'Show top 6 records' : `Show all ${filteredRankedResults.length} records`}
                  </Button>
                )}
              </div>
            ) : (
              <EmptyState
                title="No Records in Current Filter Tab"
                description="Switch tabs above to inspect all ranked evidence records and investigation overviews."
              />
            )}
          </section>
        </div>
      ) : null}

      <ExperimentDetailsDrawer
        record={inspectedRecord}
        onClose={() => setInspectedRecord(null)}
      />

      {/* Mission Poster / Splash Modal */}
      {showSplash && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="FLARE mission poster"
          ref={splashRef}
          tabIndex={-1}
        >
          <div className="relative w-full max-w-4xl bg-white rounded-2xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="FLARE Logo" className="w-6 h-6 object-contain" />
                <span className="font-display font-semibold text-slate-900 text-sm">
                  FLARE — 2026 NASA Space Apps Challenge Poster
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSplash(false)}
                aria-label="Close mission poster"
                className="h-7 w-7 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-4 bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/splash.png"
                alt="FLARE Mission Artwork"
                className="w-full h-auto max-h-[65vh] object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="cyan">Flame in Freefall</Badge>
                <span>SI-Powered Fire Safety Insights from Microgravity Combustion Data</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setShowSplash(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
