// Thin repository layer wrapping prepared statements.
import { v4 as uuid } from "uuid";
import { getDb } from "./db";

export interface ProjectRow {
  id: string;
  tender_title: string;
  created_at: string;
}
export interface SupplierRow {
  id: string;
  project_id: string;
  company_name: string;
  proposal_text: string | null;
  created_at: string;
}
export interface EvaluationRow {
  id: string;
  project_id: string;
  result_json: string;
  created_at: string;
}

export const projectsRepo = {
  create(tenderTitle: string): ProjectRow {
    const db = getDb();
    const row: ProjectRow = {
      id: uuid(),
      tender_title: tenderTitle,
      created_at: new Date().toISOString(),
    };
    db.prepare(
      "INSERT INTO projects (id, tender_title, created_at) VALUES (?, ?, ?)",
    ).run(row.id, row.tender_title, row.created_at);
    return row;
  },
};

export const suppliersRepo = {
  create(input: {
    projectId: string;
    companyName: string;
    proposalText: string | null;
  }): SupplierRow {
    const db = getDb();
    const row: SupplierRow = {
      id: uuid(),
      project_id: input.projectId,
      company_name: input.companyName,
      proposal_text: input.proposalText,
      created_at: new Date().toISOString(),
    };
    db.prepare(
      `INSERT INTO suppliers
        (id, project_id, company_name, proposal_text, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      row.id,
      row.project_id,
      row.company_name,
      row.proposal_text,
      row.created_at,
    );
    return row;
  },
};

export const evaluationsRepo = {
  create(projectId: string, resultJson: string): EvaluationRow {
    const db = getDb();
    const row: EvaluationRow = {
      id: uuid(),
      project_id: projectId,
      result_json: resultJson,
      created_at: new Date().toISOString(),
    };
    db.prepare(
      `INSERT INTO evaluations (id, project_id, result_json, created_at)
       VALUES (?, ?, ?, ?)`,
    ).run(row.id, row.project_id, row.result_json, row.created_at);
    return row;
  },
};
