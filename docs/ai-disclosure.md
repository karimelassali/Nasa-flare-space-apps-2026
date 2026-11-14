# AI disclosure

The research agent and Mission Mode retrieve the local NASA-linked corpus on the server. The model selects existing record IDs and measurement keys using a strict JSON schema. Unknown IDs, unknown measurements, extra prose, and incomplete comparisons reject the entire selection. Scientific statements are rendered from stored source fields; models cannot publish free-form numerical claims through this response contract. This reduces hallucination risk but does not independently validate the underlying corpus.

`AI_PROVIDER` optionally selects nvidia, gemini, or openai. Otherwise configured-key precedence is NVIDIA, Gemini, OpenAI. Each secret is sent only to its own provider endpoint. Errors log sanitized categories without keys or raw responses. Provider failures preserve deterministic evidence summaries and exports. Requests have provider timeouts and server route duration limits.

Actual live checks on 2026-11-14: NVIDIA and Gemini both returned validated selections for BASS-II versus FLEX. Citations and rendered claims matched current source fields. OpenAI returned authentication_or_permission; its deterministic fallback passed. See `provider-verification.json`. The local default is NVIDIA, so a configured Gemini key does not imply Gemini is selected. Historical Gemini fallback cannot be diagnosed retrospectively from missing logs; the current integration works in the executed live check.

Run `npm run verify:ai` explicitly to repeat live network checks. Ordinary tests are offline. Keys remain server-side and must be configured separately in deployment. No public deployment was verified during this remediation.
