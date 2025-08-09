import type { Candle } from "../types";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function fetchCandles(symbol: string, months: number = 6, granularity: string = "1d"): Promise<Candle[]> {
  const params = new URLSearchParams({ months: months.toString(), granularity });
  const r = await fetch(`${API}/candles/${symbol}?${params}`);
  if (!r.ok) throw new Error(`Candles fetch failed: ${r.status}`);
  return r.json();
}
