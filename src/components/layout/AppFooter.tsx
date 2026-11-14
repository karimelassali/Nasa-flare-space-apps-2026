export function AppFooter() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-[#FFFFFF] px-4 sm:px-6 lg:px-8 py-5 mt-10">
      <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-[#64748B]">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-[#334155]">
            FLARE — Microgravity Fire Safety Intelligence · Pre-Mission Research Platform
          </span>
          <span>
            2026 NASA International Space Apps Challenge (&ldquo;Flame in Freefall&rdquo;). Independent academic/engineering interface; never use for onboard detection or flight certification.
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono-telemetry text-[11px] text-[#64748B] shrink-0">
          <a
            href="https://psi.nasa.gov/physci/repo"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#0284C7] transition-colors"
          >
            psi.nasa.gov
          </a>
          <span>·</span>
          <a
            href="https://ntrs.nasa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#0284C7] transition-colors"
          >
            ntrs.nasa.gov
          </a>
        </div>
      </div>
    </footer>
  );
}
