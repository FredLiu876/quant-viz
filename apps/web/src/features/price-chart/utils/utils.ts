import type { UTCTimestamp } from "lightweight-charts";

export type InputPoint = { time: string | number; value: number };
export const rangeLabel: Record<number, string> = {
  1: "Last 1 month",
  3: "Last 3 months",
  6: "Last 6 months",
  12: "Last 1 year",
  0: "All time",
};

export const rangeButtonKeyValues = [
  { label: "1M", value: 1 },
  { label: "3M", value: 3 },
  { label: "6M", value: 6 },
  { label: "1Y", value: 12 },
  { label: "5Y", value: 60 },
  { label: "ALL", value: 0 },
];

export const granularityButtonKeyValues = [
//   { label: "1m", value: "1m" }, Only 8 days allowed
//   { label: "5m", value: "5m" },
//   { label: "15m", value: "15m" },
//   { label: "30m", value: "30m" },
//   { label: "60m", value: "60m" },
//   { label: "90m", value: "90m" },
  { label: "1d", value: "1d" },
  { label: "1wk", value: "1wk" },
  { label: "1mo", value: "1mo" },
];

// ---- time helpers
export const toUTCTS = (secs: number) => secs as UTCTimestamp;

export const asUnixSeconds = (t: string | number) =>
  typeof t === "number" ? t : Math.floor(Date.parse(`${t}T00:00:00Z`) / 1000);
