export type Candle = {
  time: string;  // 'YYYY-MM-DD' UTC
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};