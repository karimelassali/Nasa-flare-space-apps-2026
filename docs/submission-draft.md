# FLARE — Space Apps submission draft (CH3 PyroShield Zero-G)

Fill this into the team page (Profile > My Team > Project tab) and click
"Submit for Judging" before 23:59 Sun 15 Nov 2026 local time.
Do NOT submit until PR #1 is merged and Vercel has redeployed from main.

## Project name
FLARE — SI-Powered Fire Safety Intelligence

## Summary
FLARE is an SI-powered web dashboard that summarizes, ranks, and interprets
NASA microgravity combustion experiments by flammability, data availability,
and experimental relevance. It holds 27 source-linked records across 21 NASA
investigations (BASS, Saffire, SoFIE, FLEX, ACME, SAME — now with verified observation records for SAME and ACME), in 7 workspaces:
Research Agent, Mission Mode, IGNIS Scenario Lab, 3D Simulation Lab, Evidence
Explorer, Experiment Comparison, and NASA Knowledge Base. Every answer names
the investigation, the measurement, and the NASA source behind it — and shows
where the evidence stops.

## Demo link (7-slide deck)
https://flare-space-apps.vercel.app/demo-deck.html
(Also hosted in the repo at public/demo-deck.html.)

## Final project link
Live app: https://flare-space-apps.vercel.app
Code: https://github.com/karimelassali/Nasa-flare-space-apps-2026

## Project details (how it works, tools used)
- Next.js 16, React 19, TypeScript, Tailwind CSS 4, Three.js, Recharts, Vitest.
- Research Agent: natural-language query. The AI model only selects existing
  record IDs and measurement keys via a strict JSON schema; scientific text is
  rendered deterministically from stored source fields, so the model cannot
  invent a number. Unknown citations are rejected. With no AI key configured,
  FLARE falls back to deterministic retrieval and says so on screen.
- Mission Mode ranks experiments deterministically by relevance, data
  availability, and flammability, and exports source-linked Markdown/JSON briefs.
- Experiment Comparison charts values only when both records report the same
  quantity in the same unit; unreported uncertainty is labelled "Not reported",
  never plotted as zero.
- Evidence Explorer shows tested-pair coverage and range-spanning records
  honestly; SAFFIRE-V atmosphere discrepancies are shown separately, not merged.
- 3D Simulation Lab is a conceptual illustration of chamber geometry — not CFD,
  not a measured flame shape.
- Roles: Karim El Assali — application development and engineering; Hamza
  Sailah — NASA experiment research and data curation; Mohamed Zaroual —
  software testing and product improvement suggestions.

## AI / SI disclosure
FLARE uses AI (NVIDIA NIM, Google Gemini, or OpenAI, server-side keys only)
for evidence selection in the Research Agent and Mission Mode analysis. The
model selects records and measurements only; all scientific statements are
rendered from stored, source-linked fields. No free-form AI-generated numbers.
Deterministic fallback applies when no provider key is configured. See
docs/ai-disclosure.md in the repo.

## Space Agency Data References (at least 1 NASA resource — FLARE has many)
- PSI Data Repository — https://psi.nasa.gov/ (primary source; BASS, Saffire,
  SoFIE, FLEX, ACME, SAME investigations)
- NASA Technical Reports Server (NTRS) — SAFFIRE Table 1, NTRS 20180005168
  (flame-spread 1.8 vs 2.3 mm/s; burn durations 420 vs 300 s)
- NASA/TP-2015-216046, Table IX, NTRS 20150023456 — FLEX-008, 14.8 s droplet
  burn ending in disruption, not extinction
- BASS-II rod study — 0.0385 mm/s rod-tip regression velocity; 13.5% oxygen
  minimum on a multi-test flammability boundary
- Full per-record sources: see docs/data-provenance.md and the in-app
  "NASA Source" links on every record.
