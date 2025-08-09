// If you’re on Next.js app router, consider: "use client";
import { useEffect, useRef } from "react";
import { createChart, LineSeries } from "lightweight-charts";
import type { IChartApi, ISeriesApi } from "lightweight-charts";

type Point = { time: string; value: number };

export default function LineChart({ data }: { data: Point[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height: 520,
      layout: { background: { color: "#0b0f14" }, textColor: "#9CA3AF" },
      grid: { vertLines: { color: "#111827" }, horzLines: { color: "#111827" } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });
    chartRef.current = chart;

    const line = chart.addSeries(LineSeries, {
      color: "#3b82f6",
      lineWidth: 2,
      priceScaleId: "right",
    });
    lineRef.current = line;

    return () => chart.remove();
  }, []);

  useEffect(() => {
    if (lineRef.current) {
      lineRef.current.setData(data ?? []);
    }
  }, [data]);

  return (
    <div className="rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,.25)] overflow-hidden">
      <div ref={containerRef} />
    </div>
  );
}
