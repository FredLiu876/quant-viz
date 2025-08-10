import React from "react";

interface StockSelectorProps {
  symbol: string;
  setSymbol: (s: string) => void;
  search: string;
  setSearch: (s: string) => void;
  stocks: string[];
}

const StockSelector: React.FC<StockSelectorProps> = ({
  symbol,
  setSymbol,
  search,
  setSearch,
  stocks,
}) => {
  const [open, setOpen] = React.useState(false);
  const [highlighted, setHighlighted] = React.useState<number>(-1);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const listboxId = React.useId();

  const query = search?.toUpperCase?.() ?? "";

  const options = React.useMemo(() => {
    if (!query) return [] as string[];
    const q = query.trim();
    if (!q) return [] as string[];
    // Case-insensitive contains match; unique; top 8
    const seen = new Set<string>();
    const filtered = [] as string[];
    for (const s of stocks) {
      const up = s.toUpperCase();
      if (up.includes(q) && !seen.has(up)) {
        seen.add(up);
        filtered.push(s);
        if (filtered.length >= 8) break;
      }
    }
    return filtered;
  }, [query, stocks]);

  // Open/close behavior
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHighlighted(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  React.useEffect(() => {
    // When query changes, reset highlight; open if there's something to show
    setHighlighted(options.length ? 0 : -1);
    setOpen(Boolean(query));
  }, [query, options.length]);

  const choose = (val: string) => {
    const up = val.toUpperCase();
    setSearch(up);
    setSymbol(up);
    setOpen(false);
    setHighlighted(-1);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open && options.length) setOpen(true);
      if (options.length) {
        setHighlighted((h) => (h + 1) % options.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (options.length) {
        setHighlighted((h) => (h - 1 + options.length) % options.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && highlighted >= 0 && highlighted < options.length) {
        choose(options[highlighted]);
      } else if (query) {
        // Search on its own even if no dropdown results
        choose(query);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full max-w-sm">
      {/* Input shell */}
      <div className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0e1117] text-white shadow-sm transition focus-within:border-blue-400/50 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.3)]">
        {/* Search icon */}
        <div className="pl-3 pr-1 opacity-60 group-focus-within:opacity-100 transition" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value.toUpperCase())}
          onFocus={() => setOpen(Boolean(query))}
          onKeyDown={onKeyDown}
          placeholder="Search symbol..."
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open}
          role="combobox"
          className="w-full bg-transparent px-1 py-2 pr-10 text-sm font-mono uppercase tracking-wide placeholder-white/40 outline-none"
        />
        {/* Clear / Go actions */}
        {query ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setOpen(false);
              setHighlighted(-1);
              inputRef.current?.focus();
            }}
            className="mr-1 inline-flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-[.98]"
            aria-label="Clear"
            title="Clear"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => (query ? choose(query) : inputRef.current?.focus())}
            className="mr-1 inline-flex h-7 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 text-xs hover:bg-white/10 active:scale-[.98]"
            title="Search"
          >
            Enter
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0e1117] shadow-2xl"
        >
          {options.length > 0 ? (
            <ul className="max-h-64 overflow-auto py-1">
              {options.map((opt, idx) => {
                const active = idx === highlighted;
                return (
                  <li key={opt} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlighted(idx)}
                      onClick={() => choose(opt)}
                      className={
                        "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition " +
                        (active ? "bg-white/10" : "hover:bg-white/5")
                      }
                    >
                      <span className="font-mono uppercase tracking-wide">{opt}</span>
                      <span className="text-[10px] uppercase opacity-60">Select</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-3 py-3 text-sm text-white/70">
              <div className="mb-1">No matches.</div>
              {query && (
                <button
                  type="button"
                  onClick={() => choose(query)}
                  className="mt-1 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                >
                  Press Enter (or click) to search for
                  <span className="font-mono uppercase tracking-wide">{query}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StockSelector;
