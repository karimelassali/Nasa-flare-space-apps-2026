import { buildSelectionPrompt, buildSourceResponse, validateSelection } from './grounding';
import type {
  AIAnalysisResponse,
  EvidenceRecord,
  RankedEvidenceResult,
  ScenarioParameters,
} from '@/types/flare';

const AI_TIMEOUT_MS = 20000;
const NVIDIA_NIM_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export const DEFAULT_NVIDIA_MODEL = 'nvidia/nemotron-3.5-lightning-30b-a3b';
export const FALLBACK_NVIDIA_MODEL = 'nvidia/nemotron-3.5-bolt-e4b';
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

/**
 * Explicit server-side provider precedence when multiple API keys are configured:
 * 1. NVIDIA NIM (`NVIDIA_API_KEY`)
 * 2. Google Gemini (`GEMINI_API_KEY`)
 * 3. OpenAI (`OPENAI_API_KEY`)
 * Each key is sent exclusively to its own provider endpoint.
 */
export const PROVIDER_PRECEDENCE = ['nvidia', 'gemini', 'openai'] as const;
export type AIProviderName = (typeof PROVIDER_PRECEDENCE)[number];

export function buildDeterministicFallbackAnalysis(
  question: string,
  scenario: ScenarioParameters,
  rankedResults: RankedEvidenceResult[],
  providerNote?: string
): AIAnalysisResponse {
  const response = buildSourceResponse(
    question, rankedResults.slice(0, 4).map((r) => r.record), 'deterministic_fallback',
    providerNote ?? 'Non-AI evidence summary assembled from the local source-linked records.'
  );
  if (scenario.gravityContext !== 'Microgravity') {
    response.limitations.push(`The loaded flight evidence does not establish results for ${scenario.gravityContext} gravity.`);
  }
  return response;
}

function classifyProviderError(error: unknown): string {
  if (error instanceof Error && error.name === 'AbortError') return 'timeout';
  if (error instanceof SyntaxError) return 'invalid_json';
  if (error instanceof Error && /status 401|status 403/.test(error.message)) {
    return 'authentication_or_permission';
  }
  if (error instanceof Error && /status 429/.test(error.message)) {
    return 'rate_limited';
  }
  if (error instanceof Error && /status 4[0-9][0-9]/.test(error.message)) {
    return 'provider_request_error';
  }
  if (error instanceof Error && /status 5[0-9][0-9]/.test(error.message)) {
    return 'provider_server_error';
  }
  return 'network_or_unknown';
}

function extractJsonFromText(rawText: string): unknown {
  let cleanedText = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  const firstBrace = cleanedText.indexOf('{');
  const lastBrace = cleanedText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleanedText = cleanedText.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleanedText);
}

