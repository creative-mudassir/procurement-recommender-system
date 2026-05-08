# Tender Supplier Evaluation AI

A single-user web application that helps you evaluate supplier proposals
against a tender contract. The user uploads:

1. A **Tender Contract** document (PDF / DOCX / TXT)
2. **Multiple suppliers**, each with a company name and one or more proposal documents

The backend then:

- Extracts text from every uploaded document
- Searches **TED (EU Tenders) public data** for each supplier company's history
  (past contracts, awards, descriptions, award criteria, buyer names, CPV codes,
  values, countries, dates, notice IDs, links — whichever fields are returned)
- Builds a compact, structured context
- Calls **Google Gemini** with a strict evaluation system prompt and JSON schema
- Returns a percentage-wise scoring with strengths, weaknesses, risk flags, TED
  relevance and a final recommendation
- Persists projects, suppliers and evaluations to a local **SQLite** database

The frontend then displays a recommended supplier, ranking table, percentage
bars, reasons, TED history summaries and a raw-JSON debug toggle.

> ⚠️ **Disclaimer:** AI evaluation is decision support only. The final
> procurement decision must be reviewed by a human.

---

## Features

- 📄 PDF / DOCX / TXT extraction (via `pdf-parse` and `mammoth`)
- 🇪🇺 TED public-data search with POST + GET fallback and defensive normalization
- 🤖 Gemini structured-JSON output (with retry on invalid JSON)
- 🧪 Built-in **Mock Mode** that runs end-to-end without any API key
- 💾 SQLite persistence — no external database setup needed
- ✅ Vitest + Supertest backend tests for validation, document service and full route
- 🎨 Clean, modern Tailwind CSS UI

## Architecture

```
tender-supplier-evaluation-ai/
├── apps/
│   ├── api/         Node.js + Express + TypeScript backend
│   │   └── src/
│   │       ├── config/          env loader (dotenv)
│   │       ├── db/              SQLite (better-sqlite3) + repositories
│   │       ├── routes/          health, ted, evaluation
│   │       ├── services/        document / ted / gemini / scoring-context
│   │       ├── utils/           text helpers, errors, logger
│   │       └── validators/      zod schemas + Gemini JSON schema
│   └── web/         React + Vite + TS + Tailwind frontend
└── README.md
```

## Prerequisites

- Node.js **>= 18.17** (for the global `fetch` API used by the TED service)
- npm **>= 9**
- (Optional) A Gemini API key. Without it, the app runs in deterministic
  **Mock Mode**.

## Installation

```bash
git clone <this-repo> tender-supplier-evaluation-ai
cd tender-supplier-evaluation-ai
npm run install:all
```

## Environment setup

Copy the example env into the API package:

```bash
cp .env.example apps/api/.env
```

Edit `apps/api/.env`:

```
PORT=4000
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=mock          # set to your real key, or "mock" for offline mode
GEMINI_MODEL=gemini-2.5-flash
TED_API_BASE_URL=https://api.ted.europa.eu
TED_SEARCH_PATH=/v3/notices/search
MAX_UPLOAD_MB=20
MAX_GEMINI_CONTEXT_CHARS=120000
```

> **Important:**
> - `GEMINI_API_KEY` is read **only on the backend**. It is never exposed to the
>   frontend.
> - If `GEMINI_API_KEY` is missing or set to `mock` / `replace_me`, the backend
>   automatically returns a deterministic mock evaluation.
> - `TED_API_BASE_URL` and `TED_SEARCH_PATH` are configurable because the TED
>   API endpoint can change. If both POST and GET fail, the app continues with
>   `status: "unavailable"` instead of crashing.

## Run

