import type { Supplier } from "../types";
import { SupplierCard } from "./SupplierCard";

interface Props {
  suppliers: Supplier[];
  onChange: (next: Supplier[]) => void;
}

let counter = 0;
function makeId(): string {
  counter += 1;
  return `supplier-${Date.now().toString(36)}-${counter}`;
}

export function SupplierForm({ suppliers, onChange }: Props) {
  const addSupplier = () => {
    onChange([...suppliers, { id: makeId(), companyName: "", files: [] }]);
  };
  const updateSupplier = (idx: number, next: Supplier) => {
    const arr = suppliers.slice();
    arr[idx] = next;
    onChange(arr);
  };
  const removeSupplier = (idx: number) => {
    onChange(suppliers.filter((_, i) => i !== idx));
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          2. Suppliers ({suppliers.length})
        </h2>
        <button
          type="button"
          onClick={addSupplier}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
        >
          + Add Supplier
        </button>
      </div>
      {suppliers.length === 0 && (
        <p className="text-sm text-slate-500">
          No suppliers yet. Add at least 2 suppliers to compare.
        </p>
      )}
      <div className="space-y-3">
        {suppliers.map((s, idx) => (
          <SupplierCard
            key={s.id}
            index={idx}
            supplier={s}
            onChange={(next) => updateSupplier(idx, next)}
            onRemove={() => removeSupplier(idx)}
            removable={suppliers.length > 1}
          />
        ))}
      </div>
    </section>
  );
}
