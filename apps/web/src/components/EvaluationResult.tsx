import { useState } from "react";
import type { EvaluationApiResponse, RankingItem } from "../types";

interface Props {
  data: EvaluationApiResponse;
}

function PercentBar({ value, color = "brand" }: { value: number; color?: string }) {
  const v = Math.max(0, Math.min(100, value));
  const colorMap: Record<string, string> = {
    brand: "bg-brand-600",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };
  const cls = colorMap[color] ?? colorMap.brand;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${cls}`} style={{ width: `${v}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-medium text-slate-600">{v}%</span>
    </div>
  );
}

function SupplierBlock({ item }: { item: RankingItem }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-base font-semibold text-slate-800">
          #{item.rank} — {item.supplierName}
        </h4>
        {item.recommended && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            Recommended
          </span>
        )}
      </div>
      <p className="mb-3 text-sm text-slate-600">{item.shortReason}</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <h5 className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Strengths
          </h5>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-slate-700">
            {item.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Weaknesses
          </h5>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-slate-700">
            {item.weaknesses.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
      {item.riskFlags.length > 0 && (
        <div className="mt-3 rounded-md border border-red-100 bg-red-50 p-3">
          <h5 className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-700">
            Risk flags
          </h5>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-red-800">
            {item.riskFlags.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function EvaluationResult({ data }: Props) {
  const [showRaw, setShowRaw] = useState(false);
  const { result } = data;
  const best = result.ranking.find((r) => r.recommended) ?? result.ranking[0];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-md">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
          🏆 Best Supplier
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{result.bestSupplier}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          <div>
            <span className="text-xs text-slate-500">Overall</span>
            <PercentBar value={best.overallScorePercent} color="emerald" />
          </div>
          <div>
            <span className="text-xs text-slate-500">Compliance</span>
            <PercentBar value={best.proposalCompliancePercent} />
          </div>
          <div>
            <span className="text-xs text-slate-500">Technical</span>
            <PercentBar value={best.technicalFitPercent} />
          </div>
          <div>
            <span className="text-xs text-slate-500">Commercial</span>
            <PercentBar value={best.commercialFitPercent} />
          </div>
          <div>
            <span className="text-xs text-slate-500">Risk</span>
            <PercentBar value={best.riskScorePercent} color="red" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-lg font-semibold text-slate-800">Overall Summary</h3>
        <p className="text-sm leading-relaxed text-slate-700">{result.overallSummary}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <h3 className="border-b border-slate-200 px-6 py-4 text-lg font-semibold text-slate-800">
          Supplier Ranking
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Supplier</th>
                <th className="px-4 py-2 text-left">Overall</th>
                <th className="px-4 py-2 text-left">Compliance</th>
                <th className="px-4 py-2 text-left">Technical</th>
                <th className="px-4 py-2 text-left">Commercial</th>
                <th className="px-4 py-2 text-left">Risk</th>
                <th className="px-4 py-2 text-left">Recommended</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.ranking.map((r) => (
                <tr key={r.supplierName} className={r.recommended ? "bg-emerald-50/40" : ""}>
                  <td className="px-4 py-2 font-semibold">{r.rank}</td>
                  <td className="px-4 py-2 font-medium text-slate-800">{r.supplierName}</td>
                  <td className="w-40 px-4 py-2"><PercentBar value={r.overallScorePercent} color="emerald" /></td>
                  <td className="w-40 px-4 py-2"><PercentBar value={r.proposalCompliancePercent} /></td>
                  <td className="w-40 px-4 py-2"><PercentBar value={r.technicalFitPercent} /></td>
                  <td className="w-40 px-4 py-2"><PercentBar value={r.commercialFitPercent} /></td>
                  <td className="w-40 px-4 py-2"><PercentBar value={r.riskScorePercent} color="red" /></td>
                  <td className="px-4 py-2">{r.recommended ? "✅" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        {result.ranking.map((item) => (
          <SupplierBlock key={item.supplierName} item={item} />
        ))}
      </div>

      {(result.missingInformation.length > 0 || result.decisionNotes.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {result.missingInformation.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="mb-2 text-sm font-semibold text-amber-800">
                Missing Information
              </h3>
              <ul className="list-inside list-disc text-sm text-amber-900">
                {result.missingInformation.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          {result.decisionNotes.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-slate-800">
                Decision Notes
              </h3>
              <ul className="list-inside list-disc text-sm text-slate-700">
                {result.decisionNotes.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <strong>Disclaimer:</strong> {result.disclaimer}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          {showRaw ? "Hide" : "Show"} raw JSON
        </button>
        {showRaw && (
          <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-slate-900 p-4 text-xs text-slate-100">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
