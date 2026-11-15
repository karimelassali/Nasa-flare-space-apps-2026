'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { useDialogFocus } from '@/lib/use-dialog-focus';
import {
  Rocket,
  Bot,
  Flame,
  Box,
  Grid2x2Check,
  GitCompareArrows,
  Database,
  ShieldAlert,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  group: 'workspace' | 'archive';
  icon: React.ComponentType<{ className?: string }>;
  featured?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/agent", label: "Research Agent", shortLabel: "Agent", group: "workspace", icon: Bot, featured: true },
  {
    href: '/mission',
    label: 'Mission Mode',
    shortLabel: 'Mission',
    group: 'workspace',
    icon: Rocket,
  },
  {
    href: '/ignis',
    label: 'IGNIS Scenario Lab',
    shortLabel: 'IGNIS Lab',
    group: 'workspace',
    icon: Flame,
  },
  {
    href: '/simulation',
    label: '3D Simulation Lab',
    shortLabel: '3D Sim',
    group: 'workspace',
    icon: Box,
  },
  {
    href: '/evidence',
    label: 'Evidence Explorer',
    shortLabel: 'Explorer',
    group: 'archive',
    icon: Grid2x2Check,
  },
  {
    href: '/compare',
    label: 'Experiment Comparison',
    shortLabel: 'Compare',
    group: 'archive',
    icon: GitCompareArrows,
  },
  {
    href: '/knowledge',
    label: 'NASA Knowledge Base',
    shortLabel: 'Knowledge',
    group: 'archive',
    icon: Database,
  },
];

