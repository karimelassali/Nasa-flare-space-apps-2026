'use client';

import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { getCorpusStatistics } from '@/lib/evidence/repository';
import { cn } from '@/lib/utils';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { AppGuide } from './AppGuide';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [guideRequested, setGuideRequested] = useState(false);
  const stats = getCorpusStatistics();

  if (pathname === '/') return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:shadow-lg">Skip to content</a>
      <AppSidebar
        totalRecords={stats.totalRecords}
        totalInvestigations={stats.uniqueInvestigationCount}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 min-h-screen transition-[padding] duration-200',
          sidebarCollapsed ? 'lg:pl-[64px]' : 'lg:pl-[248px]'
        )}
      >
        <AppHeader
          totalRecords={stats.totalRecords}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onStartGuide={() => setGuideRequested(true)}
        />
        <AppGuide requested={guideRequested} onRequestHandled={() => setGuideRequested(false)} />
        <main id="main-content" tabIndex={-1} className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10 max-w-[1500px] w-full mx-auto">
          {children}
        </main>
        <div className="pb-16 lg:pb-0">
          <AppFooter />
        </div>
      </div>
    </div>
  );
}