async function callNvidiaNim(
  prompt: string,
  apiKey: string,
  model: string
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const requestInit: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1400,
        chat_template_kwargs: { enable_thinking: false },
        ...(model.includes('bolt')
          ? {}
          : { response_format: { type: 'json_object' } }),
        messages: [
          {
            role: 'system',
            content:
              'You are FLARE, a NASA microgravity combustion research analyst. Output strictly valid JSON only with no markdown code fences or prose, grounded only in the provided records.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    };

    let response = await fetch(NVIDIA_NIM_ENDPOINT, requestInit);

    if (response.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      response = await fetch(NVIDIA_NIM_ENDPOINT, requestInit);
    }

    if (!response.ok) {
      throw new Error(`NVIDIA NIM API returned status ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawText = payload.choices?.[0]?.message?.content?.trim();
    if (!rawText) throw new Error('Empty NVIDIA NIM response text');

    return extractJsonFromText(rawText);
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(
  prompt: string,
  apiKey: string,
  model: string
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  const endpoint = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-goog-api-key': apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: 'You are FLARE, a NASA microgravity combustion research analyst. Output strictly valid JSON only with no markdown code fences or prose, grounded only in the provided records.',
            },
          ],
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1400,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const rawText = payload.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('')
      .trim();
    if (!rawText) throw new Error('Empty Gemini response text');

    return extractJsonFromText(rawText);
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAI(
  prompt: string,
  apiKey: string,
  model: string
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1400,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are FLARE, a NASA microgravity combustion research analyst. Output strictly valid JSON only with no markdown code fences or prose, grounded only in the provided records.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API returned status ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawText = payload.choices?.[0]?.message?.content?.trim();
    if (!rawText) throw new Error('Empty OpenAI response text');

    return extractJsonFromText(rawText);
  } finally {
    clearTimeout(timer);
  }
}

export interface AnalyzeOptions {
  provider?: AIProviderName;
  fallbackProvider?: AIProviderName;
  nvidiaApiKey?: string;
  nvidiaModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  openaiApiKey?: string;
  openaiModel?: string;
}

const PROVIDER_DISPLAY_NAMES: Record<AIProviderName, string> = {
  nvidia: 'NVIDIA NIM',
  gemini: 'Google Gemini',
  openai: 'OpenAI',
};

function readKeysByProvider(
  options: AnalyzeOptions
): Record<AIProviderName, string | undefined> {
  const hasExplicitKeyOptions =
    options.nvidiaApiKey !== undefined ||
    options.geminiApiKey !== undefined ||
    options.openaiApiKey !== undefined;

  return {
    nvidia:
      (hasExplicitKeyOptions
        ? options.nvidiaApiKey
        : process.env.NVIDIA_API_KEY)?.trim() || undefined,
    gemini:
      (hasExplicitKeyOptions
        ? options.geminiApiKey
        : process.env.GEMINI_API_KEY)?.trim() || undefined,
    openai:
      (hasExplicitKeyOptions
        ? options.openaiApiKey
        : process.env.OPENAI_API_KEY)?.trim() || undefined,
  };
}

function resolveProviderSelection(
  options: AnalyzeOptions,
  keysByProvider: Record<AIProviderName, string | undefined>
): {
  provider: AIProviderName;
  apiKey: string;
} | null {
  const requested = options.provider ?? process.env.AI_PROVIDER;
  if (requested) {
    if (!PROVIDER_PRECEDENCE.includes(requested as AIProviderName)) return null;
    const provider = requested as AIProviderName;
    const key = keysByProvider[provider];
    return key ? { provider, apiKey: key } : null;
  }

  for (const provider of PROVIDER_PRECEDENCE) {
    const key = keysByProvider[provider];
    if (key) {
      return { provider, apiKey: key };
    }
  }

  return null;
}

interface ProviderAttemptResult {
  validated: AIAnalysisResponse | null;
  hadSchemaFailure: boolean;
  lastFailureCategory: string;
}

async function runProviderAttempt(
  provider: AIProviderName,
  apiKey: string,
  prompt: string,
  question: string,
  available: EvidenceRecord[],
  options: AnalyzeOptions,
  noteSuffix?: string
): Promise<ProviderAttemptResult> {
  const providerLabel = PROVIDER_DISPLAY_NAMES[provider];
  let hadSchemaFailure = false;
  let lastFailureCategory = 'unavailable';

  const models: string[] = (() => {
    if (provider === 'nvidia') {
      const primary =
        (options.nvidiaModel ?? process.env.NVIDIA_MODEL ?? DEFAULT_NVIDIA_MODEL).trim() ||
        DEFAULT_NVIDIA_MODEL;
      return primary === FALLBACK_NVIDIA_MODEL ? [primary] : [primary, FALLBACK_NVIDIA_MODEL];
    }
    if (provider === 'gemini') {
      return [
        (options.geminiModel ?? process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL).trim() ||
          DEFAULT_GEMINI_MODEL,
      ];
    }
    return [
      (options.openaiModel ?? process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL).trim() ||
        DEFAULT_OPENAI_MODEL,
    ];
  })();

  const caller =
    provider === 'nvidia' ? callNvidiaNim : provider === 'gemini' ? callGemini : callOpenAI;

  for (const modelName of models) {
    try {
      const rawJson = await caller(prompt, apiKey, modelName);
      const provenance = `AI-assisted evidence selection via ${providerLabel} (${modelName}${noteSuffix ? `; ${noteSuffix}` : ''}; record IDs and measurement keys validated against retrieved records; scientific text rendered from stored source fields).`;
      const validated = validateSelection(rawJson, question, available, provider, provenance);
      if (validated) {
        return { validated, hadSchemaFailure: false, lastFailureCategory: 'none' };
      }
      hadSchemaFailure = true;
      console.error('AI provider failure category:', 'invalid_evidence_selection');
    } catch (error) {
      lastFailureCategory = classifyProviderError(error);
      console.error('AI provider failure category:', lastFailureCategory);
    }
  }

  return { validated: null, hadSchemaFailure, lastFailureCategory };
}

export async function analyzeScenarioWithAI(
  question: string,
  scenario: ScenarioParameters,
  rankedResults: RankedEvidenceResult[],
  verifiedRecords: EvidenceRecord[],
  options: AnalyzeOptions = {}
): Promise<AIAnalysisResponse> {
  const keysByProvider = readKeysByProvider(options);
  const selected = resolveProviderSelection(options, keysByProvider);
  const available = rankedResults.slice(0, 4).map((r) => r.record)
    .filter((record) => verifiedRecords.some((r) => r.id === record.id));
  const prompt = buildSelectionPrompt(question, rankedResults);
  if (!available.length) return buildDeterministicFallbackAnalysis(question, scenario, [], 'No relevant records; no AI provider request was made.');

  if (!selected) {
    return buildDeterministicFallbackAnalysis(
      question,
      scenario,
      rankedResults,
      'No server AI API key configured — operating in non-AI deterministic evidence summary mode.'
    );
  }

  const { provider, apiKey } = selected;
  const primaryResult = await runProviderAttempt(
    provider,
    apiKey,
    prompt,
    question,
    available,
    options
  );
  if (primaryResult.validated) return primaryResult.validated;

  const requestedFallback = (options.fallbackProvider ?? process.env.AI_FALLBACK_PROVIDER) as
    | AIProviderName
    | undefined;
  if (
    requestedFallback &&
    requestedFallback !== provider &&
    PROVIDER_PRECEDENCE.includes(requestedFallback)
  ) {
    const fallbackKey = keysByProvider[requestedFallback];
    if (fallbackKey) {
      const fallbackResult = await runProviderAttempt(
        requestedFallback,
        fallbackKey,
        prompt,
        question,
        available,
        options,
        `fallback after ${PROVIDER_DISPLAY_NAMES[provider]} (${primaryResult.lastFailureCategory})`
      );
      if (fallbackResult.validated) return fallbackResult.validated;
    }
  }

  const providerLabel = PROVIDER_DISPLAY_NAMES[provider];
  return buildDeterministicFallbackAnalysis(
    question,
    scenario,
    rankedResults,
    primaryResult.hadSchemaFailure
      ? `${providerLabel} response failed citation or schema validation or safety screening; reverted to non-AI deterministic evidence summary.`
      : `${providerLabel} request could not complete (${primaryResult.lastFailureCategory}); reverted to non-AI deterministic evidence summary.`
  );
}