interface AppSidebarProps {
  totalRecords: number;
  totalInvestigations: number;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AppSidebar({
  totalRecords,
  totalInvestigations,
  collapsed,
  mobileOpen,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = usePathname();
  const mobilePanel = useRef<HTMLDivElement>(null);
  useDialogFocus(mobileOpen, mobilePanel, onCloseMobile);

  const workspaceItems = NAV_ITEMS.filter((i) => i.group === 'workspace');
  const archiveItems = NAV_ITEMS.filter((i) => i.group === 'archive');

  const renderGroup = (
    title: string,
    items: NavItem[],
    isCompact: boolean
  ) => (
    <div className="flex flex-col gap-1">
      {!isCompact ? (
        <div className="px-2.5 pt-2 pb-1 text-[11px] font-medium text-[#64748B] tracking-tight">
          {title}
        </div>
      ) : (
        <div className="h-px bg-[#F1F5F9] mx-2 my-1" />
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href === '/mission' && pathname === '/') ||
          pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            data-tour={`nav-${item.href.slice(1)}`}
            onClick={onCloseMobile}
            title={isCompact ? item.label : undefined}
            aria-label={isCompact ? item.label : undefined}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-2.5 rounded-lg text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]',
              isCompact ? 'justify-center h-9 w-9 mx-auto' : 'px-2.5 h-9',
              item.featured
                ? 'bg-[#FFF7ED] text-[#0F172A] font-semibold border border-[#FDBA74] shadow-[0_0_0_1px_rgba(249,115,22,0.15)]'
                : isActive
                  ? 'bg-[#F1F5F9] text-[#0F172A] font-medium border border-[#E2E8F0]'
                  : 'text-[#334155] hover:bg-[#FFFFFF] hover:text-[#0F172A] border border-transparent'
            )}
          >
            {!isCompact && isActive ? (
              <span
                aria-hidden="true"
                className="w-0.5 h-4 rounded-full bg-[#D97706] -ml-1 mr-0.5 shrink-0"
              />
            ) : null}
            <Icon
              className={cn(
                'w-4 h-4 shrink-0 transition-colors',
                item.featured
                  ? 'text-[#EA580C]'
                  : isActive
                    ? 'text-[#D97706]'
                    : 'text-[#64748B] group-hover:text-[#0284C7]'
              )}
            />
            {!isCompact ? (
              <span className="flex-1 truncate">{item.label}</span>
            ) : null}
            {!isCompact && item.featured ? (
              <span className="shrink-0 rounded-full bg-[#EA580C] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white">
                SI
              </span>
            ) : null}
            {isCompact && item.featured ? (
              <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#EA580C] ring-2 ring-white" />
            ) : null}
          </Link>
        );
      })}
    </div>
  );

  const buildSidebarContent = (isCompact: boolean) => (
    <div className="flex flex-col h-full justify-between bg-[#FFFFFF] border-r border-[#E2E8F0]">
      <div>
        {/* Brand Header (64px matching AppHeader) */}
        <div
          className={cn(
            'h-16 flex items-center border-b border-[#E2E8F0]',
            isCompact ? 'justify-center px-2' : 'justify-between px-4'
          )}
        >
          <Link
            href="/mission"
            onClick={onCloseMobile}
            title="FLARE — Microgravity Fire Safety Intelligence"
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] rounded-lg"
          >
            {isCompact ? (
              <div className="w-9 h-9 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] p-1 flex items-center justify-center shrink-0 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="FLARE Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-full-light.png"
                  alt="FLARE — Microgravity Fire Safety Intelligence"
                  className="h-9 w-auto object-contain"
                />
              </>
            )}
          </Link>

          {!isCompact ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="lg:hidden p-1.5 rounded-lg text-[#334155] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className={cn('p-3 flex flex-col gap-3', isCompact && 'px-2')}
        >
          {renderGroup('Research Workspace', workspaceItems, isCompact)}
          {renderGroup('Archive & Analytics', archiveItems, isCompact)}
        </nav>
      </div>

      {/* Bottom Corpus & Pre-Mission Scope */}
      <div className="p-3 border-t border-[#E2E8F0] flex flex-col gap-2.5">
        {isCompact ? (
          <div
            title={`${totalRecords} NASA-linked records across ${totalInvestigations} NASA investigations. Pre-mission research only.`}
            className="mx-auto w-9 h-9 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] flex items-center justify-center text-[#059669]"
          >
            <Database className="w-4 h-4" />
          </div>
        ) : (
          <>
            <div className="rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#334155]">
                  PSI / NTRS Corpus
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono-telemetry text-[10px] text-[#059669]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                  Source-linked
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-[#F8FAFC] px-2.5 py-1.5 border border-[#F1F5F9]">
                  <div className="font-mono-telemetry text-sm font-semibold text-[#0F172A]">
                    {totalRecords}
                  </div>
                  <div className="text-[10px] text-[#64748B]">Records</div>
                </div>
                <div className="rounded-md bg-[#F8FAFC] px-2.5 py-1.5 border border-[#F1F5F9]">
                  <div className="font-mono-telemetry text-sm font-semibold text-[#0284C7]">
                    {totalInvestigations}
                  </div>
                  <div className="text-[10px] text-[#64748B]">Programs</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] px-3 py-2.5 flex items-start gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#64748B] leading-snug">
                Pre-mission research intelligence only. Not certified for onboard flight safety decisions.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar (248px / 64px) */}
      <aside
        className={cn(
          'hidden lg:block fixed inset-y-0 left-0 z-40 transition-[width] duration-200',
          collapsed ? 'w-[64px]' : 'w-[248px]'
        )}
      >
        {buildSidebarContent(collapsed)}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen ? (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div ref={mobilePanel} role="dialog" aria-modal="true" aria-label="Navigation menu" tabIndex={-1} className="relative w-[280px] max-w-[85vw] h-full overflow-y-auto z-10">
            {buildSidebarContent(false)}
          </div>
        </div>
      ) : null}

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E2E8F0] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-7 h-16 px-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === '/mission' && pathname === '/') ||
              pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-tour={`mobile-nav-${item.href.slice(1)}`}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'min-w-0 flex flex-col items-center justify-center gap-1 px-0.5 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]',
                  isActive ? 'text-[#D97706]' : 'text-[#334155]'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="font-mono-telemetry text-[9px] sm:text-[10px] leading-none truncate max-w-full">
                  {item.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
