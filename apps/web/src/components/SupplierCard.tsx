import type { Supplier } from "../types";

interface Props {
  supplier: Supplier;
  index: number;
  onChange: (next: Supplier) => void;
  onRemove: () => void;
  removable: boolean;
}

export function SupplierCard({
  supplier,
  index,
  onChange,
  onRemove,
  removable,
}: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          Supplier #{index + 1}
        </h3>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            Remove
          </button>
        )}
      </div>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Company name
          </label>
          <input
            type="text"
            value={supplier.companyName}
            onChange={(e) =>
              onChange({ ...supplier, companyName: e.target.value })
            }
            placeholder="e.g., Acme Solutions Ltd"
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Proposal file(s) (PDF, DOCX, TXT). You can upload multiple.
          </label>
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(e) => {
              const list = e.target.files;
              if (!list) return;
              onChange({ ...supplier, files: Array.from(list) });
            }}
            className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-300"
          />
          {supplier.files.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
              {supplier.files.map((f) => (
                <li key={f.name + f.size}>
                  {f.name} ({(f.size / 1024).toFixed(1)} KB)
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
