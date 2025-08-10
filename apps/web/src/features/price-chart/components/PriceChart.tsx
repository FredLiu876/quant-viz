// "use client";
import { useEffect, useState } from "react";
import type { LineData, UTCTimestamp } from "lightweight-charts";
import type { Candle } from "@/types"
import ButtonGroup from "@components/ButtonGroup";
import PriceChartView from "./PriceChartView";
import SearchDropdown from "@components/SearchDropdown";
import {
  toUTCTS,
  asUnixSeconds,
  rangeLabel,
  rangeButtonKeyValues,
  granularityButtonKeyValues
} from "../utils/utils";

import { fetchCandles } from "@/lib/api";

const STOCKS = ["TSLA", "AAPL", "MSFT", "GOOG", "AMZN", "NVDA", "META", "NFLX", "AMD", "INTC"];

export default function PriceChart() {
  const [symbol, setSymbol] = useState<string>("TSLA");
  const [search, setSearch] = useState<string>("");
  const [range, setRange] = useState<number>(6);
  const [granularity, setGranularity] = useState<string>("1d");

  const [candles, setCandles] = useState<Candle[] | null>(null);
  const [series, setSeries] = useState<LineData<UTCTimestamp>[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch when dependencies change
  useEffect(() => {
    let aborted = false;
    const ctrl = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCandles(symbol, range, granularity);
        if (aborted) return;
        setCandles(data);
      } catch (e: any) {
        if (aborted) return;
        setError(e?.message ?? "Failed to load candles");
        setCandles(null);
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    load();
    return () => {
      aborted = true;
      ctrl.abort();
    };
  }, [symbol, range, granularity]);

  // Transform candles -> line series (close price)
  useEffect(() => {
    if (!candles || candles.length === 0) {
      setSeries([]);
      return;
    }
    const s: LineData<UTCTimestamp>[] = candles
      .map((c) => {
        // Handle number (unix seconds) or ISO date strings
        const ts =
          typeof (c as any).time === "number"
            ? (c as any).time
            : asUnixSeconds((c as any).time);
        const close = (c as any).close ?? (c as any).value;
        return {
          time: toUTCTS(ts),
          value: close,
        };
      })
      .filter((d) => Number.isFinite(d.value))
      // ensure ascending time
      .sort((a, b) => (a.time as number) - (b.time as number));

    setSeries(s);
  }, [candles]);

  return (
    <section className="w-full">
      <div style={{ minHeight: 56 }}>
        {loading && (
          <div className="p-4 text-sm text-gray-300">Loading…</div>
        )}
      </div>

      {/* Header + Controls */}
      <header className="mb-4 flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <SearchDropdown
            setValue={setSymbol}
            search={search}
            setSearch={setSearch}
            options={STOCKS}
          />
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            {symbol} <span className="text-gray-400">• {rangeLabel[range]}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <ButtonGroup<number>
            ariaLabel="Select time range"
            value={range}
            onChange={setRange}
            items={rangeButtonKeyValues}
          />
          <ButtonGroup<string>
            ariaLabel="Select granularity"
            value={granularity}
            onChange={setGranularity}
            items={granularityButtonKeyValues}
          />
        </div>
      </header>

      {/* Chart container */}
      <div className="w-full rounded-2xl border border-white/10 bg-[#0b0f14] shadow-[0_10px_30px_rgba(0,0,0,.25)]">
          {error ? (
            <div className="p-6 text-sm text-red-300">{error}</div>
          ) : (
            <>
              <PriceChartView data={series} className="h-[420px] sm:h-[520px]" />
            </>
          )}
      </div>
    </section>
  );
}
