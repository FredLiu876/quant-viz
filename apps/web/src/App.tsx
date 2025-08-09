import { useEffect, useMemo, useState } from "react";
import LineChart from "./components/LineChart";
import { fetchCandles } from "./lib/api";
import type { Candle } from "./types";

export default function App() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchCandles("TSLA"); // backend already returns 6 months (1D)
        setCandles(data);
      } catch (e: any) {
        setError(e.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const line = useMemo(
    () => candles.map(c => ({ time: c.time, value: c.close })),
    [candles]
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <header className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">TSLA • Last 6 months</h1>
        <div className="ml-auto text-sm text-white/60">
          {loading ? "Loading…" : error ? `Error: ${error}` : `${candles.length} pts`}
        </div>
      </header>

      <LineChart data={line} />
    </div>
  );
}
