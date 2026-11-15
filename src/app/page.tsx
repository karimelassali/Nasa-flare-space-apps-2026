import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  Atom,
  BookOpenCheck,
  Bot,
  Box,
  ChartNoAxesCombined,
  ChevronRight,
  Database,
  Download,
  ExternalLink,
  Flame,
  GitCompareArrows,
  Grid2X2Check,
  Layers,
  Orbit,
  Ruler,
  Rocket,
  ScanSearch,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { getCorpusStatistics } from '@/lib/evidence/repository';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingReveal } from '@/components/landing/LandingReveal';
import { WorkspaceShowcase } from '@/components/landing/WorkspaceShowcase';

export const metadata: Metadata = {
  title: 'FLARE — Follow the Flame. Follow the Evidence.',
  description:
    'Explore NASA microgravity combustion research, compare source-linked experiments, and see where the evidence stops applying.',
};

const workspaces = [
  {
    number: '01',
    icon: Bot,
    title: 'Research Agent',
    description:
      'Ask research questions, compare named investigations, and inspect the NASA records behind each answer.',
    href: '/agent',
    label: 'Open the agent',
    color: 'sky',
    featured: true,
  },
  {
    number: '02',
    icon: Rocket,
    title: 'Mission Mode',
    description:
      'Set a research scenario, rank relevant evidence, and export a source-linked Markdown or JSON brief.',
    href: '/mission',
    label: 'Explore Mission Mode',
    color: 'amber',
  },
  {
    number: '03',
    icon: Flame,
    title: 'IGNIS Scenario Lab',
    description:
      'Adjust qualitative atmosphere and flow inputs to inspect research coverage and gaps.',
    href: '/ignis',
    label: 'Open the scenario lab',
    color: 'amber',
  },
  {
    number: '04',
    icon: Box,
    title: '3D Simulation Lab',
    description:
      'Explore chamber views, sample geometry, gravity context, and sensor layers in a conceptual 3D scene.',
    href: '/simulation',
    label: 'Open the 3D lab',
    color: 'violet',
  },
  {
    number: '05',
    icon: Grid2X2Check,
    title: 'Evidence Explorer',
    description:
      'Filter records, review research coverage, and follow source notes back to NASA publications.',
    href: '/evidence',
    label: 'Explore the evidence',
    color: 'emerald',
  },
  {
    number: '06',
    icon: GitCompareArrows,
    title: 'Experiment Comparison',
    description:
      'Compare compatible reported values while keeping conditions, units, and unreported uncertainty visible.',
    href: '/compare?ids=EV-PSI98-01%2CEV-PSI100-01',
    label: 'Compare SAFFIRE records',
    color: 'amber',
  },
  {
    number: '07',
    icon: Database,
    title: 'NASA Knowledge Base',
    description:
      'Search records and investigation overviews, inspect provenance, and open source links.',
    href: '/knowledge',
    label: 'Open the knowledge base',
    color: 'sky',
  },
] as const;

const methodSteps = [
  {
    number: '01',
    title: 'Start with a question',
    body: 'Ask about a material, a flow regime, or an extinguishment result. The question sets the scope before any record is shown.',
    icon: Sparkles,
  },
  {
    number: '02',
    title: 'Select named records',
    body: 'Answers point at specific investigations such as FLEX-008 or SAFFIRE III-1. Selections that do not exist in the corpus are rejected.',
    icon: ScanSearch,
  },
  {
    number: '03',
    title: 'Keep the conditions attached',
    body: 'Each value carries its unit, sample geometry, atmosphere, and uncertainty. Droplet burn duration never becomes a flame-spread rate.',
    icon: Ruler,
  },
  {
    number: '04',
    title: 'Stop at the boundary',
    body: 'When a source does not report a quantity, the interface says “Not reported.” A gap in the corpus is not evidence of safety.',
    icon: ShieldAlert,
  },
] as const;

