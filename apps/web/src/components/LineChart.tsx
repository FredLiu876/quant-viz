// "use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, LineSeries } from "lightweight-charts";
import type {
  IChartApi,
  ISeriesApi,
  LineData,
  UTCTimestamp,
} from "lightweight-charts";

type InputPoint = { time: string | number; value: number };
type RangeKey = "1M" | "3M" | "6M" | "1Y" | "ALL";
type Granularity = "D" | "W";

const RANGE_WINDOWS: Record<RangeKey, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  "ALL": Infinity,
};

// ---- time helpers
const toUTCTS = (secs: number) => secs as UTCTimestamp;
const asUnixSeconds = (t: string | number) =>
  typeof t === "number"
    ? t
    : Math.floor(Date.parse(`${t}T00:00:00Z`) / 1000);
const floorToDay = (ts: number) => {
  const d = new Date(ts * 1000);
  d.setUTCHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
};
const startOfISOWeek = (ts: number) => {
  const d = new Date(ts * 1000);
  const day = d.getUTCDay() || 7; // Mon=1..Sun=7
  d.setUTCDate(d.getUTCDate() - (day - 1));
  d.setUTCHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
};

// ---- shaping
function sliceRange(points: InputPoint[], range: RangeKey): InputPoint[] {
  if (range === "ALL" || points.length === 0) return points;
  const lastTs = asUnixSeconds(points[points.length - 1].time);
  const cutoff = lastTs - RANGE_WINDOWS[range] * 24 * 3600;
  return points.filter((p) => asUnixSeconds(p.time) >= cutoff);
}

function aggregate(
  points: InputPoint[],
  granularity: Granularity
): LineData<UTCTimestamp>[] {
  if (!points.length) return [];
  const buckets = new Map<number, { sum: number; count: number }>();
  for (const p of points) {
    const ts = asUnixSeconds(p.time);
    const key = granularity === "D" ? floorToDay(ts) : startOfISOWeek(ts);
    const b = buckets.get(key) ?? { sum: 0, count: 0 };
    b.sum += p.value;
    b.count += 1;
    buckets.set(key, b);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([k, { sum, count }]) => ({ time: toUTCTS(k), value: sum / count }));
}

// ---- UI bits
function ButtonGroup<T extends string>({
  value,
  onChange,
  items,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { label: string; value: T }[];
  ariaLabel: string;
}) {
  return (
    <div
      className="inline-flex rounded-xl bg-white/5 p-1 ring-1 ring-white/10"
      role="group"
      aria-label={ariaLabel}
    >
      {items.map((it, i) => {
        const selected = value === it.value;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            aria-pressed={selected}
            className={[
              "px-3 py-1.5 text-sm font-medium rounded-lg transition",
              selected
                ? "bg-white/10 text-white shadow-inner"
                : "text-gray-300 hover:bg-white/5",
              i === 0 ? "ml-0" : "ml-1",
            ].join(" ")}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PriceChart({
  symbol = "TSLA",
  data,
}: {
  symbol?: string;
  data: InputPoint[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  const [range, setRange] = useState<RangeKey>("6M");
  const [granularity, setGranularity] = useState<Granularity>("D");

  const prepared = useMemo<LineData<UTCTimestamp>[]>(() => {
    const sliced = sliceRange(data, range);
    return aggregate(sliced, granularity);
  }, [data, range, granularity]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: { background: { color: "#0b0f14" }, textColor: "#9CA3AF" },
      grid: { vertLines: { color: "#111827" }, horzLines: { color: "#111827" } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true },
      height: el.clientHeight || 520,
    });
    chartRef.current = chart;

    const series = chart.addSeries(LineSeries, {
      color: "#3b82f6",
      lineWidth: 2,
      priceScaleId: "right",
    });
    seriesRef.current = series;

    // responsive sizing
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      chart.applyOptions({ width, height });
    });
    ro.observe(el);
    roRef.current = ro;

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(prepared);
    chartRef.current?.timeScale().fitContent();
  }, [prepared]);

  const rangeLabel: Record<RangeKey, string> = {
    "1M": "Last 1 month",
    "3M": "Last 3 months",
    "6M": "Last 6 months",
    "1Y": "Last 1 year",
    "ALL": "All time",
  };

  return (
    <section className="w-full">
      {/* Header + Controls */}
      <header className="mb-4 flex w-full flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          {symbol} <span className="text-gray-400">• {rangeLabel[range]}</span>
        </h1>

        <div className="flex items-center gap-2">
          <ButtonGroup<RangeKey>
            ariaLabel="Select time range"
            value={range}
            onChange={setRange}
            items={[
              { label: "1M", value: "1M" },
              { label: "3M", value: "3M" },
              { label: "6M", value: "6M" },
              { label: "1Y", value: "1Y" },
              { label: "ALL", value: "ALL" },
            ]}
          />
          <ButtonGroup<Granularity>
            ariaLabel="Select granularity"
            value={granularity}
            onChange={setGranularity}
            items={[
              { label: "Daily", value: "D" },
              { label: "Weekly", value: "W" },
            ]}
          />
        </div>
      </header>

      {/* Chart */}
      <div className="w-full rounded-2xl border border-white/10 bg-[#0b0f14] shadow-[0_10px_30px_rgba(0,0,0,.25)]">
        <div ref={containerRef} className="h-[420px] sm:h-[520px] w-full" />
      </div>
    </section>
  );
}
