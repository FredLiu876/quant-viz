type ButtonGroupItem<T extends string | number> = { label: string; value: T };

export default function ButtonGroup<T extends string | number>({
  value,
  onChange,
  items,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  items: ButtonGroupItem<T>[];
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
            key={String(it.value)}
            type="button"
            onClick={() => onChange(it.value)}
            aria-pressed={selected}
            className={[
              "px-3 py-1.5 text-sm font-medium rounded-lg transition",
              selected ? "bg-white/10 text-white shadow-inner" : "text-gray-300 hover:bg-white/5",
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
