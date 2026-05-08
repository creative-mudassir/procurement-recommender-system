import { useState } from "react";
import { runEvaluation } from "../api/client";
import { ErrorBox } from "../components/ErrorBox";
import { EvaluationResult } from "../components/EvaluationResult";
import { LoadingState } from "../components/LoadingState";
import { SupplierForm } from "../components/SupplierForm";
import { TenderUpload } from "../components/TenderUpload";
import type { EvaluationApiResponse, Supplier } from "../types";

let idCounter = 0;
const makeId = () => {
  idCounter += 1;
  return `supplier-${Date.now().toString(36)}-${idCounter}`;
};

const initialSuppliers: Supplier[] = [
  { id: makeId(), companyName: "", files: [] },
  { id: makeId(), companyName: "", files: [] },
];

export function HomePage() {
  const [tenderTitle, setTenderTitle] = useState("");
  const [tenderFile, setTenderFile] = useState<File | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [loadingStep, setLoadingStep] =
    useState<"extracting" | "gemini" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationApiResponse | null>(null);

  function validate(): string | null {
    if (!tenderTitle.trim()) return "Please enter a tender title.";
    if (!tenderFile) return "Please upload a tender contract file.";
    if (suppliers.length < 2) return "Please add at least 2 suppliers.";
    for (const s of suppliers) {
      if (!s.companyName.trim()) {
        return "Every supplier needs a company name.";
      }
      if (!s.files || s.files.length === 0) {
        return `Supplier "${s.companyName}" needs at least one proposal file.`;
      }
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    try {
      setLoadingStep("extracting");
      // Animate step transitions while the request runs.
      const geminiTimer = setTimeout(() => setLoadingStep("gemini"), 1500);
      const response = await runEvaluation({
        tenderTitle,
        tenderFile: tenderFile!,
        suppliers,
      });
      clearTimeout(geminiTimer);
      setResult(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingStep(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Tender Supplier Evaluation AI
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload a tender contract and supplier proposals. Gemini evaluates
          proposal quality and fit to recommend the best supplier with
          transparent percentage scoring.
        </p>
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          ⚠️ AI evaluation is decision support only. Final procurement decision
          should be reviewed by a human.
        </div>
      </header>

      <form className="space-y-6" onSubmit={onSubmit}>
        <TenderUpload
          tenderTitle={tenderTitle}
          onTitleChange={setTenderTitle}
          tenderFile={tenderFile}
          onFileChange={setTenderFile}
        />

        <SupplierForm suppliers={suppliers} onChange={setSuppliers} />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loadingStep !== null}
            className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loadingStep ? "Evaluating..." : "Evaluate Suppliers"}
          </button>
          <span className="text-xs text-slate-500">
            All processing happens via the local API. Gemini is called server-side only.
          </span>
        </div>

        {error && <ErrorBox message={error} onClose={() => setError(null)} />}
        <LoadingState step={loadingStep} />
      </form>

      {result && (
        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900">
            Evaluation Result
          </h2>
          <EvaluationResult data={result} />
        </section>
      )}

      <footer className="mt-12 border-t border-slate-200 pt-4 text-xs text-slate-500">
        Tender Supplier Evaluation AI · Single-user prototype · Local SQLite
        storage
      </footer>
    </div>
  );
}
