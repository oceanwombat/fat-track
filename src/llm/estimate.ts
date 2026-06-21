export type EstimateResult =
  | { ok: true; kcal: number; note?: string }
  | { ok: false; reason: string };

/** Embedded free-tier Gemini key (build-time). Unset -> feature hidden/disabled. */
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const MODEL = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ?? 'gemini-2.0-flash';

const TIMEOUT_MS = 15_000;

/** True when an API key is configured at build time. */
export function isEstimateConfigured(): boolean {
  return Boolean(API_KEY);
}

/**
 * Best-effort calorie estimate from a free-text description, via Google Gemini
 * called directly from the browser. Online-only and advisory: any failure
 * returns { ok: false } and the user just types a value manually — this never
 * blocks logging.
 */
export async function estimateCalories(description: string): Promise<EstimateResult> {
  const text = description.trim();
  if (!text) return { ok: false, reason: 'Add a description first' };
  if (!API_KEY) return { ok: false, reason: 'AI estimate not configured' };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const body = {
    contents: [
      {
        parts: [
          {
            text:
              'Estimate the total calories (kilocalories) in the following food or meal. ' +
              'If no quantity is given, assume one typical serving. ' +
              `Respond with your best single integer estimate.\n\nFood: ${text}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          kcal: { type: 'INTEGER' },
          note: { type: 'STRING' },
        },
        required: ['kcal'],
      },
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      return { ok: false, reason: `Estimate failed (${res.status})` };
    }

    const data = await res.json();
    const raw: unknown = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof raw !== 'string') {
      return { ok: false, reason: 'No estimate returned' };
    }

    const parsed = JSON.parse(raw) as { kcal?: unknown; note?: unknown };
    const kcal = Math.round(Number(parsed.kcal));
    if (!Number.isFinite(kcal) || kcal <= 0) {
      return { ok: false, reason: 'No estimate returned' };
    }

    const note = typeof parsed.note === 'string' && parsed.note.trim() ? parsed.note.trim() : undefined;
    return { ok: true, kcal, note };
  } catch (err) {
    const reason =
      err instanceof DOMException && err.name === 'AbortError'
        ? 'Estimate timed out'
        : 'Network error';
    return { ok: false, reason };
  } finally {
    clearTimeout(timer);
  }
}
