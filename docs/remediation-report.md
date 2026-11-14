# FLARE remediation report — 2026-11-14

Verdict: substantially improved research prototype; not 100% submission-certified. Local production preview: http://localhost:3115/agent. No public deployment was inspected or published.

| Issue | Status | Result |
|---|---|---|
| Incorrect physical quantity comparisons | Fixed | Regression, concurrent/opposed spread, study boundaries and protocol durations separated. |
| Missing uncertainty rendered as zero | Fixed | Unknown uncertainty remains missing; chart omits error bars. |
| Unsupported atmosphere assumptions | Fixed | Removed added-overview cabin setpoints; source ranges explicitly distinguished from test points. |
| SAFFIRE nominal oxygen values | Fixed | Oxygen variation retained; II-5/II-6 tabulated approximate 22.1% retained with note. |
| FLEX burn duration vs extinction | Fixed | 14.8 s retained; Disruption end condition disclosed. |
| SAFFIRE-V publication disagreement | Still Open | Both published atmospheres disclosed; no synthetic resolution. |
| Full independent scientific review | Still Open | Mixed review depth recorded for all 45 records/overviews; abstract review is not full-text verification. |
| Misleading provenance badges | Fixed | Review-depth labels replace blanket verification claims. |
| Approximate matching presented as exact | Fixed | Tolerance matches labeled approximate; numerical equality only describes stored values. |
| AI wrong-investigation pairing / invented claims | Fixed | Bounded name retrieval and strict existing-field selections; unsupported prose rejected. |
| Gemini fallback diagnosis | Fixed for current integration | Real Gemini response succeeded; default NVIDIA precedence is explicit. Historical failure cannot be reconstructed without logs. |
| NVIDIA integration | Fixed / verified | Actual live query and browser response validated against retrieved fields. |
| OpenAI integration credentials | Blocked | Actual request returned authentication_or_permission. Fallback works; credentials/access need owner attention if this provider is required. |
| Comparison selectors clipped / stale URL | Fixed | Responsive selectors, atomic swap, URL persistence and reload verified. |
| Heatmap contrast and bin gaps | Fixed | Readable colors; continuous bins and boundary regression checks. |
| Mobile dialogs and navigation | Fixed | Focus containment and return checked; all seven routes opened at 390px without page overflow. |
| Unrequested onboarding navigation | Fixed | Tour starts only on explicit request. |
| 3D controls / screenshot disclosure | Fixed | Control overlays separated, fractional inputs preserved, snapshots marked illustrative. |
| Production deployment | Still Open | Standard Next Node routes build; Vercel-compatible configuration inspected. Production environment and public URL not exercised. |

Automated checks executed: TypeScript passed; ESLint passed; 23 offline tests passed; optimized production build passed with 13 routes. Separate live provider harness executed three requests: NVIDIA and Gemini validated real responses, OpenAI validated deterministic fallback after authentication/permission failure. Passing the harness does not mean all providers answered successfully.

Browser interaction coverage: Mission analysis and Markdown/JSON download; agent comparison query, citations, exports and comparison action; comparison qualitative guard, quantitative metrics, swap and reload persistence; Knowledge search, details, NASA link, exports, Escape and focus return; IGNIS oxygen/flow/material/gravity/reset and view changes; 3D canvas visual inspection, pause/play/restart, camera, quality, layers, gravity and inputs; mobile navigation across every workspace. Downloaded Markdown/JSON contents were parsed and checked, and a PNG snapshot file was produced. Some functional checks preceded the final rebuild; the final build additionally received the comparison/reload/mobile regression pass. This was not an exhaustive test of every combination or browser.

Remaining verification: full quiz/tour sequence, cross-browser accessibility, final annotated PNG visual inspection, public deployment and independent domain review. The 3D scene remains an illustrative model, not validated CFD or a digital twin of NASA hardware. Do not market it as such.

Evidence inventory: evidence-audit.json (1,083 active fields); histories preserve removed claims. Provider results: provider-verification.json. Scientific disclosure: data-provenance.md. AI contract: ai-disclosure.md. Demonstration: demo-script.md.

Exact changed-file list relative to the workspace follows. The baseline backup is recorded in changed-files.json; no Git repository was available.

- `.env.example`
- `.gitignore`
- `README.md`
- `docs/ai-disclosure.md`
- `docs/changed-files.json`
- `docs/data-provenance.md`
- `docs/demo-script.md`
- `docs/evidence-audit-history.json`
- `docs/evidence-audit-remediation-history.json`
- `docs/evidence-audit.json`
- `docs/live-ai-verification.json`
- `docs/provider-verification.json`
- `docs/remediation-report.md`
- `eslint.config.mjs`
- `next.config.ts`
- `package.json`
- `scripts/export-current-audit.py`
- `scripts/ingest_nasa.py`
- `scripts/live-ai.verify.ts`
- `scripts/remediate-corpus.py`
- `src/app/agent/page.tsx`
- `src/app/api/agent/route.ts`
- `src/app/api/analyze/route.ts`
- `src/app/compare/page.tsx`
- `src/app/globals.css`
- `src/app/ignis/page.tsx`
- `src/app/knowledge/page.tsx`
- `src/app/layout.tsx`
- `src/app/mission/page.tsx`
- `src/app/simulation/page.tsx`
- `src/components/agent/EvidenceAnswer.tsx`
- `src/components/ai-elements/chain-of-thought.tsx`
- `src/components/comparison/ExperimentSelector.tsx`
- `src/components/comparison/ScientificChart.tsx`
- `src/components/evidence/EvidenceHeatmap.tsx`
- `src/components/evidence/GravityCrossoverPanel.tsx`
- `src/components/ignis/FireSafetyQuiz.tsx`
- `src/components/knowledge/ExperimentDetailsDrawer.tsx`
- `src/components/knowledge/KnowledgeTable.tsx`
- `src/components/layout/AppGuide.tsx`
- `src/components/layout/AppHeader.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/components/mission/AIAnalysisPanel.tsx`
- `src/components/mission/EvidenceCard.tsx`
- `src/components/mission/MaterialScreeningMatrix.tsx`
- `src/components/simulation/ThreeCombustionScene.tsx`
- `src/components/ui/SourceCitation.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/collapsible.tsx`
- `src/data/evidence.json`
- `src/data/investigations.json`
- `src/data/provenance.json`
- `src/lib/agent/retrieval.ts`
- `src/lib/ai/analyst.ts`
- `src/lib/ai/grounding.ts`
- `src/lib/evidence/provenance.ts`
- `src/lib/evidence/repository.ts`
- `src/lib/export/brief.ts`
- `src/lib/matching/coverage.ts`
- `src/lib/ranking/ranker.ts`
- `src/lib/use-dialog-focus.ts`
- `src/lib/utils.ts`
- `src/lib/validation/schemas.ts`
- `src/tests/flare.test.ts`
- `src/tests/remediation.test.ts`
- `tsconfig.json`
- `vitest.live.config.ts`
