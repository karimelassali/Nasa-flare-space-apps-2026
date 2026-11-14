'use client';

import { ArrowRightLeft, ExternalLink, Flame, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GravityContrastRow {
  id: string;
  phenomenon: string;
  normalGravity1g: string;
  microgravity0g: string;
  terrestrialCrossover: string;
  sourceLabel: string;
  sourceUrl: string;
}

const GRAVITY_CONTRAST_ROWS: GravityContrastRow[] = [
  {
    id: 'EV-PSI25-02',
    phenomenon: 'PMMA Rod Minimum Oxygen Concentration (MOC)',
    normalGravity1g: '15.4% O₂ upward limit in normal gravity',
    microgravity0g: '13.5% O₂ MOC at stretch rate a = 8–12 s⁻¹ (1.9% O₂ lower than 1g)',
    terrestrialCrossover:
      'Shows why a material-specific experimental extinction boundary cannot be used as a safe occupied-room oxygen setting.',
    sourceLabel: 'BASS-II · NTRS 20210011385 (pp. 64–76)',
    sourceUrl: 'https://ntrs.nasa.gov/citations/20210011385',
  },
  {
    id: 'EV-PSI99-03',
    phenomenon: 'Thin Silicone & Nomex Self-Extinguishment',
    normalGravity1g: 'Silicone 1g comparison strips (II-1, II-2, II-4) burned 7.6 cm or completely',
    microgravity0g: 'All four Silicone strips (0.27–1.03 mm) & Nomex (0.37 mm) self-extinguished (~0 cm)',
    terrestrialCrossover:
      'Isolates radiative heat-loss quenching from buoyant convection, improving flame-retardant polymer screening.',
    sourceLabel: 'SAFFIRE-II · NTRS 20180005168 (Table 1)',
    sourceUrl: 'https://ntrs.nasa.gov/citations/20180005168',
  },
  {
    id: 'EV-SLICE-01',
    phenomenon: 'Coflow CH₄ Soot Volume Fraction & Distribution',
    normalGravity1g: 'Higher soot temperatures; soot concentrated along the flame centerline',
    microgravity0g: 'Lower soot temperatures, higher soot volume fraction, soot shifted to flame wings',
    terrestrialCrossover:
      'Benchmarks soot-radiation and optical smoke-sensor models without buoyant turbulence interference.',
    sourceLabel: 'SLICE · NTRS 20140017780',
    sourceUrl: 'https://ntrs.nasa.gov/citations/20140017780',
  },
  {
    id: 'EV-SAME-01',
    phenomenon: 'Pre-Ignition Smoke Particle Size (0–8 cm/s)',
    normalGravity1g: 'No matched normal-gravity numerical comparison extracted from this source.',
    microgravity0g: '200–400 nm average particles; quiescent flow produced substantially larger aggregates',
    terrestrialCrossover:
      'Informs multi-moment optical/ion smoke detectors that distinguish slow smoldering from nuisance dust.',
    sourceLabel: 'SAME-2 · NTRS 20130000422',
    sourceUrl: 'https://ntrs.nasa.gov/citations/20130000422',
  },
];

export function GravityCrossoverPanel() {
  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="cyan">1g vs. 0g Comparative Matrix</Badge>
            <Badge variant="outline" className="font-mono-telemetry">
              Spacecraft &amp; Terrestrial Crossover
            </Badge>
          </div>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-[#0284C7]" />
            <span>Normal Gravity (1g) vs. Microgravity (0g) Hazard Shifts</span>
          </CardTitle>
          <CardDescription>
            Empirical differences documented in NASA PSI/NTRS campaigns and how microgravity combustion physics informs terrestrial fire safety.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GRAVITY_CONTRAST_ROWS.map((row) => (
          <div
            key={row.id}
            className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#D97706] shrink-0" />
                <h3 className="text-sm font-semibold text-[#0F172A]">
                  {row.phenomenon}
                </h3>
              </div>
              <span className="font-mono-telemetry text-[10px] px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#E2E8F0] text-[#334155] shrink-0">
                {row.id}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-md bg-[#FFFFFF] border border-[#E2E8F0] p-2.5">
                <span className="font-mono-telemetry text-[10px] uppercase tracking-wider text-[#64748B] block mb-1">
                  Normal Gravity (1g)
                </span>
                <span className="text-[#334155] leading-relaxed">
                  {row.normalGravity1g}
                </span>
              </div>
              <div className="rounded-md bg-[#FFFFFF] border border-[#0284C7]/30 p-2.5">
                <span className="font-mono-telemetry text-[10px] uppercase tracking-wider text-[#0284C7] block mb-1">
                  Microgravity (0g)
                </span>
                <span className="text-[#0F172A] leading-relaxed">
                  {row.microgravity0g}
                </span>
              </div>
            </div>

            <div className="rounded-md bg-[#FFFFFF] border border-[#E2E8F0] p-2.5 text-xs flex items-start gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-[#059669] shrink-0 mt-0.5" />
              <div>
                <span className="font-mono-telemetry text-[10px] uppercase tracking-wider text-[#059669] block">
                  Research interpretation · not a measured outcome
                </span>
                <span className="text-[#334155] leading-relaxed">
                  {row.terrestrialCrossover}
                </span>
              </div>
            </div>

            <a
              href={row.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono-telemetry text-[11px] text-[#0284C7] hover:underline self-start"
            >
              <span>{row.sourceLabel}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
