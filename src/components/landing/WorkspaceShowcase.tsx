'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  GitCompareArrows,
  Orbit,
} from 'lucide-react';

const TABS = [
  {
    id: 'agent',
    label: 'Research Agent',
    icon: BookOpenCheck,
    image: '/readme/research-agent.png',
    alt: 'The FLARE Research Agent answering a FLEX-008 question with a cited record, measurements, and limitations.',
    title: 'Ask in plain language. Get a record back.',
    description:
      'Every answer names the investigation, the measurement, and the NASA source behind it. When the model tries to cite something that is not in the corpus, the selection is rejected.',
    points: [
      'Cited record IDs with direct NTRS links',
      'Deterministic fallback when no AI key is configured',
      'Comparison hand-off keeps both records selected',
    ],
    href: '/agent',
    cta: 'Ask the research',
  },
  {
    id: 'compare',
    label: 'Comparison',
    icon: GitCompareArrows,
    image: '/readme/experiment-comparison.png',
    alt: 'The FLARE comparison workspace showing 1.8 versus 2.3 mm/s spread rates for two SAFFIRE records with source notes.',
    title: 'Two experiments. One honest axis.',
    description:
      'Charts appear only when both records report the same physical quantity in the same unit. Everything else stays qualitative, with the condition notes that produced each value.',
    points: [
      'SAFFIRE-I 1.8 mm/s and 420 s · SAFFIRE-III 2.3 mm/s and 300 s',
      'Unknown uncertainty is labelled "Not reported", never plotted as zero',
      'Swapping or reloading keeps the pair in the URL',
    ],
    href: '/compare?ids=EV-PSI98-01%2CEV-PSI100-01',
    cta: 'Open this comparison',
  },
  {
    id: 'simulation',
    label: '3D Lab',
    icon: Orbit,
    image: '/readme/3d-simulation.png',
    alt: 'The FLARE 3D lab showing a conceptual combustion chamber, flow particles, and sensor stalks with a disclaimer.',
    title: 'Change the chamber, not the physics.',
    description:
      'The WebGL scene is an illustration of geometry and setup. Load a record to adopt its documented conditions, then orbit, switch camera presets, and toggle layers — with the disclaimer always on screen.',
    points: [
      'Chamber, sample, gravity, and layer controls',
      'Snapshot export carries the conceptual-view notice',
      'Never presented as CFD or a measured flame shape',
    ],
    href: '/simulation',
    cta: 'Open the 3D lab',
  },
] as const;

export function WorkspaceShowcase() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const tab = TABS[active];
  const Icon = tab.icon;

  function focusTab(index: number) {
    const next = (index + TABS.length) % TABS.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200/90 bg-white shadow-[0_30px_80px_-50px_rgba(15,35,55,0.45)]">
      <div
        role="tablist"
        aria-label="Product previews"
        className="flex gap-1 overflow-x-auto border-b border-slate-200/80 bg-[#FAFBFD] px-3 py-3 sm:px-4"
      >
        {TABS.map((item, index) => {
          const TabIcon = item.icon;
          const selected = index === active;
          return (
            <button
              key={item.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`showcase-tab-${item.id}`}
              aria-selected={selected}
              aria-controls="showcase-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  focusTab(index + 1);
                } else if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  focusTab(index - 1);
                } else if (event.key === 'Home') {
                  event.preventDefault();
                  focusTab(0);
                } else if (event.key === 'End') {
                  event.preventDefault();
                  focusTab(TABS.length - 1);
                }
              }}
              className={`landing-tab inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-semibold transition ${
                selected
                  ? 'bg-[#102234] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:text-[#102234]'
              }`}
            >
              <TabIcon className={`h-3.5 w-3.5 ${selected ? 'text-orange-300' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="showcase-panel"
        aria-labelledby={`showcase-tab-${tab.id}`}
        className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]"
      >
        <div className="relative border-b border-slate-200/70 bg-[#F2F6F9] p-3 sm:p-4 lg:border-b-0 lg:border-r">
          <div className="flex h-8 items-center gap-1.5 px-1" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-[#F87171]" />
            <span className="h-2 w-2 rounded-full bg-[#FBBF24]" />
            <span className="h-2 w-2 rounded-full bg-[#34D399]" />
            <span className="ml-auto font-mono text-[9px] tracking-[0.14em] text-slate-400">
              FLARE · LIVE WORKSPACE
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <Image
              key={tab.id}
              src={tab.image}
              alt={tab.alt}
              width={1440}
              height={1100}
              sizes="(max-width: 1024px) 92vw, 58vw"
              className="landing-shot h-auto w-full object-cover object-top"
            />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#F7F9FC] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0C6178]">
              <Icon className="h-3 w-3" />
              {tab.label}
            </span>
            <h3 className="mt-4 text-[22px] font-semibold leading-tight tracking-[-0.035em] text-[#102234] sm:text-[25px]">
              {tab.title}
            </h3>
            <p className="mt-3 text-[13px] leading-6 text-slate-600">{tab.description}</p>
            <ul className="mt-5 flex flex-col gap-2.5">
              {tab.points.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-[12px] leading-5 text-slate-600">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#E8F5FC] text-[#0877A8]">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={tab.href}
            className="group inline-flex w-fit items-center gap-2 text-[12px] font-semibold text-[#0877A8] transition hover:text-[#075985]"
          >
            {tab.cta}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
