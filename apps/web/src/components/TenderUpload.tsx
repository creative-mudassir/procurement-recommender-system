interface Props {
  tenderTitle: string;
  onTitleChange: (title: string) => void;
  tenderFile: File | null;
  onFileChange: (file: File | null) => void;
}

export function TenderUpload({
  tenderTitle,
  onTitleChange,
  tenderFile,
  onFileChange,
}: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">
        1. Tender Contract
      </h2>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="tender-title"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Tender title
          </label>
          <input
            id="tender-title"
            type="text"
            value={tenderTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., IT Infrastructure Modernization 2025"
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div>
          <label
            htmlFor="tender-file"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Tender contract file (PDF, DOCX, TXT)
          </label>
          <input
            id="tender-file"
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
          />
          {tenderFile && (
            <p className="mt-1 text-xs text-slate-500">
              Selected: <span className="font-medium">{tenderFile.name}</span> (
              {(tenderFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
