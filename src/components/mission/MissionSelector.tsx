'use client';

import {
  Check,
  Compass,
  Orbit,
  PlaneTakeoff,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MissionPreset, MissionPresetId } from '@/types/flare';

interface MissionSelectorProps {
  presets: MissionPreset[];
  selectedId: MissionPresetId;
  onSelect: (preset: MissionPreset) => void;
}

const ICON_MAP: Record<
  MissionPresetId,
  React.ComponentType<{ className?: string }>
> = {
  iss: Orbit,
  cygnus: PlaneTakeoff,
  exploration: Compass,
  custom: SlidersHorizontal,
};

export function MissionSelector({
  presets,
  selectedId,
  onSelect,
}: MissionSelectorProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono-telemetry text-[11px] font-medium px-1.5 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0] text-[#D97706]">
            STAGE 01
          </span>
          <h2 className="font-display text-sm font-semibold text-[#0F172A]">
            Select Spacecraft or Environmental Scenario
          </h2>
        </div>
        <span className="hidden sm:inline text-xs text-[#64748B]">
          Applies documented reference baselines
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {presets.map((preset) => {
          const Icon = ICON_MAP[preset.id];
          const isSelected = preset.id === selectedId;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              aria-pressed={isSelected}
              className={cn(
                'group relative text-left rounded-xl p-4 border transition-colors flex flex-col justify-between gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]',
                isSelected
                  ? 'bg-[#F1F5F9]/80 border-[#D97706]/80'
                  : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F1F5F9]/40'
              )}
            >
              <div className="flex flex-col gap-2.5 w-full">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 transition-colors',
                        isSelected
                          ? 'bg-[#D97706]/15 border-[#D97706]/40 text-[#D97706]'
                          : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#334155] group-hover:text-[#0F172A]'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-sm font-semibold text-[#0F172A] leading-snug">
                        {preset.title}
                      </h3>
                      <span className="text-[11px] text-[#64748B] block truncate">
                        {preset.subtitle}
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-colors mt-0.5',
                      isSelected
                        ? 'bg-[#D97706] border-[#D97706] text-[#F8FAFC]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-transparent'
                    )}
                  >
                    <Check className="w-3 h-3" />
                  </span>
                </div>

                <p className="text-xs text-[#334155] leading-relaxed">
                  {preset.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-[#F1F5F9] w-full font-mono-telemetry text-[11px]">
                <div className="rounded bg-[#F8FAFC] border border-[#F1F5F9] px-2 py-1 text-center">
                  <span className="text-[#0284C7]">
                    {preset.defaults.oxygenPercent.toFixed(1)}%
                  </span>{' '}
                  <span className="text-[#64748B]">O₂</span>
                </div>
                <div className="rounded bg-[#F8FAFC] border border-[#F1F5F9] px-2 py-1 text-center">
                  <span className="text-[#0F172A]">
                    {preset.defaults.pressureKpa.toFixed(1)}
                  </span>{' '}
                  <span className="text-[#64748B]">kPa</span>
                </div>
                <div className="rounded bg-[#F8FAFC] border border-[#F1F5F9] px-2 py-1 text-center">
                  <span className="text-[#0F172A]">
                    {preset.defaults.airflowCms.toFixed(0)}
                  </span>{' '}
                  <span className="text-[#64748B]">cm/s</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
