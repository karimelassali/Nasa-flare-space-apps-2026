import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AppShell } from '@/components/layout/AppShell';
import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FLARE — Microgravity Fire Safety Intelligence',
  description:
    'Pre-mission research intelligence system for exploring, comparing, and analyzing source-linked NASA microgravity combustion datasets (BASS-II, FLEX, SAFFIRE, ACME, SoFIE).',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased bg-[#F8FAFC] text-[#0F172A] min-h-screen selection:bg-[#D97706]/20 selection:text-[#D97706]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
