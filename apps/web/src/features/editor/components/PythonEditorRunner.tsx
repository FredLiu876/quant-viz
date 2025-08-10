// The Run button is a no-op for now.

import { useCallback, useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python as pythonLang } from "@codemirror/lang-python";
import { Play, Code2 } from "lucide-react";
import { tokyoNight } from "@uiw/codemirror-theme-tokyo-night";
import { DEFAULT_CODE } from "../utils/utils";

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

  const onRun = useCallback(() => {
    // No-op for now — wire this to your API later
    console.log("Run clicked (no-op)", { code });
  }, [code]);

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
        // Light
        "bg-white border-slate-200 text-slate-900",
        // Dark
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
        <button
          type="button"
          onClick={onRun}
          className={[
            "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
            // Light button
            "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600/20 hover:bg-indigo-700",
            // Dark tweaks
            "dark:bg-indigo-500 dark:ring-indigo-400/20 dark:hover:bg-indigo-400",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
          ].join(" ")}
        >
          <Play className="h-4 w-4" /> Run
        </button>
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
          Tip: Press ⌘/Ctrl+Enter to run (once wired up).
        </p>
      </div>
    </div>
  );
}
