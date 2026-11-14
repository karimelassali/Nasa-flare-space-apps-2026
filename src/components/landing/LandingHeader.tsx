'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '#approach', label: 'Approach' },
  { href: '#cover', label: 'The cover' },
  { href: '#inside', label: 'Inside FLARE' },
  { href: '#method', label: 'Method' },
  { href: '#workspaces', label: 'Workspaces' },
  { href: '#scope', label: 'Research scope' },
] as const;

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 28);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${ratio})`;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-[#071421]/88 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <Link href="/" aria-label="FLARE home" className="flex shrink-0 items-center">
          <Image
            src="/logo-full.png"
            alt="FLARE — Microgravity Fire Safety Intelligence"
            width={440}
            height={141}
            className="h-auto w-[155px] object-contain sm:w-[225px] md:w-[245px]"
          />
        </Link>

        <nav aria-label="Landing navigation" className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="landing-nav-link text-[13px] text-white/65 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/agent"
            className="group inline-flex h-10 items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 text-[12px] font-semibold text-white shadow-sm backdrop-blur transition hover:border-white/35 hover:bg-white/[0.15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7DD3FC]"
          >
            Enter FLARE
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/30 hover:text-white lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        ref={progressRef}
        aria-hidden="true"
        className="landing-progress absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-sky-400/70 via-orange-300/80 to-sky-400/70"
      />

      <div
        id="landing-mobile-menu"
        hidden={!open}
        className="border-t border-white/10 bg-[#071421]/97 px-5 pb-6 pt-4 backdrop-blur-xl lg:hidden"
      >
        <nav aria-label="Landing navigation mobile" className="flex flex-col">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-b border-white/5 py-3.5 text-[14px] text-white/75 transition hover:text-white"
            >
              {link.label}
              <ArrowRight className="h-3.5 w-3.5 text-white/30" />
            </a>
          ))}
        </nav>
        <Link
          href="/agent"
          onClick={() => setOpen(false)}
          className="mt-5 flex h-11 items-center justify-center gap-2 rounded-full bg-[#F97316] text-[13px] font-semibold text-[#111827]"
        >
          Enter FLARE
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
