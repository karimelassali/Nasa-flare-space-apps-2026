'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Database, GitCompareArrows, Menu, PanelLeft, CircleHelp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { NAV_ITEMS } from './AppSidebar';

interface AppHeaderProps {
  totalRecords: number;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileMenu: () => void;
  onStartGuide: () => void;
}

export function AppHeader({
  totalRecords,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobileMenu,
  onStartGuide,
}: AppHeaderProps) {
  const pathname = usePathname();
  const currentNav =
    NAV_ITEMS.find(
      (item) =>
        pathname === item.href ||
        (item.href === '/mission' && pathname === '/') ||
        pathname.startsWith(`${item.href}/`)
    ) ?? NAV_ITEMS[0];

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#F8FAFC]/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
        >
          <Menu className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:inline-flex p-1.5 rounded-lg text-[#334155] hover:text-[#0F172A] hover:bg-[#F1F5F9] border border-transparent hover:border-[#E2E8F0] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <Separator orientation="vertical" className="hidden sm:block" />

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
          <Link
            href="/mission"
            title="FLARE — Microgravity Fire Safety Intelligence"
            className="hidden sm:inline-flex items-center rounded-md px-1 py-0.5 hover:bg-[#F1F5F9] transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-full-light.png"
              alt="FLARE"
              className="h-6 w-auto object-contain"
            />
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#64748B] hidden sm:inline shrink-0" />
          <span className="font-display text-sm font-semibold text-[#0F172A] truncate">
            {currentNav.label}
          </span>
        </nav>
      </div>

      {/* Right Status & Quick Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#FFFFFF] border border-[#E2E8F0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
          <span className="font-mono-telemetry text-[11px] text-[#334155]">
            {totalRecords} source-linked NASA records
          </span>
        </div>

        <Link
          href="/compare"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-[#FFFFFF] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-medium text-[#334155] hover:text-[#0F172A] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
        >
          <GitCompareArrows className="w-3.5 h-3.5 text-[#0284C7]" />
          <span>Compare</span>
        </Link>

        <button
          type="button"
          onClick={onStartGuide}
          data-tour="guide-button"
          aria-label="Start the full app guide"
          className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-medium text-[#334155] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
        >
          <CircleHelp className="w-3.5 h-3.5 text-[#D97706]" />
          <span>Guide</span>
        </button>

        <Link
          href="/knowledge"
          aria-label="Open NASA Knowledge Base"
          className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-xs font-medium text-[#0F172A] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
        >
          <Database className="w-3.5 h-3.5 text-[#D97706]" />
          <span className="hidden sm:inline">Archive</span>
        </Link>
      </div>
    </header>
  );
}
