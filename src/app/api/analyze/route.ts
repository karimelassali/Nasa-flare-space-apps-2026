import { NextResponse } from 'next/server';
import { AnalyzeRequestSchema } from '@/lib/validation/schemas';
import { getAllEvidenceRecords, getEvidenceByIds } from '@/lib/evidence/repository';
import { rankEvidenceCorpus } from '@/lib/ranking/ranker';
import { analyzeScenarioWithAI } from '@/lib/ai/analyst';

const MAX_REQUEST_BYTES = 16 * 1024;
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const contentLengthHeader = request.headers.get('content-length');
    if (contentLengthHeader) {
      const len = Number(contentLengthHeader);
      if (!Number.isNaN(len) && len > MAX_REQUEST_BYTES) {
        return NextResponse.json(
          { error: 'Request payload exceeds 16 KB limit.' },
          { status: 413 }
        );
      }
    }

    const rawText = await request.text();
    if (Buffer.byteLength(rawText, 'utf8') > MAX_REQUEST_BYTES) {
      return NextResponse.json(
        { error: 'Request payload exceeds 16 KB limit.' },
        { status: 413 }
      );
    }

    let jsonBody: unknown;
    try {
      jsonBody = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const parsed = AnalyzeRequestSchema.safeParse(jsonBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid scenario or question parameters.',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { scenario, question, retrievedEvidenceIds } = parsed.data;

    // Server independently retrieves and validates verified evidence records.
    const allVerifiedRecords = getAllEvidenceRecords();
    if (retrievedEvidenceIds.some((id) => !allVerifiedRecords.some((record) => record.id === id))) {
      return NextResponse.json({ error: 'One or more requested evidence records do not exist.' }, { status: 400 });
    }
    const requestedSubset =
      retrievedEvidenceIds.length > 0
        ? getEvidenceByIds(retrievedEvidenceIds)
        : allVerifiedRecords;

    const verifiedScope =
      requestedSubset.length > 0 ? requestedSubset : allVerifiedRecords;

    const rankedResults = rankEvidenceCorpus(
      verifiedScope,
      scenario,
      question
    );

    const analysis = await analyzeScenarioWithAI(
      question,
      scenario,
      rankedResults,
      verifiedScope
    );

    return NextResponse.json(analysis, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Unexpected server error while analyzing NASA evidence.' },
      { status: 500 }
    );
  }
}
