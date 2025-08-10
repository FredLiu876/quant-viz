export type Candle = {
  time: string;  // 'YYYY-MM-DD' UTC
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type RunRequest = {
  code: string;
  stdin?: string;
  timeoutMs?: number;
};

export type RunResult = {
  timedOut: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
};