In one shell run both servers:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:5173
```

## Build

```bash
npm run build
```

## Tests

```bash
npm run test
```

This runs the backend Vitest + Supertest suite covering:
- `GET /api/health`
- Unsupported file types
- Text normalization & truncation
- Validation errors (missing tender file, fewer than 2 suppliers, missing
  company name, missing proposal files)
- A full mocked evaluation flow

## API Endpoints

### `GET /api/health`
Returns:
```json
{ "ok": true, "service": "Tender Supplier Evaluation AI API" }
```

### `POST /api/ted/search`
Body:
```json
{ "companyName": "Example Supplier Ltd" }
```
Returns a normalized `TedSupplierHistory`.

### `POST /api/evaluations/run`
Multipart/form-data:
- `tenderTitle` — string
- `tenderFile` — file (PDF/DOCX/TXT)
- `suppliersJson` — JSON string array, e.g.
  ```json
  [
    { "id": "supplier-1", "companyName": "Alpha Ltd" },
    { "id": "supplier-2", "companyName": "Beta Ltd" }
  ]
  ```
- `supplierFiles_<id>` — one or more files per supplier (the field name
  encodes the supplier ID so multiple suppliers and multiple files per
  supplier are supported)

Response shape:
```json
{
  "projectId": "uuid",
  "evaluationId": "uuid",
  "tedHistories": [ { "companyName": "...", "status": "ok|not_found|unavailable", ... } ],
  "result": {
    "bestSupplier": "...",
    "overallSummary": "...",
    "ranking": [ { "rank": 1, "supplierName": "...", "overallScorePercent": 87, ... } ],
    "decisionNotes": [ "..." ],
    "missingInformation": [ "..." ],
    "disclaimer": "AI evaluation is decision support only. Final procurement decision should be reviewed by a human."
  }
}
```

Errors are returned in a consistent envelope:
```json
{ "error": { "message": "Human readable error", "code": "VALIDATION_ERROR", "details": {} } }
```

## Example usage flow

1. Open http://localhost:5173
2. Enter a tender title, e.g. `IT Infrastructure Modernization 2025`
3. Upload a tender contract document (you can paste the sample text below into a
   `.txt` file for quick testing)
4. Add at least 2 suppliers and upload a proposal file for each
5. Click **Evaluate Suppliers**
6. Review the recommendation, ranking table, strengths/weaknesses, risk flags,
   TED history summary, missing information, and decision notes

### Sample tender text (save as `tender.txt`)

```
Tender: IT Infrastructure Modernization 2025

Scope:
The contracting authority requires the modernization of its data center,
including server replacement, virtualization platform, network refresh,
and a 3-year managed services contract.

Requirements:
- ISO 27001 certified provider
- 24/7 support with 99.9% SLA
- Onsite engineers in the EU
- Migration without service interruption
- Documentation and training included

Award criteria:
- Technical solution quality (40%)
- Price (30%)
- Past relevant EU public-sector experience (20%)
- Project plan and risk management (10%)

Estimated value: EUR 1,200,000.
Submission deadline: 2025-09-30.
```

### Sample supplier proposal text

```
Acme Solutions Ltd — Proposal

We propose a fully redundant data center modernization based on
hyper-converged infrastructure with VMware vSphere and Cisco ACI.
We are ISO 27001 and ISO 9001 certified, and we deliver 24/7 NOC support
across EU with 99.95% SLA.

Our project plan covers a 6-month phased migration with no production
downtime, full documentation, and 5 days of onsite training.

Total price: EUR 1,150,000 (3-year managed services included).
References: 4 prior EU public-sector data center projects.
```

## TED API configuration note

The TED endpoint shape is not 100% stable across versions. The `ted.service.ts`
implementation:

1. Tries `POST {TED_API_BASE_URL}{TED_SEARCH_PATH}` with `{ query, page, limit }`
2. Falls back to `GET {...}?q=<companyName>&page=1&limit=10`
3. If both fail, returns `{ status: "unavailable", records: [], error: ... }`
   without crashing the rest of the evaluation
4. Normalizes records defensively against a wide set of possible field names

You can change `TED_API_BASE_URL` / `TED_SEARCH_PATH` in `.env` to adapt to the
current TED API version.

## Gemini API configuration note

- The backend uses `@google/genai` and the model name from `GEMINI_MODEL`.
- The Gemini call uses **structured output** with a strict JSON schema
  (`responseMimeType: "application/json"`, `responseSchema`).
- If Gemini returns invalid JSON, the backend retries once with a stricter
  reminder appended to the prompt.
- All Gemini calls happen on the backend; the API key never leaves the server.

## Mock mode

If `GEMINI_API_KEY` is missing, equals `mock`, or equals `replace_me`, the
backend runs in mock mode and returns a deterministic evaluation. This makes
the app runnable immediately for local testing.

## Troubleshooting

- **`Cannot find module 'pdf-parse'`** — run `npm run install:all` from the
  repo root.
- **CORS error** — make sure `CLIENT_URL` in `apps/api/.env` matches the URL
  the frontend runs on (default `http://localhost:5173`).
- **`fetch is not defined`** — upgrade to Node.js >= 18.17.
- **TED returns "unavailable"** — TED API endpoints can change. Check
  `TED_API_BASE_URL` and `TED_SEARCH_PATH`. The evaluation still runs.
- **Evaluation fails with `GEMINI_ERROR`** — verify your `GEMINI_API_KEY` and
  `GEMINI_MODEL` values, or set `GEMINI_API_KEY=mock` to test the rest of the
  pipeline offline.
- **File rejected** — only PDF, DOCX and TXT are supported. Maximum file size
  is `MAX_UPLOAD_MB` MB (default 20).
