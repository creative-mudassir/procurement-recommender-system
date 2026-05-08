import axios, { AxiosError } from "axios";
import type { ApiErrorBody, EvaluationApiResponse, Supplier } from "../types";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 180_000,
});

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await api.get("/api/health");
    return res.data?.ok === true;
  } catch {
    return false;
  }
}

export async function runEvaluation(input: {
  tenderTitle: string;
  tenderFile: File;
  suppliers: Supplier[];
}): Promise<EvaluationApiResponse> {
  const fd = new FormData();
  fd.append("tenderTitle", input.tenderTitle);
  fd.append(
    "suppliersJson",
    JSON.stringify(input.suppliers.map((s) => ({ id: s.id, companyName: s.companyName }))),
  );

  // Snapshot files into memory before starting the upload so the request does
  // not depend on the browser streaming directly from the original local file
  // handles.
  const tenderBytes = await input.tenderFile.arrayBuffer();
  fd.append(
    "tenderFile",
    new Blob([tenderBytes], { type: input.tenderFile.type || "application/octet-stream" }),
    input.tenderFile.name,
  );

  await Promise.all(
    input.suppliers.flatMap((supplier) =>
      supplier.files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        fd.append(
          `supplierFiles_${supplier.id}`,
          new Blob([bytes], { type: file.type || "application/octet-stream" }),
          file.name,
        );
      }),
    ),
  );

  try {
    const res = await api.post<EvaluationApiResponse>("/api/evaluations/run", fd);
    return res.data;
  } catch (err) {
    const axErr = err as AxiosError<ApiErrorBody>;
    const message =
      axErr.response?.data?.error?.message ??
      axErr.message ??
      "Unknown error while running evaluation.";
    throw new Error(message);
  }
}
