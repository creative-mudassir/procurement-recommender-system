interface Props {
  step: "extracting" | "gemini" | null;
}

const steps = [
  { key: "extracting", label: "Extracting documents" },
  { key: "gemini", label: "Evaluating with Gemini" },
] as const;

export function LoadingState({ step }: Props) {
  if (!step) return null;
  const activeIndex = steps.findIndex((s) => s.key === step);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-3 w-3 animate-pulse rounded-full bg-brand-600" />
        <h3 className="text-sm font-semibold text-slate-700">
          Running evaluation...
        </h3>
      </div>
      <ol className="space-y-2 text-sm">
        {steps.map((s, idx) => {
          const status =
            idx < activeIndex ? "done" : idx === activeIndex ? "active" : "pending";
          return (
            <li key={s.key} className="flex items-center gap-3">
              <span
                className={
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold " +
                  (status === "done"
                    ? "bg-emerald-100 text-emerald-700"
                    : status === "active"
                      ? "bg-brand-100 text-brand-700 animate-pulse"
                      : "bg-slate-100 text-slate-500")
                }
              >
                {status === "done" ? "✓" : idx + 1}
              </span>
              <span
                className={
                  status === "active"
                    ? "text-slate-900 font-medium"
                    : status === "done"
                      ? "text-slate-700"
                      : "text-slate-400"
                }
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
