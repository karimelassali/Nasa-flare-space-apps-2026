'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUp, RotateCcw, Search, SquarePen, Square } from 'lucide-react';
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import { EvidenceAnswer, type AgentAnswer } from '@/components/agent/EvidenceAnswer';
import { getCorpusStatistics } from '@/lib/evidence/repository';

type Message = {
  id: number;
  role: 'user' | 'agent';
  text?: string;
  answer?: AgentAnswer;
  error?: string;
};

const STARTERS = [
  'What does FLEX show about droplet combustion?',
  'Compare SAFFIRE-I and SAFFIRE-III',
  'Find evidence about airflow and flame spread',
  'How do I change the camera in the 3D lab?',
];

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [context, setContext] = useState<string[]>([]);
  const serial = useRef(0);
  const end = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const stats = getCorpusStatistics();
  useEffect(() => () => controller.current?.abort(), []);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    const id = ++serial.current;
    setMessages((prev) => [...prev, { id, role: 'user', text: message }]);
    setInput('');
    setBusy(true);
    const aborter = new AbortController();
    controller.current = aborter;
    const timeout = setTimeout(() => aborter.abort(), 55000);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        signal: aborter.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, contextIds: context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed.');
      if (id !== serial.current) return;
      setContext(data.contextIds || []);
      setMessages((prev) => [...prev, { id: id + 0.5, role: 'agent', answer: data }]);
      setTimeout(() => end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);
    } catch (e) {
      if (id === serial.current) {
        setMessages((prev) => [
          ...prev,
          {
            id: id + 0.5,
            role: 'agent',
            error: e instanceof Error && e.name === 'AbortError' ? 'Request stopped. You can retry or ask another question.' : e instanceof Error ? e.message : 'Request failed.',
          },
        ]);
      }
    } finally {
      clearTimeout(timeout);
      if (id === serial.current) setBusy(false);
    }
  }

  function clear() {
    serial.current++;
    controller.current?.abort();
    setMessages([]);
    setContext([]);
    setBusy(false);
    setInput('');
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-11.5rem)] min-h-[420px] max-w-4xl flex-col lg:h-[calc(100dvh-9rem)]">
      {/* Minimal top bar */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-semibold text-[#0F172A]">
            Research Agent
          </span>
          <span className="rounded-md bg-sky-50 px-2 py-1 text-xs text-sky-800">NASA evidence workspace</span>
        </div>
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#475569] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <SquarePen className="h-3.5 w-3.5" />
            New chat
          </button>
        ) : null}
      </div>

      {/* Conversation stream */}
      <div
        data-tour="agent-workspace"
        className="min-h-0 flex-1 overflow-y-auto px-1 py-3 sm:py-4"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center px-2 py-2 sm:py-4 text-center">
            <div className="mb-5 relative h-44 sm:h-52 w-full max-w-xl overflow-hidden rounded-2xl ring-1 ring-[#0F172A]/10 shadow-[0_14px_38px_-14px_rgba(2,132,199,0.28)]">
              <Image
                src="/splash.png"
                alt="FLARE microgravity combustion cover"
                fill
                priority
                className="object-cover object-center"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#FFFFFF] via-[#FFFFFF]/55 to-transparent" />
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/15" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]">
              Start with a question. Follow the evidence.
            </h1>
            <p className="mt-2 max-w-md text-sm text-[#64748B]">
              Explore combustion research, compare experiments, and prepare a source-linked brief. Every reported quantity stays connected to its experiment.
            </p>
            <div className="mt-4 sm:mt-7 grid w-full max-w-xl gap-2 sm:grid-cols-2">
              {STARTERS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void send(prompt)}
                  className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] px-4 py-3 text-left text-[13px] text-[#334155] transition-colors hover:bg-[#F8FAFC] hover:border-[#CBD5E1] hover:text-[#0F172A]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-7 pb-4">
            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-3xl bg-[#F1F5F9] px-4 py-2.5 text-[15px] leading-relaxed text-[#0F172A]">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={m.id}>
                  {m.error ? (
                    <div
                      className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]"
                      role="alert"
                    >
                      <p>{m.error}</p>
                      <button
                        type="button"
                        onClick={() => {
                          const last = [...messages]
                            .reverse()
                            .find((x) => x.role === 'user');
                          if (last?.text) void send(last.text);
                        }}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium underline"
                      >
                        <RotateCcw className="h-3 w-3" /> Retry
                      </button>
                    </div>
                  ) : m.answer ? (
                    <EvidenceAnswer answer={m.answer} />
                  ) : null}
                </div>
              )
            )}

            {busy ? (
              <div role="status">
                <ChainOfThought defaultOpen={true}>
                  <ChainOfThoughtHeader>
                    Retrieving source-linked evidence…
                  </ChainOfThoughtHeader>
                  <ChainOfThoughtContent>
                    <ChainOfThoughtStep
                      icon={Search}
                      label="Searching source-linked NASA investigations"
                      description="Ranking primary records, boundary conditions, and source citations."
                      status="active"
                    />
                  </ChainOfThoughtContent>
                </ChainOfThought>
              </div>
            ) : null}
            <div ref={end} />
          </div>
        )}
      </div>

      {/* ChatGPT / Claude style bottom composer */}
      <div className="shrink-0 pt-2">
        <form
          data-tour="agent-input"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-end gap-2 rounded-3xl border border-[#CBD5E1] bg-[#FFFFFF] px-4 py-2 shadow-sm focus-within:border-[#94A3B8]"
        >
          <label className="sr-only" htmlFor="agent-message">
            Message FLARE Assistant
          </label>
          <textarea
            id="agent-message"
            ref={composer}
            value={input}
            onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 144)}px`; }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send(input);
              }
            }}
            maxLength={800}
            rows={1}
            placeholder="Message FLARE Assistant..."
            className="max-h-36 min-h-[38px] min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed text-[#0F172A] placeholder:text-[#64748B] focus:outline-none"
          />
          {busy && <button type="button" onClick={() => controller.current?.abort()} aria-label="Stop response" className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700"><Square className="h-4 w-4" /></button>}
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0F172A] text-white transition-opacity hover:opacity-85 disabled:opacity-25"
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
        <p
          data-tour="agent-capabilities"
          className="mt-2 text-center text-[11px] text-[#64748B]"
        >
          {stats.totalRecords} source-linked records · {stats.uniqueInvestigationCount} investigations · Research use only
        </p>
      </div>
    </div>
  );
}