const faqs = [
  {
    question: 'Is FLARE a fire simulator or a flight-safety tool?',
    answer:
      'No. FLARE is a pre-mission research and education workspace. It does not predict ignition, detect fire onboard, or certify a material for flight. The 3D chamber is an illustration of geometry and setup, not a CFD solver.',
  },
  {
    question: 'Where does the evidence come from?',
    answer:
      'The corpus links to NASA Physical Sciences Informatics (PSI) records and NASA Technical Reports Server (NTRS) publications. Each record keeps its own source link, review-depth label, and condition notes.',
  },
  {
    question: 'Does it still work without an AI provider?',
    answer:
      'Yes. With no provider key — or when a provider request fails — FLARE falls back to a deterministic, source-based response built from the same local corpus. The interface labels which mode produced the answer.',
  },
  {
    question: 'Can it tell me a safe oxygen level?',
    answer:
      'No. A material-specific flammability boundary is not an operating limit. FLARE shows documented boundaries with their material, geometry, and test conditions, and explicitly keeps them separate from cabin setpoints.',
  },
] as const;

export default function LandingPage() {
  const corpus = getCorpusStatistics();

  return (
    <div className="flare-landing min-h-screen overflow-hidden bg-[#F7F9FC] text-[#0C1A2A]">
      <a
        href="#landing-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:shadow-xl"
      >
        Skip to content
      </a>

      <LandingHeader />

      <main id="landing-main">
        {/* HERO */}
        <section className="landing-hero relative isolate overflow-hidden bg-[#071421] pb-20 pt-[124px] text-white sm:pb-24 lg:pb-28 lg:pt-[150px]">
          <div aria-hidden="true" className="landing-stars absolute inset-0 -z-20" />
          <div aria-hidden="true" className="landing-stars landing-stars-twinkle absolute inset-0 -z-20" />
          <div
            aria-hidden="true"
            className="landing-orbit landing-orbit-one absolute -right-52 top-10 -z-10 h-[580px] w-[900px] rounded-[50%] border border-sky-300/[0.13]"
          />
          <div
            aria-hidden="true"
            className="landing-orbit landing-orbit-two absolute -right-36 top-24 -z-10 h-[480px] w-[760px] rounded-[50%] border border-orange-300/[0.10]"
          />
          <div aria-hidden="true" className="landing-glow absolute -right-24 top-32 -z-10 h-[520px] w-[680px] rounded-full" />
          <div aria-hidden="true" className="landing-hero-fade absolute inset-x-0 bottom-0 -z-10 h-40" />

          <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:px-12">
            <div className="relative z-10 max-w-[620px]">
              <div className="landing-enter inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-200/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.17em] text-sky-200 sm:text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FDBA74] shadow-[0_0_12px_#FB923C]" />
                2026 Space Apps · Flame in Freefall
              </div>

              <h1 className="landing-enter landing-enter-delay-1 landing-display mt-7 text-white">
                Follow the flame.
                <span className="landing-title-glow mt-1 block text-[#FDBA74]">Follow the evidence.</span>
              </h1>

              <p className="landing-enter landing-enter-delay-2 landing-lede mt-7 max-w-[540px] text-slate-300">
                What do spacecraft fire experiments actually tell us — and where does the evidence
                stop applying?
              </p>
              <p className="landing-enter landing-enter-delay-2 mt-3 max-w-[520px] text-[13px] leading-6 text-slate-400">
                FLARE brings NASA microgravity combustion research into one source-linked workspace
                built for careful exploration.
              </p>

              <div className="landing-enter landing-enter-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/compare?ids=EV-PSI98-01%2CEV-PSI100-01"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#F97316] px-6 text-[13px] font-semibold text-[#111827] shadow-[0_10px_30px_rgba(249,115,22,0.22)] transition hover:-translate-y-0.5 hover:bg-[#FB923C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071421]"
                >
                  See a real comparison
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/evidence"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 px-6 text-[13px] font-semibold text-white transition hover:border-white/35 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                >
                  Browse NASA evidence
                  <ChevronRight className="h-4 w-4 text-sky-200" />
                </Link>
              </div>

              <dl className="landing-enter landing-enter-delay-3 mt-10 grid max-w-[480px] grid-cols-3 gap-4 border-t border-white/10 pt-5">
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400">Records</dt>
                  <dd className="landing-stat mt-1 text-xl font-semibold text-white">{corpus.totalRecords}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400">Investigations</dt>
                  <dd className="landing-stat mt-1 text-xl font-semibold text-white">
                    {corpus.uniqueInvestigationCount}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400">Workspaces</dt>
                  <dd className="landing-stat mt-1 text-xl font-semibold text-white">7</dd>
                </div>
              </dl>
            </div>

            <div className="landing-enter landing-enter-delay-2 relative mx-auto w-full max-w-[680px] lg:ml-auto">
              <div aria-hidden="true" className="absolute -inset-5 rounded-[32px] bg-sky-400/[0.08] blur-3xl" />
              <div className="landing-preview relative overflow-hidden rounded-[22px] border border-white/15 bg-[#F4F7FA] p-2 shadow-[0_36px_100px_rgba(0,0,0,0.5)] sm:rounded-[28px] sm:p-3">
                <div className="flex h-9 items-center justify-between px-2 sm:px-3">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="h-2 w-2 rounded-full bg-[#F87171]" />
                    <span className="h-2 w-2 rounded-full bg-[#FBBF24]" />
                    <span className="h-2 w-2 rounded-full bg-[#34D399]" />
                  </div>
                  <span className="font-mono text-[9px] tracking-[0.1em] text-slate-500 sm:text-[10px]">
                    FLARE · EVIDENCE WORKSPACE
                  </span>
                  <span className="w-8" aria-hidden="true" />
                </div>
                <div className="relative overflow-hidden rounded-[16px] border border-slate-200 bg-white sm:rounded-[20px]">
                  <Image
                    src="/readme/experiment-comparison.png"
                    alt="The FLARE app comparing two SAFFIRE experiment records, with source notes and unreported uncertainties visible."
                    width={1440}
                    height={1100}
                    sizes="(max-width: 1024px) 92vw, 54vw"
                    className="h-auto w-full object-cover object-top"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#071421]/20 to-transparent" />
                  <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl border border-white/20 bg-[#071421]/75 px-3 py-2 backdrop-blur-md sm:inset-x-4 sm:bottom-4">
                    <span className="inline-flex items-center gap-2 text-[10px] font-medium text-white/80">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Source notes stay with the data
                    </span>
                    <span className="font-mono text-[9px] text-white/45">NASA PSI / NTRS</span>
                  </div>
                </div>
              </div>

              <div className="landing-float absolute -bottom-7 -left-2 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#102234]/95 px-4 py-3 shadow-2xl backdrop-blur md:flex lg:-left-8">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-400/10 text-orange-300">
                  <ChartNoAxesCombined className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-[10px] font-semibold text-white">Compare with context</span>
                  <span className="mt-0.5 block text-[9px] text-slate-400">Units · conditions · uncertainty</span>
                </span>
              </div>
              <div className="landing-float landing-float-slow absolute -top-5 right-6 hidden items-center gap-2 rounded-full border border-white/15 bg-[#0C1C2A]/95 px-3 py-2 text-[9px] font-medium text-white/75 shadow-xl backdrop-blur md:flex">
                <Atom className="h-3.5 w-3.5 text-sky-300" />
                {corpus.uniqueInvestigationCount} NASA investigations
              </div>
            </div>
          </div>

          <a
            href="#approach"
            className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-400 transition hover:text-slate-300 sm:flex"
          >
            Scroll to explore
            <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
          </a>
        </section>

        {/* TRUST STRIP */}
        <section aria-label="Research principles" className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-x-6 gap-y-5 px-5 py-7 sm:px-8 lg:grid-cols-4 lg:px-12">
            {[
              { icon: Database, title: 'Source-linked records', body: 'Every value keeps its NASA source.' },
              { icon: Ruler, title: 'Units stay honest', body: 'No cross-quantity comparisons.' },
              { icon: ShieldAlert, title: 'Gaps stay visible', body: '“Not reported” is never zero.' },
              { icon: Layers, title: 'Review depth labelled', body: 'Abstract vs. full-report review.' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F1F7FB] text-[#0877A8]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[12px] font-semibold text-[#142A3B]">{item.title}</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-slate-500">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* APPROACH */}
        <section id="approach" className="relative scroll-mt-20 bg-white px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="mx-auto grid max-w-[1150px] gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <LandingReveal>
              <p className="landing-eyebrow">
                <Sparkles className="h-3.5 w-3.5" /> WHY FLARE
              </p>
              <h2 className="landing-h2 mt-5 max-w-[450px] text-[#102234]">
                In space, the details change everything.
              </h2>
              <p className="landing-body mt-5 max-w-[450px] text-slate-600">
                A result only makes sense beside the conditions that produced it. Different fuels,
                airflow, oxygen, pressure, and sample geometry can change what a combustion
                experiment tells us.
              </p>
              <Link
                href="/knowledge"
                className="group mt-7 inline-flex items-center gap-2 text-[12px] font-semibold text-[#0877A8] transition hover:text-[#075985]"
              >
                Browse the knowledge base
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </LandingReveal>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Database,
                  title: 'Find the source',
                  text: 'Move from a question to named experiment records and their NASA publication.',
                },
                {
                  icon: GitCompareArrows,
                  title: 'Compare carefully',
                  text: 'Keep units and sample-specific conditions beside each reported value.',
                },
                {
                  icon: ShieldAlert,
                  title: 'See the boundary',
                  text: 'Unreported uncertainty and evidence gaps remain visible in the workflow.',
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <LandingReveal key={item.title} delay={index * 0.08} className="h-full">
                    <article className="landing-step h-full rounded-2xl border border-slate-200/80 bg-[#FAFBFD] p-5 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF5FB] text-[#0877A8]">
                          <Icon className="h-[18px] w-[18px]" />
                        </div>
                        <span className="font-mono text-[10px] tracking-[0.12em] text-slate-400">
                          0{index + 1}
                        </span>
                      </div>
                      <h3 className="mt-6 text-[14px] font-semibold text-[#142A3B]">{item.title}</h3>
                      <p className="mt-2 text-[12px] leading-6 text-slate-600">{item.text}</p>
                    </article>
                  </LandingReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* INSIDE */}
        <section id="inside" className="scroll-mt-20 bg-[#F2F6F9] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="mx-auto max-w-[1150px]">
            <LandingReveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="landing-eyebrow">
                  <Layers className="h-3.5 w-3.5" /> INSIDE THE WORKSPACE
                </p>
                <h2 className="landing-h2 mt-5 max-w-[610px] text-[#102234]">
                  See the workspace, not just the promise.
                </h2>
              </div>
              <p className="landing-body max-w-[360px] text-slate-600">
                Three views of the same idea: a question, the record behind it, and the limits of
                what that record can support.
              </p>
            </LandingReveal>

            <LandingReveal delay={0.08} className="mt-10 lg:mt-14">
              <WorkspaceShowcase />
            </LandingReveal>
          </div>
        </section>

        {/* WORKSPACES */}
        <section id="workspaces" className="scroll-mt-20 bg-white px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="mx-auto max-w-[1150px]">
            <LandingReveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="landing-eyebrow">
                  <Orbit className="h-3.5 w-3.5" /> ONE RESEARCH WORKSPACE
                </p>
                <h2 className="landing-h2 mt-5 max-w-[610px] text-[#102234]">
                  One question. Seven ways to explore.
                </h2>
              </div>
              <p className="landing-body max-w-[360px] text-slate-600">
                Start with a guided comparison, then follow the source into the rest of the research
                tools.
              </p>
            </LandingReveal>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
              {workspaces.map((workspace, index) => {
                const Icon = workspace.icon;
                return (
                  <LandingReveal key={workspace.number} delay={index * 0.07} className="h-full">
                    <Link
                      href={workspace.href}
                      className={`landing-workspace group flex h-full min-h-[258px] flex-col rounded-2xl border p-5 transition duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:p-6 ${
                        'featured' in workspace && workspace.featured
                          ? 'border-[#FDBA74] bg-gradient-to-b from-[#FFF7ED] to-white shadow-[0_18px_45px_rgba(234,88,12,0.12)] hover:border-[#EA580C]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_18px_45px_rgba(15,35,55,0.08)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[10px] tracking-[0.12em] text-slate-400">
                            WORKSPACE / {workspace.number}
                          </span>
                          {'featured' in workspace && workspace.featured ? (
                            <span className="rounded-full bg-[#EA580C] px-2 py-0.5 text-[9px] font-bold tracking-wide text-white">
                              START HERE · AI
                            </span>
                          ) : null}
                        </span>
                        <span className={`landing-icon landing-icon-${workspace.color}`}>
                          <Icon className="h-[17px] w-[17px]" />
                        </span>
                      </div>
                      <h3 className="mt-7 text-[17px] font-semibold tracking-[-0.02em] text-[#12283A]">
                        {workspace.title}
                      </h3>
                      <p className="mt-2 flex-1 text-[12px] leading-6 text-slate-600">
                        {workspace.description}
                      </p>
                      <span className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold text-[#0877A8]">
                        {workspace.label}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  </LandingReveal>
                );
              })}
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200/80 bg-[#FAFBFD] p-4 sm:grid-cols-3 sm:p-5">
              {[
                { icon: Download, title: 'Portable research briefs', text: 'Markdown and JSON exports from supported workflows.' },
                { icon: Sparkles, title: 'Optional AI assistance', text: 'Provider-backed analysis with a deterministic corpus fallback.' },
                { icon: ExternalLink, title: 'Traceable sources', text: 'Open linked NASA reports and PSI source pages.' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <LandingReveal key={item.title} delay={index * 0.1}>
                    <div className="flex items-start gap-3 rounded-xl p-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0877A8]" />
                      <div>
                        <h3 className="text-[12px] font-semibold text-[#142A3B]">{item.title}</h3>
                        <p className="mt-1 text-[11px] leading-5 text-slate-600">{item.text}</p>
                      </div>
                    </div>
                  </LandingReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* METHOD + WORKED EXAMPLE */}
        <section id="method" className="scroll-mt-20 bg-[#F2F6F9] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="mx-auto grid max-w-[1150px] gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
            <div>
              <LandingReveal>
                <p className="landing-eyebrow">
                  <ScanSearch className="h-3.5 w-3.5" /> HOW A CLAIM TRAVELS
                </p>
                <h2 className="landing-h2 mt-5 max-w-[520px] text-[#102234]">
                  Four checks between a question and a conclusion.
                </h2>
                <p className="landing-body mt-5 max-w-[520px] text-slate-600">
                  FLARE is built so the evidence trail is visible at every step — including the step
                  where the answer has to stop.
                </p>
              </LandingReveal>

              <ol className="landing-timeline mt-10 flex flex-col gap-0">
                {methodSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <LandingReveal key={step.number} delay={index * 0.06}>
                      <li className="relative flex gap-5 pb-8 last:pb-0">
                        <span className="landing-timeline-dot relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0877A8] shadow-sm">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="pt-1">
                          <div className="flex items-baseline gap-3">
                            <span className="font-mono text-[10px] tracking-[0.14em] text-slate-400">
                              {step.number}
                            </span>
                            <h3 className="text-[15px] font-semibold text-[#142A3B]">{step.title}</h3>
                          </div>
                          <p className="mt-1.5 max-w-[430px] text-[12px] leading-6 text-slate-600">
                            {step.body}
                          </p>
                        </div>
                      </li>
                    </LandingReveal>
                  );
                })}
              </ol>
            </div>

            <LandingReveal delay={0.1} className="h-full">
              <div className="landing-example lg:sticky lg:top-28 overflow-hidden rounded-[26px] bg-[#0C1C2A] p-6 text-white shadow-[0_30px_70px_-40px_rgba(8,25,40,0.7)] sm:p-8">
                <div aria-hidden="true" className="landing-example-glow absolute inset-0" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-sky-200/80">
                      Worked example
                    </span>
                    <span className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[9px] text-white/55">
                      SAFFIRE I vs III
                    </span>
                  </div>

                  <p className="mt-5 text-[15px] font-medium leading-6 text-white/90">
                    Two large SIBAL fabric panels burned in concurrent flow. The source table reports
                    different spread rates and different burn durations.
                  </p>

                  <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
                    <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] gap-2 bg-white/[0.04] px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-white/45">
                      <span>Record</span>
                      <span className="text-right">Spread</span>
                      <span className="text-right">Burn</span>
                    </div>
                    {[
                      { name: 'SAFFIRE-I', spread: '1.8 mm/s', burn: '420 s' },
                      { name: 'SAFFIRE-III', spread: '2.3 mm/s', burn: '300 s' },
                    ].map((row) => (
                      <div
                        key={row.name}
                        className="grid grid-cols-[1.2fr_0.9fr_0.9fr] items-center gap-2 border-t border-white/[0.07] px-4 py-3 text-[12px]"
                      >
                        <span className="font-medium text-white/90">{row.name}</span>
                        <span className="text-right font-mono text-[#FDBA74]">{row.spread}</span>
                        <span className="text-right font-mono text-sky-200">{row.burn}</span>
                      </div>
                    ))}
                  </div>

                  <ul className="mt-5 flex flex-col gap-2 text-[11px] leading-5 text-white/60">
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-300/70" />
                      Uncertainty is not reported in the source table, so no error bars are drawn.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-300/70" />
                      Flow differs: 20 cm/s for SAFFIRE-I, 25 cm/s for SAFFIRE-III.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-300/70" />
                      Two tests do not establish a general ventilation rule.
                    </li>
                  </ul>

                  <Link
                    href="/compare?ids=EV-PSI98-01%2CEV-PSI100-01"
                    className="group mt-6 inline-flex items-center gap-2 text-[12px] font-semibold text-[#FDBA74] transition hover:text-orange-200"
                  >
                    Open the live comparison
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </LandingReveal>
          </div>
        </section>

        {/* SCOPE */}
        <section id="scope" className="scroll-mt-20 bg-white px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="mx-auto max-w-[1150px]">
            <LandingReveal className="mx-auto max-w-[720px] text-center">
              <p className="landing-eyebrow justify-center">
                <Flame className="h-3.5 w-3.5" /> SCIENCE WITH ITS LIMITS IN VIEW
              </p>
              <h2 className="landing-h2 mt-5 text-[#102234]">
                Useful research starts with honest boundaries.
              </h2>
              <p className="landing-body mt-5 text-slate-600">
                FLARE helps people navigate and compare research. It does not turn different
                experiments into a single universal rule, and its 3D chamber is an illustration — not
                a combustion solver.
              </p>
            </LandingReveal>

            <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <LandingReveal>
                <div className="landing-scope-card relative h-full overflow-hidden rounded-[24px] bg-[#0D2031] p-6 text-white shadow-[0_24px_70px_rgba(15,35,55,0.16)] sm:p-8">
                  <div
                    aria-hidden="true"
                    className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-sky-400/10 blur-3xl"
                  />
                  <div className="relative flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-200/15 bg-orange-300/10 text-orange-300">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-200/80">
                        Research use only
                      </p>
                      <h3 className="mt-3 text-[17px] font-semibold tracking-[-0.02em]">
                        Evidence, not a flight decision.
                      </h3>
                      <p className="mt-3 text-[12px] leading-6 text-slate-300">
                        No fire prediction. No onboard detection. No flight-safety certification. The
                        interface keeps those boundaries visible alongside the tools.
                      </p>
                    </div>
                  </div>
                  <div className="relative mt-7 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
                    <div>
                      <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400">
                        Corpus
                      </span>
                      <span className="mt-1.5 block text-2xl font-semibold tracking-[-0.04em]">
                        {corpus.totalRecords}
                      </span>
                      <span className="text-[10px] text-slate-400">records</span>
                    </div>
                    <div>
                      <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400">
                        Programs
                      </span>
                      <span className="mt-1.5 block text-2xl font-semibold tracking-[-0.04em]">
                        {corpus.uniqueInvestigationCount}
                      </span>
                      <span className="text-[10px] text-slate-400">investigations</span>
                    </div>
                    <div>
                      <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400">
                        Workspaces
                      </span>
                      <span className="mt-1.5 block text-2xl font-semibold tracking-[-0.04em]">7</span>
                      <span className="text-[10px] text-slate-400">research tools</span>
                    </div>
                  </div>
                </div>
              </LandingReveal>

              <LandingReveal delay={0.08}>
                <div className="h-full rounded-[24px] border border-slate-200 bg-[#FAFBFD] p-6 sm:p-8">
                  <p className="landing-eyebrow">
                    <BookOpenCheck className="h-3.5 w-3.5" /> OPEN QUESTION
                  </p>
                  <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.02em] text-[#142A3B]">
                    One discrepancy stays unanswered.
                  </h3>
                  <p className="mt-3 text-[12px] leading-6 text-slate-600">
                    NASA’s SAFFIRE-V publications report different atmosphere values for sample V-4.
                    FLARE shows the reports separately instead of merging them into a new range — and
                    the 34% O₂ / 56.5 kPa preset is labelled as illustrative planning context.
                  </p>
                  <Link
                    href="/knowledge"
                    className="group mt-5 inline-flex items-center gap-2 text-[12px] font-semibold text-[#0877A8] transition hover:text-[#075985]"
                  >
                    Read the record notes
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </LandingReveal>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 bg-[#F2F6F9] px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto grid max-w-[1150px] gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <LandingReveal>
              <p className="landing-eyebrow">
                <Atom className="h-3.5 w-3.5" /> BEFORE YOU EXPLORE
              </p>
              <h2 className="landing-h2 mt-5 max-w-[360px] text-[#102234]">
                Questions judges ask first.
              </h2>
              <p className="landing-body mt-5 max-w-[340px] text-slate-600">
                Short answers about the method, the sources, and what the tool refuses to do.
              </p>
            </LandingReveal>

            <LandingReveal delay={0.08}>
              <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {faqs.map((faq) => (
                  <details key={faq.question} className="landing-faq group px-5 py-4 sm:px-6">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[13px] font-semibold text-[#142A3B] marker:hidden">
                      {faq.question}
                      <ChevronRight className="landing-faq-chevron h-4 w-4 shrink-0 text-slate-400 transition-transform" />
                    </summary>
                    <p className="landing-faq-answer mt-3 max-w-[620px] text-[12px] leading-6 text-slate-600">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </LandingReveal>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
          <LandingReveal>
            <div className="landing-cta relative mx-auto max-w-[1150px] overflow-hidden rounded-[26px] bg-[#0C1C2A] px-6 py-10 text-center text-white sm:px-12 sm:py-14">
              <div aria-hidden="true" className="absolute inset-0 opacity-70" />
              <div className="relative mx-auto max-w-[650px]">
                <p className="font-mono text-[10px] uppercase tracking-[0.19em] text-sky-200/80">
                  Start with the evidence
                </p>
                <h2 className="landing-h2 mt-4 text-white">See what the experiments say.</h2>
                <p className="mx-auto mt-4 max-w-[500px] text-[13px] leading-6 text-slate-300">
                  Begin with a side-by-side comparison of two NASA SAFFIRE records, then explore the
                  conditions and source notes.
                </p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/compare?ids=EV-PSI98-01%2CEV-PSI100-01"
                    className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-[12px] font-semibold text-[#12283A] transition hover:-translate-y-0.5 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C1C2A]"
                  >
                    Start the guided comparison
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/agent"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-5 text-[12px] font-semibold text-white transition hover:border-white/40 hover:bg-white/[0.06]"
                  >
                    Ask a research question
                    <ChevronRight className="h-3.5 w-3.5 text-sky-200" />
                  </Link>
                </div>
              </div>
            </div>
          </LandingReveal>
        </section>

        {/* PROJECT COVER — closing visual before the footer */}
        <section id="cover" className="relative scroll-mt-20 overflow-hidden bg-[#071421] px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12">
          <div aria-hidden="true" className="landing-cover-glow pointer-events-none absolute inset-x-0 h-[520px]" />
          <div className="relative mx-auto max-w-[1120px]">
            <LandingReveal>
              <div className="mb-7 flex flex-col justify-between gap-4 sm:mb-9 sm:flex-row sm:items-end">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.17em] text-orange-200/85">
                    THE FLARE PROJECT · PYROSHIELD ZERO-G
                  </p>
                  <h2 className="landing-h2 mt-3 text-white">The project, at a glance.</h2>
                </div>
                <p className="max-w-[360px] text-[12px] leading-6 text-slate-400">
                  Our cover brings the challenge, the team, and the microgravity fire-safety mission together.
                </p>
              </div>
              <figure className="landing-cover-frame overflow-hidden rounded-[22px] border border-white/15 bg-[#0B1A28] p-1.5 shadow-[0_35px_100px_rgba(0,0,0,0.48)] sm:rounded-[30px] sm:p-2.5">
                <Image
                  src="/splash.png"
                  alt="FLARE project cover showing the NASA Space Apps Challenge 2026 identity, the FLARE microgravity fire-safety mark, and Earth from orbit."
                  width={1536}
                  height={1024}
                  sizes="(max-width: 1120px) 100vw, 1120px"
                  className="h-auto w-full rounded-[16px] sm:rounded-[22px]"
                />
              </figure>
              <figcaption className="mt-4 flex flex-col justify-between gap-1 px-1 font-mono text-[9px] uppercase tracking-[0.1em] text-slate-400 sm:flex-row sm:items-center">
                <span>FLARE · Microgravity Fire Safety Intelligence</span>
                <span>PyroShield Zero-G · NASA Space Apps 2026</span>
              </figcaption>
            </LandingReveal>
          </div>
        </section>
      </main>

      <footer className="bg-[#071421] px-5 py-12 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1150px]">
          <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <Link href="/" aria-label="FLARE home" className="flex items-center">
                <Image
                  src="/logo-full.png"
                  alt="FLARE — Microgravity Fire Safety Intelligence"
                  width={440}
                  height={141}
                  className="h-auto w-[210px] object-contain"
                />
              </Link>
              <p className="mt-5 max-w-[300px] text-[11px] leading-5 text-slate-400">
                A source-linked workspace for exploring NASA microgravity combustion research,
                built for the 2026 NASA International Space Apps Challenge.
              </p>
            </div>

            <nav aria-label="Workspace links">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Explore</p>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11px] text-slate-400">
                <li><Link className="transition hover:text-white" href="/agent">Research Agent</Link></li>
                <li><Link className="transition hover:text-white" href="/mission">Mission Mode</Link></li>
                <li><Link className="transition hover:text-white" href="/compare">Comparison</Link></li>
                <li><Link className="transition hover:text-white" href="/evidence">Evidence Explorer</Link></li>
                <li><Link className="transition hover:text-white" href="/knowledge">Knowledge Base</Link></li>
                <li><Link className="transition hover:text-white" href="/ignis">IGNIS Lab</Link></li>
                <li><Link className="transition hover:text-white" href="/simulation">3D Simulation</Link></li>
              </ul>
            </nav>

            <nav aria-label="NASA sources">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Sources</p>
              <ul className="mt-4 flex flex-col gap-2.5 text-[11px] text-slate-400">
                <li>
                  <a className="transition hover:text-white" href="https://ntrs.nasa.gov/" target="_blank" rel="noreferrer">
                    NASA Technical Reports Server
                  </a>
                </li>
                <li>
                  <a className="transition hover:text-white" href="https://psi.nasa.gov/physci/repo" target="_blank" rel="noreferrer">
                    NASA Physical Sciences Informatics
                  </a>
                </li>
                <li>
                  <a className="transition hover:text-white" href="https://www.spaceappschallenge.org/" target="_blank" rel="noreferrer">
                    NASA Space Apps Challenge
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className="flex flex-col justify-between gap-3 pt-6 text-[10px] leading-5 text-slate-500 sm:flex-row sm:items-center">
            <p>Independent student project for the NASA Space Apps Challenge. Not endorsed by NASA.</p>
            <p>Pre-mission research and education only · Not for flight-safety decisions</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
