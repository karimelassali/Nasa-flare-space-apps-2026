'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Box,
  Camera,
  Eye,
  Flame,
  Info,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Wind,
} from 'lucide-react';
import { ExperimentDetailsDrawer } from '@/components/knowledge/ExperimentDetailsDrawer';
import {
  type CameraPreset,
  type ChamberVisibility,
  type FacilityChamberType,
  type FuelGeometryType,

} from '@/components/simulation/ThreeCombustionScene';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getAllEvidenceRecords } from '@/lib/evidence/repository';
import { cn, formatCompactParam } from '@/lib/utils';
import type { EvidenceRecord, GravityContext } from '@/types/flare';

const ThreeCombustionScene = dynamic(() => import('@/components/simulation/ThreeCombustionScene').then(m => m.ThreeCombustionScene), { ssr: false });

const FACILITY_OPTIONS: Array<{
  id: FacilityChamberType;
  label: string;
  subtitle: string;
}> = [
  {
    id: 'msg_duct',
    label: 'Generic sample tunnel',
    subtitle: 'BASS / BASS-II ducted sample channel',
  },
  {
    id: 'cir_rack',
    label: 'Generic optical chamber',
    subtitle: 'FLEX / ACME spherical chamber vessel',
  },
  {
    id: 'saffire_duct',
    label: 'Generic enclosed fire volume',
    subtitle: 'Large-scale uncrewed cargo fire tunnel',
  },
  {
    id: 'exploration_bay',
    label: 'Exploration Bay',
    subtitle: 'Elevated-O₂ / reduced-kPa vessel analog',
  },
];

const FUEL_OPTIONS: Array<{
  id: FuelGeometryType;
  label: string;
  materialNote: string;
}> = [
  {
    id: 'fabric_strip',
    label: 'SIBAL / Cotton Strip',
    materialNote: 'Thin thermally-thin sheet sample',
  },
  {
    id: 'polymer_slab',
    label: 'Cast PMMA Slab',
    materialNote: 'Thermally-thick solid polymer plate',
  },
  {
    id: 'liquid_droplet',
    label: 'Liquid Droplet',
    materialNote: 'Suspended n-heptane / methanol sphere',
  },
  {
    id: 'gaseous_burner',
    label: 'Gaseous Burner',
    materialNote: 'Porous non-premixed diffusion nozzle',
  },
];

const CAMERA_PRESETS: Array<{ id: CameraPreset; label: string }> = [
  { id: 'front', label: 'Front' },
  { id: 'close', label: 'Flame close-up' },
  { id: 'isometric', label: 'Isometric' },
  { id: 'side', label: 'Side Profile' },
  { id: 'upstream', label: 'Axial Upstream' },
  { id: 'top', label: 'Top-Down' },
];

const GRAVITY_MODES: GravityContext[] = [
  'Microgravity',
  'Lunar',
  'Martian',
  'Earth',
];

function inferFacilityFromRecord(record: EvidenceRecord): FacilityChamberType {
  if (record.platform === 'Cygnus') return 'saffire_duct';
  if (
    record.oxygenPercent !== null &&
    record.oxygenPercent >= 30 &&
    record.pressureKpa !== null &&
    record.pressureKpa < 75
  ) {
    return 'exploration_bay';
  }
  if (
    record.investigationName.includes('FLEX') ||
    record.investigationName.includes('ACME')
  ) {
    return 'cir_rack';
  }
  return 'msg_duct';
}

function inferFuelFromRecord(record: EvidenceRecord): FuelGeometryType {
  switch (record.fuelType) {
    case 'Liquid Droplet':
      return 'liquid_droplet';
    case 'Thick Solid Polymer':
      return 'polymer_slab';
    case 'Gaseous Surrogate':
      return 'gaseous_burner';
    default:
      return 'fabric_strip';
  }
}

