// SQLite handle. We open the database lazily so tests can use an in-memory DB.
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let cached: Database.Database | null = null;

export function getDb(): Database.Database {
  if (cached) return cached;
  const dbPath = process.env.SQLITE_PATH ?? path.resolve(process.cwd(), "data.sqlite");
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  // Run schema
  const schemaPath = path.resolve(__dirname, "schema.sql");
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    db.exec(schemaSql);
  } else {
    // Fallback inline schema if compiled output excludes the .sql file
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        tender_title TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        company_name TEXT NOT NULL,
        proposal_text TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS evaluations (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        result_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }

  cached = db;
  return db;
}

export function resetDbForTests(): void {
  if (cached) {
    cached.close();
    cached = null;
  }
}
