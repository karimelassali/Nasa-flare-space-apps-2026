'use client';

import { useState } from 'react';
import { Award, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { EvidenceRecord } from '@/types/flare';

interface QuizQuestion {
  id: string;
  recordId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    recordId: 'EV-PSI69-01',
    prompt:
      'Which quantity is reported as 14.8 s for FLEX-008 in the linked source?',
    options: [
      'Flame spread speed',
      'Droplet burn duration',
      'Minimum oxygen concentration',
    ],
    correctIndex: 1,
    explanation:
      'NASA/TP-2015-216046, Table IX, reports a 14.8 s droplet burn duration for FLEX-008. This is not a solid-material flame-spread rate.',
  },
  {
    id: 'q2',
    recordId: 'EV-SAFFIRE-V-01',
    prompt:
      'Which atmosphere does the abstract of NTRS 20210017838 report for its SAFFIRE-V structured-PMMA experiment?',
    options: [
      '34.0% O₂ and 56.5 kPa',
      '26.9 vol% O₂ and 761 hPa (76.1 kPa)',
      '21.0% O₂ and 101.3 kPa',
    ],
    correctIndex: 1,
    explanation:
      '34% O₂ / 56.5 kPa was a pre-flight exploration planning boundary (NTRS 20170000230). NTRS 20210017838 reports 26.9 vol% O₂ at 761 hPa. NTRS 20210011521 Table 1 reports a different V-4 atmosphere; that discrepancy remains unresolved.',
  },
  {
    id: 'q3',
    recordId: 'EV-PSI25-02',
    prompt:
      'How should the 13.5% O₂ value in the BASS-II rod record be interpreted?',
    options: [
      'A minimum on the study flammability boundary, not the atmosphere of every rod test',
      'A guaranteed safe oxygen level for all spacecraft materials',
      'The oxygen condition of the 0.0385 mm/s regression measurement',
    ],
    correctIndex: 0,
    explanation:
      'NASA/TM-20210011385 reports this study boundary for the tested PMMA rods. FLARE does not assign it as the atmosphere of the separate regression measurement or as a general safety threshold.',
  },
  {
    id: 'q4',
    recordId: 'EV-SAME-01',
    prompt:
      'What smoke particle diameter range did SAME-2 measure across 5 spacecraft materials heated below ignition in microgravity?',
    options: [
      '10–20 nm only',
      'Predominantly 200–400 nm (with larger aggregates in quiescent flow)',
      'Over 5,000 nm (5 µm) in all flow speeds',
    ],
    correctIndex: 1,
    explanation:
      'NTRS 20130000422 found the majority of average smoke particle sizes fell between 200 nm and 400 nm, with quiescent cases producing substantially larger particles.',
  },
  {
    id: 'q5',
    recordId: 'EV-SAFFIRE-VI-01',
    prompt:
      'In SAFFIRE-VI (NTRS 20240002981), which cabin telemetry signal was more significant than overall temperature and pressure rise?',
    options: [
      'Increases in cabin CO₂ and CO gas concentrations',
      'Acoustic shockwaves from ignition',
      'Drop in cabin nitrogen fraction',
    ],
    correctIndex: 0,
    explanation:
      'Urban et al. (NTRS 20240002981) found that bulk cabin temperature and pressure rises were less significant than the measurable increase in CO₂ and CO.',
  },
];

interface FireSafetyQuizProps {
  recordsById: Map<string, EvidenceRecord>;
  onInspectRecord: (record: EvidenceRecord) => void;
}

export function FireSafetyQuiz({
  recordsById,
  onInspectRecord,
}: FireSafetyQuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const answeredCount = Object.keys(answers).length;
  const correctCount = QUIZ_QUESTIONS.filter(
    (q) => answers[q.id] === q.correctIndex
  ).length;

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="violet">Explorer Readiness Drill</Badge>
            <Badge variant="outline" className="font-mono-telemetry">
              Score: {correctCount} / {QUIZ_QUESTIONS.length} ({answeredCount} answered)
            </Badge>
          </div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-4 h-4 text-[#7C3AED]" />
            <span>Microgravity Fire-Safety Challenge</span>
          </CardTitle>
          <CardDescription>
            Test your understanding of primary NASA PSI &amp; NTRS combustion findings across BASS, SAFFIRE, and SAME.
          </CardDescription>
        </div>

        <CardAction>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAnswers({})}
            disabled={answeredCount === 0}
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#0284C7]" />
            Reset Quiz
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {QUIZ_QUESTIONS.map((q, idx) => {
          const selectedIdx = answers[q.id];
          const isAnswered = selectedIdx !== undefined;
          const isCorrect = selectedIdx === q.correctIndex;
          const linkedRecord = recordsById.get(q.recordId);

          return (
            <div
              key={q.id}
              className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-[#0F172A]">
                  <span className="font-mono-telemetry text-[#0284C7] mr-2">
                    0{idx + 1}.
                  </span>
                  {q.prompt}
                </p>
                {linkedRecord ? (
                  <button
                    type="button"
                    onClick={() => onInspectRecord(linkedRecord)}
                    className="font-mono-telemetry text-[11px] text-[#0284C7] hover:underline shrink-0 cursor-pointer"
                  >
                    {q.recordId}
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {q.options.map((opt, optIdx) => {
                  const isPicked = selectedIdx === optIdx;
                  const isRightOption = optIdx === q.correctIndex;
                  let style =
                    'bg-[#FFFFFF] border-[#E2E8F0] text-[#334155] hover:border-[#0284C7]/50';
                  if (isAnswered) {
                    if (isRightOption) {
                      style = 'bg-[#ECFDF5] border-[#059669] text-[#065F46] font-medium';
                    } else if (isPicked) {
                      style = 'bg-[#FEF2F2] border-[#DC2626] text-[#991B1B]';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                      }
                      className={`text-left text-xs rounded-lg border p-2.5 transition-colors cursor-pointer ${style}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {isAnswered ? (
                <div className="flex items-start gap-2 text-xs rounded-md bg-[#FFFFFF] border border-[#E2E8F0] p-2.5">
                  {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  )}
                  <span className="text-[#334155] leading-relaxed">
                    {q.explanation}
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