export default function SimulationLabPage() {
  const allRecords = useMemo(() => getAllEvidenceRecords(), []);

  // Curate verified experimental observations (plus SAFFIRE-II / V) for 1-click loading
  const nasaPresets = useMemo(() => {
    const preferredIds = [
      'EV-PSI69-01',
      'EV-PSI25-01',
      'EV-ACME-BRE-01',
      'EV-PSI98-01',
      'EV-SAFFIRE-V-01',
      'EV-SAFFIRE-VI-01',
      'EV-SLICE-01',
    ];
    const picked = preferredIds
      .map((id) => allRecords.find((r) => r.id === id))
      .filter((r): r is EvidenceRecord => Boolean(r));
    if (picked.length >= 4) return picked;
    return allRecords.slice(0, 6);
  }, [allRecords]);

  // Active 3D simulation state
  const [facility, setFacility] = useState<FacilityChamberType>('cir_rack');
  const [fuelGeometry, setFuelGeometry] =
    useState<FuelGeometryType>('liquid_droplet');
  const [oxygenPercent, setOxygenPercent] = useState<number>(21.0);
  const [pressureKpa, setPressureKpa] = useState<number>(101.3);
  const [airflowCms, setAirflowCms] = useState<number>(0.0);
  const [gravityContext, setGravityContext] =
    useState<GravityContext>('Microgravity');

  const [visibility, setVisibility] = useState<ChamberVisibility>({
    flowParticles: true,
    sensors: true,
    enclosure: true,
    grid: true,
  });

  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simElapsedSec, setSimElapsedSec] = useState<number>(0);
  const [simResetNonce, setSimResetNonce] = useState<number>(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [cameraResetNonce, setCameraResetNonce] = useState<number>(0);

  const [loadedPresetRecord, setLoadedPresetRecord] =
    useState<EvidenceRecord | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<EvidenceRecord | null>(null);
  const [presetFallbackNote, setPresetFallbackNote] = useState<string | null>(
    null
  );

  // Elapsed burn clock while simulation is running
  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => {
      setSimElapsedSec((prev) => +(prev + 0.1).toFixed(1));
    }, 100);
    return () => window.clearInterval(interval);
  }, [isRunning]);

  const handleResetSimulation = () => {
    setSimElapsedSec(0);
    setSimResetNonce((n) => n + 1);
  };

  const handleLoadNasaPreset = (record: EvidenceRecord) => {
    const inferredFacility = inferFacilityFromRecord(record);
    const inferredFuel = inferFuelFromRecord(record);

    const o2 = record.oxygenPercent ?? oxygenPercent;
    const kpa = record.pressureKpa ?? pressureKpa;
    const flow = record.airflowCms ?? airflowCms;

    const missingFields: string[] = [];
    if (record.oxygenPercent === null) {
      missingFields.push(`O₂ not reported; illustrative ${oxygenPercent}% retained`);
    }
    if (record.pressureKpa === null) {
      missingFields.push(`Pressure not reported; illustrative ${pressureKpa} kPa retained`);
    }
    if (record.airflowCms === null) {
      missingFields.push(`Airflow not reported; illustrative ${airflowCms} cm/s retained`);
    }

    setFacility(inferredFacility);
    setFuelGeometry(inferredFuel);
    setOxygenPercent(Number(o2.toFixed(1)));
    setPressureKpa(Number(kpa.toFixed(1)));
    setAirflowCms(Number(flow.toFixed(1)));
    setGravityContext(record.gravityContext);
    setLoadedPresetRecord(record);
    setSimElapsedSec(0);
    setSimResetNonce((n) => n + 1);
    setIsRunning(true);

    setPresetFallbackNote(
      missingFields.length > 0
        ? `${record.id} has "Not reported" scalar fields (${missingFields.join('; ')}) for 3D rendering continuity.`
        : null
    );
  };

  // Qualitative conceptual descriptors derived strictly from boundary values
  const flowRegimeLabel =
    gravityContext !== 'Microgravity'
      ? `Buoyant + Forced (${gravityContext})`
      : airflowCms < 1.5
      ? 'Quiescent Diffusion'
      : airflowCms <= 15
      ? 'Low-Speed Forced Duct'
      : 'Elevated Convective Flow';

  const plumeShapeLabel =
    fuelGeometry !== 'liquid_droplet'
      ? 'Localized sample flame concept'
      : gravityContext !== 'Microgravity'
      ? 'Buoyancy-Tilted Plume'
      : airflowCms < 2.0
      ? 'Symmetrical Spherical Flame'
      : 'Streamwise Convective Wake';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">{[
        ['Droplet combustion · FLEX inspired','cir_rack','liquid_droplet'],
        ['Solid flame spread · BASS inspired','msg_duct','fabric_strip'],
        ['Enclosed fire · SAFFIRE inspired','saffire_duct','polymer_slab']
      ].map(([label,f,g]) => <Button key={f} variant={facility===f ? 'default':'outline'} onClick={()=>{setFacility(f as FacilityChamberType);setFuelGeometry(g as FuelGeometryType);setLoadedPresetRecord(null);handleResetSimulation();}}>{label}</Button>)}</div>
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="cyan">Three.js WebGL Lab</Badge>
            <Badge variant="warning">Conceptual View</Badge>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]">
            Microgravity Combustion 3D Simulation
          </h1>
          <p className="text-sm text-[#334155] leading-relaxed">
            Explore chamber geometry, fuel mounting hardware, streamline particles, and
            qualitative flame-shape response across NASA ISS, Cygnus, and exploration
            boundary conditions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <Button
            variant={isRunning ? 'secondary' : 'default'}
            size="sm"
            onClick={() => setIsRunning((r) => !r)}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Pause Animation</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Play Animation</span>
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetSimulation}>
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Animation</span>
          </Button>
        </div>
      </div>

      {/* Tremor KPI Summary Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3.5">
              <div className="flex items-center justify-between text-[11px] font-mono-telemetry uppercase tracking-wider text-[#64748B]">
                <span>Flow Regime</span>
                <Wind className="w-3.5 h-3.5 text-[#0284C7]" />
              </div>
              <div className="mt-2 font-display text-sm font-semibold text-[#0F172A] truncate">
                {flowRegimeLabel}
              </div>
              <div className="mt-0.5 font-mono-telemetry text-[11px] text-[#64748B] tabular-nums">
                u = {airflowCms.toFixed(1)} cm/s
              </div>
            </div>

            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3.5">
              <div className="flex items-center justify-between text-[11px] font-mono-telemetry uppercase tracking-wider text-[#64748B]">
                <span>Visual Plume Mode</span>
                <Flame className="w-3.5 h-3.5 text-[#D97706]" />
              </div>
              <div className="mt-2 font-display text-sm font-semibold text-[#D97706] truncate">
                {plumeShapeLabel}
              </div>
              <div className="mt-0.5 font-mono-telemetry text-[11px] text-[#64748B] tabular-nums">
                {oxygenPercent.toFixed(1)}% O₂ · {pressureKpa.toFixed(1)} kPa
              </div>
            </div>

            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3.5">
              <div className="flex items-center justify-between text-[11px] font-mono-telemetry uppercase tracking-wider text-[#64748B]">
                <span>Illustrative Animation</span>
                <Box className="w-3.5 h-3.5 text-[#059669]" />
              </div>
              <div className="mt-2 font-mono-telemetry text-xl font-semibold text-[#0F172A] tabular-nums">
                {simElapsedSec.toFixed(1)} s
              </div>
              <div className="mt-0.5 text-[11px] text-[#64748B]">
                {isRunning ? 'Live WebGL animation loop' : 'Paused frame hold'}
              </div>
            </div>

            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3.5">
              <div className="flex items-center justify-between text-[11px] font-mono-telemetry uppercase tracking-wider text-[#64748B]">
                <span>NASA Reference</span>
                <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" />
              </div>
              <div className="mt-2 font-mono-telemetry text-sm font-semibold text-[#0284C7] truncate">
                {loadedPresetRecord ? loadedPresetRecord.id : 'Custom Boundary'}
              </div>
              <div className="mt-0.5 text-[11px] text-[#64748B] truncate">
                {loadedPresetRecord
                  ? loadedPresetRecord.investigationName
                  : 'User-configured test envelope'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {presetFallbackNote && (
        <div className="rounded-xl bg-[#D97706]/8 border border-[#D97706]/30 px-4 py-3 flex items-start gap-2.5 text-xs text-[#334155]">
          <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
          <span>{presetFallbackNote}</span>
        </div>
      )}

      {/* Main 12-Column Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Control Deck */}
        <Card data-tour="simulation-controls" className="lg:col-span-4 flex flex-col">
          <CardHeader className="py-4">
            <CardTitle>3D Chamber & Boundary Deck</CardTitle>
            <CardDescription>
              Configure facility geometry, fuel mounting, atmospheric envelope, and
              visible sensor layers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 flex-1">
            {/* Spacecraft / Facility Geometry */}
            <div className="space-y-2">
              <label className="font-mono-telemetry text-[11px] uppercase tracking-wider text-[#64748B] block">
                Spacecraft Test Facility
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
                {FACILITY_OPTIONS.map((opt) => {
                  const active = facility === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setFacility(opt.id);
                        setLoadedPresetRecord(null);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg border transition-colors cursor-pointer',
                        active
                          ? 'bg-[#F1F5F9] border-[#0284C7]/60 text-[#0F172A]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1]'
                      )}
                    >
                      <div className="text-xs font-medium">{opt.label}</div>
                      <div className="text-[11px] text-[#64748B]">
                        {opt.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fuel Geometry */}
            <div className="space-y-2">
              <label className="font-mono-telemetry text-[11px] uppercase tracking-wider text-[#64748B] block">
                Fuel Sample Geometry
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {FUEL_OPTIONS.map((fuel) => {
                  const active = fuelGeometry === fuel.id;
                  return (
                    <button
                      key={fuel.id}
                      type="button"
                      onClick={() => {
                        setFuelGeometry(fuel.id);
                        setLoadedPresetRecord(null);
                      }}
                      className={cn(
                        'text-left px-2.5 py-2 rounded-lg border transition-colors cursor-pointer',
                        active
                          ? 'bg-[#F1F5F9] border-[#D97706]/65 text-[#0F172A]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1]'
                      )}
                    >
                      <div className="text-xs font-medium truncate">
                        {fuel.label}
                      </div>
                      <div className="text-[10px] text-[#64748B] line-clamp-1">
                        {fuel.materialNote}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Boundary Condition Sliders */}
            <div className="space-y-3.5 pt-2 border-t border-[#F1F5F9]">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#334155]">Oxygen Mole Fraction</span>
                  <span className="font-mono-telemetry text-[#D97706] tabular-nums">
                    {oxygenPercent.toFixed(1)}% O₂
                  </span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={35}
                  step={0.1}
                  value={oxygenPercent}
                  onChange={(e) => {
                    setOxygenPercent(Number(e.target.value));
                    setLoadedPresetRecord(null);
                  }}
                  aria-label="Simulation oxygen percentage"
                  className="flare-slider w-full"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#334155]">Ambient Pressure</span>
                  <span className="font-mono-telemetry text-[#0284C7] tabular-nums">
                    {pressureKpa.toFixed(1)} kPa
                  </span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={110}
                  step={0.1}
                  value={pressureKpa}
                  onChange={(e) => {
                    setPressureKpa(Number(e.target.value));
                    setLoadedPresetRecord(null);
                  }}
                  aria-label="Simulation ambient pressure"
                  className="flare-slider w-full"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#334155]">Forced Duct Airflow</span>
                  <span className="font-mono-telemetry text-[#059669] tabular-nums">
                    {airflowCms.toFixed(1)} cm/s
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={0.1}
                  value={airflowCms}
                  onChange={(e) => {
                    setAirflowCms(Number(e.target.value));
                    setLoadedPresetRecord(null);
                  }}
                  aria-label="Simulation forced duct airflow"
                  className="flare-slider w-full"
                />
              </div>
            </div>

            {/* Gravity Vector Selector */}
            <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
              <div className="flex items-center justify-between gap-2">
                <label className="font-mono-telemetry text-[11px] uppercase tracking-wider text-[#64748B]">
                  Gravitational Acceleration Vector
                </label>
                <button
                  type="button"
                  data-tour="simulation-gravity-flip"
                  onClick={() => {
                    setGravityContext((prev) =>
                      prev === 'Microgravity' ? 'Earth' : 'Microgravity'
                    );
                    setLoadedPresetRecord(null);
                    setPresetFallbackNote(null);
                  }}
                  className="font-mono-telemetry text-[10px] px-2 py-0.5 rounded border border-[#0284C7]/40 bg-[#F0F9FF] text-[#0284C7] hover:bg-[#E0F2FE] transition-colors cursor-pointer"
                >
                  Flip 0g ↔ 1g
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-1.5">
                {GRAVITY_MODES.map((mode) => {
                  const active = gravityContext === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setGravityContext(mode);
                        setLoadedPresetRecord(null);
                      }}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg font-mono-telemetry text-[11px] border transition-colors cursor-pointer',
                        active
                          ? 'bg-[#F1F5F9] border-[#0284C7] text-[#0F172A]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#334155]'
                      )}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3D Visibility Layer Toggles */}
            <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
              <div className="flex items-center gap-1.5 font-mono-telemetry text-[11px] uppercase tracking-wider text-[#64748B]">
                <Eye className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>3D Chamber Layers</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(
                  [
                    ['flowParticles', 'Flow Particles'],
                    ['sensors', 'Sensor Stalks'],
                    ['enclosure', 'Chamber Shell'],
                    ['grid', 'Axis & Grid'],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer hover:border-[#CBD5E1]"
                  >
                    <input
                      type="checkbox"
                      checked={visibility[key]}
                      onChange={(e) =>
                        setVisibility((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                      className="accent-[#0284C7] rounded"
                    />
                    <span className="text-[11px] text-[#334155]">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Three.js Viewport */}
        <Card data-tour="simulation-scene" className="lg:col-span-8 flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 bg-[#FFFFFF] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#0284C7]" />
              <span className="font-display text-sm font-medium text-[#0F172A]">
                Interactive WebGL Chamber Viewport
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {CAMERA_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setCameraPreset(preset.id);
                    setCameraResetNonce((n) => n + 1);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-md font-mono-telemetry text-[11px] border transition-colors cursor-pointer',
                    cameraPreset === preset.id
                      ? 'bg-[#F1F5F9] border-[#0284C7]/60 text-[#0F172A]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#334155]'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <CardContent className="p-4 flex-1 flex flex-col gap-3">
            <div className="flex-1 min-h-[460px] lg:min-h-[540px]">
              <ThreeCombustionScene
                facility={facility}
                fuelGeometry={fuelGeometry}
                oxygenPercent={oxygenPercent}
                pressureKpa={pressureKpa}
                airflowCms={airflowCms}
                gravityContext={gravityContext}
                isRunning={isRunning}
                simResetNonce={simResetNonce}
                cameraPreset={cameraPreset}
                cameraResetNonce={cameraResetNonce}
                visibility={visibility}
              />
            </div>

            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 flex items-start gap-2.5 text-[11px] text-[#334155] leading-relaxed">
              <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#0F172A]">Conceptual visualization:</strong>{' '}
                The flame and airflow are illustrative; no temperature, heat flux, flame spread rate, or velocity field is calculated. Oxygen and pressure are scenario inputs, not measured outcomes. Consult the referenced NASA records for experimental results.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom NASA Empirical Experiment Loader */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>NASA experimental evidence and condition presets</CardTitle>
              <CardDescription>
                Populate boundary conditions directly from documented ISS and Cygnus experiments
                or inspect raw PSI / NTRS measurements.
              </CardDescription>
            </div>
            <Badge variant="emerald">Zero Fabricated Flight Data</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {nasaPresets.map((record) => {
              const isSelected = loadedPresetRecord?.id === record.id;
              return (
                <div
                  key={record.id}
                  className={cn(
                    'rounded-xl bg-[#F8FAFC] border p-4 flex flex-col justify-between gap-3.5 transition-colors',
                    isSelected
                      ? 'border-[#0284C7] bg-[#F0F9FF]'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono-telemetry text-[11px] text-[#0284C7]">
                        {record.investigationName} · {record.investigationId}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {record.platform}
                      </Badge>
                    </div>
                    <h3 className="font-display text-sm font-semibold text-[#0F172A] leading-snug line-clamp-2">
                      {record.experimentTitle}
                    </h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono-telemetry text-[11px] text-[#64748B] tabular-nums">
                      <span>
                        O₂:{' '}
                        <span className="text-[#0F172A]">
                          {formatCompactParam(
                            record.oxygenPercent,
                            '%',
                            record.oxygenRangePct
                          )}
                        </span>
                      </span>
                      <span>
                        P:{' '}
                        <span className="text-[#0F172A]">
                          {formatCompactParam(
                            record.pressureKpa,
                            'kPa',
                            record.pressureRangeKpa
                          )}
                        </span>
                      </span>
                      <span>
                        Flow:{' '}
                        <span className="text-[#0F172A]">
                          {formatCompactParam(
                            record.airflowCms,
                            'cm/s',
                            record.airflowRangeCms
                          )}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#F1F5F9]">
                    <Button
                      variant={isSelected ? 'default' : 'secondary'}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleLoadNasaPreset(record)}
                    >
                      <Play className="w-3 h-3" />
                      <span>
                        {isSelected ? 'Loaded in Viewport' : 'Load into 3D'}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDrawerRecord(record)}
                    >
                      <span>Provenance</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ExperimentDetailsDrawer
        record={drawerRecord}
        onClose={() => setDrawerRecord(null)}
      />
    </div>
  );
}
