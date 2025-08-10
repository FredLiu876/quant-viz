import type { Candle, RunRequest, RunResult } from "@/types";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function fetchCandles(
  symbol: string,
  months: number = 6,
  granularity: string = "1d"
): Promise<Candle[]> {
  const params = new URLSearchParams({ months: months.toString(), granularity });
  const r = await fetch(`${API}/candles/${symbol}?${params}`);
  if (!r.ok) throw new Error(`Candles fetch failed: ${r.status}`);
  return r.json();
}


export async function run(
  req: RunRequest,
  opts?: { signal?: AbortSignal }
): Promise<RunResult> {
  const r = await fetch(`${API}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: opts?.signal,
    body: JSON.stringify({
      code: req.code,
      stdin: req.stdin ?? null,
      timeout_ms: req.timeoutMs ?? null,
    }),
  });

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Run failed: ${r.status} ${text}`);
  }

  return r.json() as Promise<RunResult>;
}
