'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { RESEARCH_QUESTION_PRESETS } from '@/lib/evidence/repository';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ResearchQuestionInputProps {
  question: string;
  isLoading: boolean;
  validationError: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onSelectPresetQuestion?: (presetQuestion: string) => void;
}

export function ResearchQuestionInput({
  question,
  isLoading,
  validationError,
  onChange,
  onSubmit,
  onSelectPresetQuestion,
}: ResearchQuestionInputProps) {
  return (
    <Card className="h-full justify-between">
      <div>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Fire-Safety Research Inquiry</CardTitle>
            <span className="font-mono-telemetry text-[11px] font-medium px-1.5 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0] text-[#0284C7]">
              STAGE 02
            </span>
          </div>
          <CardDescription>
            Choose a core microgravity fire-safety question or write your own boundary inquiry.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Curated Prompts */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-[#334155]">
              Curated Inquiries
            </span>
            <div className="flex flex-wrap gap-1.5">
              {RESEARCH_QUESTION_PRESETS.map((presetQ) => {
                const isActive = question.trim() === presetQ;
                return (
                  <button
                    key={presetQ}
                    type="button"
                    onClick={() => {
                      onChange(presetQ);
                      if (!isLoading && onSelectPresetQuestion) {
                        onSelectPresetQuestion(presetQ);
                      }
                    }}
                    className={cn(
                      'text-left px-2.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]',
                      isActive
                        ? 'bg-[#F1F5F9] border-[#0284C7] text-[#0F172A] font-medium'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1] hover:text-[#0F172A]'
                    )}
                  >
                    {presetQ}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Textarea */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="research-question-textarea"
              className="text-xs font-medium text-[#334155]"
            >
              Active Research Question
            </label>
            <textarea
              id="research-question-textarea"
              rows={3}
              value={question}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isLoading) onSubmit();
                }
              }}
              placeholder="Ask about airflow effects, LOI extinction limits, smoke transport, or material flammability..."
              className="w-full p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0284C7] focus:outline-none text-xs sm:text-sm text-[#0F172A] placeholder-[#64748B] resize-y"
            />
            {validationError ? (
              <p className="text-xs text-[#DC2626] font-mono-telemetry">
                {validationError}
              </p>
            ) : null}
          </div>
        </CardContent>
      </div>

      <CardFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FFFFFF]/60">
        <span className="font-mono-telemetry text-[11px] text-[#64748B]">
          Deterministic ranking + server synthesis
        </span>
        <Button
          variant="default"
          size="lg"
          onClick={onSubmit}
          disabled={isLoading}
          className="w-full sm:w-auto font-display font-semibold"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isLoading ? 'Analyzing Evidence...' : 'Analyze NASA Evidence'}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
