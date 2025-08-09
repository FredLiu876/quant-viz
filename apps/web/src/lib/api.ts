import type { Candle } from "../types";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function fetchCandles(symbol: string): Promise<Candle[]> {
  const r = await fetch(`${API}/candles/${symbol}`);
  if (!r.ok) throw new Error(`Candles fetch failed: ${r.status}`);
  return r.json();
}
