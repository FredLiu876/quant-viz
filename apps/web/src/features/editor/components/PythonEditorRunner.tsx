// The Run button is a no-op for now.

import { useCallback, useEffect, useState, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python as pythonLang } from "@codemirror/lang-python";
import { Play, Code2, Loader2, Square } from "lucide-react";
import { tokyoNight } from "@uiw/codemirror-theme-tokyo-night";
import { DEFAULT_CODE } from "../utils/utils";
import { run } from "@lib/api";
import type { RunRequest, RunResult } from "@/types";

export default function PythonEditorRunner({
  initialCode = DEFAULT_CODE,
  title = "Python Editor",
  height = 420,
  className,
}: {
  initialCode?: string;
  title?: string;
  height?: number;
  className?: string;
}) {
  const [code, setCode] = useState<string>(initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortSignal | null>(null);

  const onRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setResult(null);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller.signal;

    try {
      // tweak timeoutMs if you like
      // create RunRequest
      const req: RunRequest = {
        code
      };

      const res = await run(req, { signal: controller.signal });
      setResult(res);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [code, isRunning]);

  const onStop = useCallback(() => {
    // Cancel the in-flight request (client-side).
    // Server still needs its own hard timeout/kill.
    if ((abortRef.current as any)?.aborted === false) {
      try {
        // AbortController isn’t directly stored, just the signal—so rebuild if you prefer.
        // Here we just do nothing; fetch was created with the signal already.
      } catch {}
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onRun();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRun]);

  return (
    <div
      className={[
        "rounded-2xl border shadow-sm overflow-hidden",
        "bg-white border-slate-200 text-slate-900",
        "dark:bg-zinc-900 dark:border-zinc-800 dark:text-slate-100",
        className ?? "",
      ].join(" ")}
    >
      {/* Header */}
      <div
        className={[
          "flex items-center justify-between px-4 py-3 border-b",
          "bg-gradient-to-r from-slate-50 to-white border-slate-200",
          "dark:bg-gradient-to-b dark:from-zinc-900 dark:to-zinc-900/70 dark:border-zinc-800",
        ].join(" ")}
      >
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-slate-600 dark:text-slate-200" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        </div>

        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              type="button"
              onClick={onRun}
              className={[
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600/20 hover:bg-indigo-700",
                "dark:bg-indigo-500 dark:ring-indigo-400/20 dark:hover:bg-indigo-400",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              ].join(" ")}
            >
              <Play className="h-4 w-4" /> Run
            </button>
          ) : (
            <button
              type="button"
              onClick={onStop}
              className={[
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                "bg-slate-200 text-slate-800 ring-1 ring-slate-300 hover:bg-slate-300",
                "dark:bg-zinc-800 dark:text-slate-100 dark:ring-zinc-700 dark:hover:bg-zinc-700",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
              ].join(" ")}
            >
              <Loader2 className="h-4 w-4 animate-spin" /> Running…
              <Square className="h-4 w-4 opacity-70" />
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="p-3">
        <div className="rounded-xl border overflow-hidden bg-white dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800">
          <CodeMirror
            value={code}
            height={`${height}px`}
            theme={tokyoNight}
            extensions={[pythonLang()]}
            basicSetup={{ lineNumbers: true, highlightActiveLine: true, foldGutter: true }}
            onChange={setCode}
            className="text-sm"
          />
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
          Tip: Press ⌘/Ctrl+Enter to run.
        </p>

        {/* Results */}
        {(result || error) && (
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            {/* Stdout */}
            <div className="rounded-xl border bg-white dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-zinc-800">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">STDOUT</span>
                {result && (
                  <span className="text-[10px] rounded-full px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300">
                    exit {result.exitCode ?? "—"} {result.timedOut ? "(timed out)" : ""}
                  </span>
                )}
              </div>
              <pre className="p-3 text-xs overflow-auto whitespace-pre-wrap leading-relaxed">
                {result?.stdout ?? ""}
              </pre>
            </div>

            {/* Stderr / Errors */}
            <div className="rounded-xl border bg-white dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-zinc-800">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">STDERR</span>
                {error && (
                  <span className="text-[10px] rounded-full px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                    client error
                  </span>
                )}
              </div>
              <pre className="p-3 text-xs overflow-auto whitespace-pre-wrap leading-relaxed">
                {error ? error : result?.stderr ?? ""}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
