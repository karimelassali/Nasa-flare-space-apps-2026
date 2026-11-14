'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { driver, type DriveStep, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '@/app/guide.css';

const COMPLETED_KEY = 'flare-full-app-guide-completed-v1';

function visibleNavTarget(name: string): Element {
  const candidates = document.querySelectorAll(
    `[data-tour="nav-${name}"], [data-tour="mobile-nav-${name}"]`
  );
  return Array.from(candidates).find((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.width > 0 && bounds.height > 0;
  }) ?? candidates[0];
}

function navigateAndStep(
  route: string,
  moveFn: () => void,
  delayMs = 800
): void {
  window.dispatchEvent(new CustomEvent('flare-guide-navigate', { detail: route }));
  window.setTimeout(moveFn, delayMs);
}

const GUIDE_STEPS: DriveStep[] = [
  {
    element: () => visibleNavTarget('agent'),
    popover: {
      title: 'Welcome to FLARE — Research Agent',
      description: 'This full walkthrough starts at the Research Agent and guides you through all seven FLARE modules: Agent, Mission Mode, IGNIS Lab, 3D Simulation Lab, Evidence Explorer, Experiment Comparison, and the NASA Knowledge Base.',
      side: 'right',
    },
  },
  {
    element: '[data-tour="agent-workspace"]',
    popover: {
      title: '1. How the Research Agent works',
      description: 'The Research Agent routes your question either to FLARE navigation help or to evidence-ranked synthesis across 21 NASA investigations and 24 source-linked records. Every answer includes inline NASA citations, limitations, next-step links, and downloadable markdown briefs.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="agent-input"]',
    popover: {
      title: '2. Ask follow-ups with active context',
      description: 'Click a starter card or type a custom query (Enter to send, Shift+Enter for a newline). The agent carries active experiment context across turns so follow-up questions stay grounded in the same studies.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="agent-capabilities"]',
    popover: {
      title: '3. Scientific transparency & guardrails',
      description: 'Each response explicitly badges whether it used AI synthesis or deterministic non-AI evidence fallback, and links directly to primary NASA Technical Report Server (NTRS) sources for independent verification.',
      side: 'left',
    },
  },
  {
    element: () => visibleNavTarget('mission'),
    popover: {
      title: 'Next: Mission Mode',
      description: 'Move from conversational discovery to structured spacecraft hazard analysis, boundary condition tuning, and habitat material screening.',
      side: 'right',
      nextBtnText: 'Open Mission Mode',
      onNextClick: (_element, _step, { driver: activeDriver }) => {
        navigateAndStep('/mission', () => activeDriver.moveNext());
      },
    },
  },
  {
    element: '[data-tour="mission-presets"]',
    popover: {
      title: '4. Choose a mission environment',
      description: 'Start with a spacecraft or mission preset (such as ISS Normoxic or Exploration Atmosphere). It supplies baseline oxygen, pressure, airflow, material, and gravity values that you can adjust below.',
      side: 'bottom',
      onPrevClick: (_element, _step, { driver: activeDriver }) => {
        navigateAndStep('/agent', () => activeDriver.movePrevious());
      },
    },
  },
  {
    element: '[data-tour="mission-controls"]',
    popover: {
      title: '5. Set boundary conditions',
      description: 'Adjust oxygen concentration, total pressure, forced airflow, fuel material, and gravity. FLARE flags when target conditions exceed all solid-fuel orbital flight tests.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="mission-question"]',
    popover: {
      title: '6. Analyze scenario or open Research Agent',
      description: 'Run Analyze Configured Scenario to rank NASA records and generate a cited brief, or jump directly to the Research Agent for custom multi-turn questions.',
      side: 'left',
    },
  },
  {
    element: '[data-tour="mission-screening"]',
    popover: {
      title: '7. Habitat Material Screening Matrix',
      description: 'Evaluate six habitat material classes against your active atmosphere and gravity settings, computing exact parameter deltas from source-linked NASA orbital records.',
      side: 'top',
    },
  },
  {
    element: () => visibleNavTarget('ignis'),
    popover: {
      title: 'Next: IGNIS Scenario Lab',
      description: 'Continue to a live qualitative combustion model. It connects oxygen, flow, fuel, and gravity settings with relevant NASA evidence.',
      side: 'right',
      nextBtnText: 'Open IGNIS',
      onNextClick: (_element, _step, { driver: activeDriver }) => {
        navigateAndStep('/ignis', () => activeDriver.moveNext());
      },
    },
  },
  {
    element: '[data-tour="ignis-controls"]',
    popover: {
      title: '8. Explore qualitative regimes',
      description: 'Adjust oxygen, forced airflow, fuel, and gravity. The visualization and boundary readout update with your settings, while ranked records show supporting experiments.',
      side: 'left',
      onPrevClick: (_element, _step, { driver: activeDriver }) => {
        navigateAndStep('/mission', () => activeDriver.movePrevious());
      },
    },
  },
  {
    element: '[data-tour="ignis-visual"]',
    popover: {
      title: '9. Read the model and evidence',
      description: 'Inspect the flame regime and boundary panel, then review matching studies and their limitations. Open any record for full provenance and source details.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="ignis-quiz"]',
    popover: {
      title: '10. Microgravity Fire-Safety Challenge',
      description: 'Test your microgravity fire-safety intuition with an interactive five-question drill grounded in source-linked NASA report citations.',
      side: 'top',
    },
  },
  {
    element: () => visibleNavTarget('simulation'),
    popover: {
      title: 'Next: 3D Simulation Lab',
      description: 'Move from the qualitative scenario into an interactive 3D chamber, where you can change the vessel, fuel geometry, conditions, and camera.',
      side: 'right',
      nextBtnText: 'Open 3D Lab',
      onNextClick: (_element, _step, { driver: activeDriver }) => {
        navigateAndStep('/simulation', () => activeDriver.moveNext());
      },
    },
  },
  {
    element: '[data-tour="simulation-controls"]',
    popover: {
      title: '11. Configure a 3D experiment',
      description: 'Select a chamber and fuel geometry, load a NASA record preset (including SAFFIRE-VI and SLICE), and tune oxygen, pressure, airflow, and display options.',
      side: 'left',
      onPrevClick: (_element, _step, { driver: activeDriver }) => {
        navigateAndStep('/ignis', () => activeDriver.movePrevious());
      },
    },
  },
  {
    element: '[data-tour="simulation-gravity-flip"]',
    popover: {
      title: '12. Instant 0g ↔ 1g buoyancy flip',
      description: 'Toggle gravitational buoyancy in real time to compare a rising terrestrial teardrop flame against a spherical microgravity flame.',
      side: 'right',
    },
  },
  {
    element: '[data-tour="simulation-scene"]',
    popover: {
      title: '13. Inspect the 3D chamber',
      description: 'Use the scene controls to play or pause, reset, and choose camera views. This is an illustrative scenario model, not a certified flight-safety prediction.',
      side: 'left',
    },
  },
  {
    element: () => visibleNavTarget('evidence'),
    popover: {
      title: 'Next: Evidence Explorer',
      description: 'Explore the shape and limits of the loaded 24-record NASA corpus with filters, coverage maps, research gaps, and 1g vs 0g comparisons.',
      side: 'right',
      nextBtnText: 'Explore evidence',
      onNextClick: (_element, _step, { driver: activeDriver }) => {
        navigateAndStep('/evidence', () => activeDriver.moveNext());
      },
    },
  },
  {
    element: '[data-tour="evidence-filters"]',
    popover: {
      title: '14. Filter the evidence corpus',
      description: 'Narrow records by investigation, platform, material, oxygen, pressure, and airflow. The counts, heatmap, and charts reflect the filtered slice.',
      side: 'bottom',
      onPrevClick: (_element, _step, { driver: activeDriver }) => {
        navigateAndStep('/simulation', () => activeDriver.movePrevious());
      },
    },
  },
  {
    element: '[data-tour="evidence-heatmap"]',
    popover: {
      title: '15. Find coverage and gaps',
      description: 'Each heatmap cell groups evidence by oxygen and airflow ranges. Select a populated cell to inspect supporting records; empty areas describe gaps in this loaded corpus, not proof that NASA never tested them.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="evidence-crossover"]',
    popover: {
      title: '16. 1g vs 0g Matrix & Terrestrial Crossover',
      description: 'Compare empirical shifts between Earth (1g) and microgravity (0g) across SAFFIRE, SLICE, and SAME studies alongside practical terrestrial fire-safety takeaways.',
      side: 'top',
    },
  },
  {
    element: () => visibleNavTarget('compare'),
    popover: {
      title: 'Next: Experiment Comparison',
      description: 'Compare two specific records side by side, including test conditions, fuels, findings, and compatible measurements.',
      side: 'right',
      nextBtnText: 'Compare records',
      onNextClick: (_element, _step, { driver: activeDriver }) => {
        navigateAndStep('/compare', () => activeDriver.moveNext());
      },
    },
  },
  {
    element: '[data-tour="compare-selectors"]',
    popover: {
      title: '17. Select and compare experiments',
      description: 'Choose a record for each side or swap them. Charts appear only when both records report compatible measurements in matching units; the table still shows the full comparison.',
      side: 'bottom',
      onPrevClick: (_element, _step, { driver: activeDriver }) => {
        navigateAndStep('/evidence', () => activeDriver.movePrevious());
      },
    },
  },
  {
    element: () => visibleNavTarget('knowledge'),
    popover: {
      title: 'Next: NASA Knowledge Base',
      description: 'Finish by browsing all source-linked NASA records directly and opening any record for its detailed metadata and provenance.',
      side: 'right',
      nextBtnText: 'Open knowledge base',
      onNextClick: (_element, _step, { driver: activeDriver }) => {
        navigateAndStep('/knowledge', () => activeDriver.moveNext());
      },
    },
  },
  {
    element: '[data-tour="knowledge-table"]',
    popover: {
      title: '18. Search and inspect source records',
      description: 'Search by NASA identifier, campaign, material, or finding; filter by platform, fuel, and record type; then inspect a row to see its full details and source links.',
      side: 'top',
      onPrevClick: (_element, _step, { driver: activeDriver }) => {
        navigateAndStep('/compare', () => activeDriver.movePrevious());
      },
    },
  },
  {
    element: '[data-tour="guide-button"]',
    popover: {
      title: 'Your guide is always here',
      description: 'Select Guide in the header any time to replay this full walkthrough from the Research Agent across all seven FLARE modules.',
      side: 'bottom',
      doneBtnText: 'Finish guide',
    },
  },
];

interface AppGuideProps {
  requested: boolean;
  onRequestHandled: () => void;
}

export function AppGuide({ requested, onRequestHandled }: AppGuideProps) {
  const router = useRouter();
  const pathname = usePathname();
  const driverRef = useRef<Driver | null>(null);
  const requestedRef = useRef(false);

  const startGuide = useCallback(() => {
    const activeDriver = driver({
      steps: GUIDE_STEPS,
      showProgress: true,
      animate: true,
      smoothScroll: true,
      waitForElement: 10000,
      allowClose: true,
      allowKeyboardControl: true,
      popoverClass: 'flare-driver-popover',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Finish',
      onDestroyed: () => {
        try {
          window.localStorage.setItem(COMPLETED_KEY, 'true');
        } catch {
          // The walkthrough still works when browser storage is unavailable.
        }
        driverRef.current = null;
      },
    });
    driverRef.current = activeDriver;
    activeDriver.drive();
  }, []);

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const target = (event as CustomEvent<string>).detail;
      router.push(target);
    };
    window.addEventListener('flare-guide-navigate', handleNavigate);
    return () => window.removeEventListener('flare-guide-navigate', handleNavigate);
  }, [router]);

  useEffect(() => {
    if (!requested || requestedRef.current) return;
    requestedRef.current = true;
    onRequestHandled();
    if (pathname !== '/agent') {
      router.push('/agent');
      window.setTimeout(startGuide, 500);
    } else {
      window.setTimeout(startGuide, 150);
    }
    window.setTimeout(() => {
      requestedRef.current = false;
    }, 800);
  }, [requested, pathname, router, onRequestHandled, startGuide]);

  useEffect(() => () => driverRef.current?.destroy(), []);

  return null;
}
