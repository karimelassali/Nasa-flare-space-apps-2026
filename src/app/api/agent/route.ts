import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAllEvidenceRecords } from '@/lib/evidence/repository';
import { rankEvidenceCorpus } from '@/lib/ranking/ranker';
import { analyzeScenarioWithAI } from '@/lib/ai/analyst';
import { comparisonRecords, mentionedRecords, retrieveQuestionRecords } from '@/lib/agent/retrieval';
import { getRecordProvenance } from '@/lib/evidence/provenance';
import type { ScenarioParameters } from '@/types/flare';

export const maxDuration = 60;
const requestSchema = z.object({ message: z.string().trim().min(1).max(800), contextIds: z.array(z.string().max(80)).max(6).default([]) });
const scenario: ScenarioParameters = { missionId: 'custom', oxygenPercent: 21, pressureKpa: 101.3, airflowCms: 10, material: 'Any', gravityContext: 'Microgravity' };
const pages = [
  { terms: /mission|scenario|preset|brief|export/i, label: 'Mission Mode', href: '/mission', description: 'Select an environment, adjust conditions, enter a question, then Analyze NASA Evidence. Download the result as Markdown or JSON.' },
  { terms: /ignis|schematic/i, label: 'IGNIS Scenario Lab', href: '/ignis', description: 'Adjust material, oxygen, airflow and gravity; inspect conceptual views and related evidence.' },
  { terms: /3d|simulation|chamber|camera|flame view/i, label: '3D Simulation Lab', href: '/simulation', description: 'Choose a scenario and fuel. Drag to orbit, scroll to zoom, right-drag to pan, or use Front, Side, Top and Isometric. Pause, restart, toggle layers or take a snapshot.' },
  { terms: /gap|coverage|heatmap|filter|explorer/i, label: 'Evidence Explorer', href: '/evidence', description: 'Filter by investigation, platform, material or numerical data. Select a coverage cell to inspect records; Reset Filters restores the view.' },
  { terms: /compar|versus|\bvs\b/i, label: 'Experiment Comparison', href: '/compare', description: 'Choose or swap two records. Charts require the same physical quantity, scope and unit; conditions may still differ.' },
  { terms: /knowledge|search|database|records/i, label: 'NASA Knowledge Base', href: '/knowledge', description: 'Search by investigation, material or finding, filter or sort the table, then Inspect a record for its conditions, limitations, exports and primary source.' },
];

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get('content-length')) > 12000) return NextResponse.json({ error: 'Message is too long.' }, { status: 413 });
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 12000) return NextResponse.json({ error: 'Message is too long.' }, { status: 413 });
    const parsed = requestSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return NextResponse.json({ error: 'Enter a message of up to 800 characters and at most six record IDs.' }, { status: 400 });
    const { message, contextIds } = parsed.data;
    const records = getAllEvidenceRecords();
    if (contextIds.some((id) => !records.some((r) => r.id === id))) return NextResponse.json({ error: 'A conversation record is no longer available. Start a new chat.' }, { status: 400 });
    const mentions = mentionedRecords(message, records);
    const matchedPages = pages.filter((p) => p.terms.test(message));
    const isUiQuestion = /\b(guide|navigate|navigation|sidebar|tour|buttons?|features?|camera|3d lab)\b/i.test(message) || (/\b(how (do|can|to)|where|which (page|tab|button))\b/i.test(message) && matchedPages.length > 0);
    if (!mentions.length && isUiQuestion) return NextResponse.json({
      kind: 'guide', answer: 'Here is how to do that in FLARE. Open the relevant workspace below.',
      actions: (matchedPages.length ? matchedPages : pages).map(({ label, href, description }) => ({ label, href, description })), citations: [], contextIds,
    });
    let chosen = retrieveQuestionRecords(message, records, contextIds);
    if (!chosen.length) {
      return NextResponse.json({
        kind: 'guide',
        answer:
          'This query is outside FLARE\'s NASA microgravity combustion corpus. Ask about spacecraft fire safety, oxygen concentration, pressure, airflow, materials, or NASA experiments such as FLEX, SAFFIRE, BASS-II, ACME, or SoFIE.',
        actions: [
          {
            label: 'Browse NASA Knowledge Base',
            href: '/knowledge',
            description: 'Inspect all 24 audited records across 21 NASA microgravity combustion investigations.',
          },
          {
            label: 'Configure Scenario in Mission Mode',
            href: '/mission',
            description: 'Test oxygen, pressure, airflow, and material boundary conditions against the corpus.',
          },
        ],
        citations: [],
        contextIds,
      });
    }
    const comparison = /compar|versus|\bvs\b/i.test(message);
    const pair = comparison ? comparisonRecords(message, chosen) : [];
    if (comparison && pair.length === 2) chosen = pair;
    const ranked = rankEvidenceCorpus(chosen, scenario, message);
    const analysis = await analyzeScenarioWithAI(message, scenario, ranked, chosen);
    const cited = analysis.citedEvidenceIds.flatMap((id) => records.filter((r) => r.id === id));
    const actions: { label: string; href: string; description: string }[] = [];
    if (comparison) actions.push(pair.length === 2 ? {
      label: `Compare ${pair[0].investigationName} and ${pair[1].investigationName}`,
      href: '/compare?ids=' + encodeURIComponent(pair.map((r) => r.id).join(',')),
      description: `${pair[0].experimentTitle} ↔ ${pair[1].experimentTitle}. Different metrics stay separate.`,
    } : { label: 'Choose two experiments', href: '/compare', description: 'Name two investigations or two record IDs for a prepared comparison.' });
    if (/3d|simulation|chamber/i.test(message)) actions.push({ label: 'Open 3D lab', href: '/simulation', description: 'Conceptual visualization; not a validated physical solver.' });
    const brief = cited.length ? `# FLARE Evidence Brief\n\nResearch question: ${message}\n\n## Evidence\n${analysis.evidenceSummary}\n\n## Reported quantities\n${(analysis.claims ?? []).filter((c) => c.field !== 'findings').map((c) => `- [${c.recordId}] ${c.label}: ${c.text}`).join('\n') || 'No numerical quantities selected.'}\n\n## Research interpretations\n${analysis.engineeringImplications.map((x) => '- ' + x).join('\n')}\n\n## Conditions\n${analysis.recordConditions?.map((c) => `- [${c.recordId}] ${c.text}`).join('\n')}\n\n## Limitations\n${analysis.limitations.map((x) => '- ' + x).join('\n')}\n\n## Sources\n${cited.map((r) => `- ${r.investigationName} [${r.id}]: ${r.sourceUrl} — ${getRecordProvenance(r.id).label}`).join('\n')}\n\n## Method\n${analysis.providerNote}\nResearch use only; not NASA-certified.\n` : undefined;
    return NextResponse.json({
      kind: 'evidence', analysis, actions, brief,
      citations: cited.map((r) => ({ id: r.id, title: r.experimentTitle, investigation: r.investigationName, sourceUrl: r.sourceUrl, sourceDocument: r.sourceDocument, limitations: r.evidenceLimitations, recordType: r.recordType, provenance: getRecordProvenance(r.id) })),
      contextIds: (mentions.length ? mentions : cited).map((r) => r.id).slice(0, 6),
      scenarioNote: 'Retrieval uses an illustrative microgravity reference. The conditions below belong to each cited record, not a shared experimental setup.',
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof SyntaxError ? 'Invalid JSON request.' : 'The agent could not complete this request. Please try again.' }, { status: error instanceof SyntaxError ? 400 : 500 });
  }
}
