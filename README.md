# A Machine Learning-Driven Recommender Framework for Optimizing Supplier-Tender Matchmaking in B2B Procurement Ecosystems

A state-of-the-art, machine learning-driven web framework engineered to revolutionize B2B procurement workflows. By seamlessly integrating Google's Gemini Large Language Model with a hyper-optimized, fault-tolerant backend, this system autonomously ingests unstructured supplier proposals, performs deep multidimensional semantic analysis against complex tender contracts, and generates highly deterministic, explainable matchmaking rankings.

## ✨ Enterprise-Grade Features

* **Cognitive Document Processing Pipeline:** Natively ingests and extracts deep semantic context from highly unstructured `.pdf`, `.docx`, and plaintext files. Employs dynamic multi-file aggregation and aggressive whitespace normalization, fortified by a strict 1.5-million-character truncation matrix to perfectly optimize the LLM's context window.
* **Advanced Generative AI Scoring:** Harnesses the raw analytical power of the `@google/genai` SDK. The engine evaluates suppliers across advanced metrics—including technical fit, commercial viability, absolute compliance, and latent risk—delivering actionable procurement intelligence in seconds.
* **Zero-Hallucination Schema Enforcement:** Implements rigorous, runtime `Zod` validation schemas injected directly into the Gemini model's neural configuration. This forces the LLM to output strictly typed JSON, mathematically eliminating structural hallucinations.
* **Autonomous Self-Healing Mechanics:** Built-in resilience. The system features a bespoke algorithmic parser that strips malformed markdown boundaries and initiates an automated, prompt-reinforced retry loop if the AI experiences structural degradation.
* **Zero-Latency Offline Heuristics (Mock Mode):** A highly sophisticated deterministic fallback engine. In air-gapped environments or without API credentials, the system instantly routes to a mathematical heuristic scoring model, guaranteeing 100% uptime for continuous UI development and local testing.

## 🏗️ High-Performance Architecture

The system is deployed as a highly scalable, containerized monorepo, cleanly decoupling the hyper-responsive client interface from the high-throughput AI orchestration layer.

| Layer | Technologies | Implementation Details |
| --- | --- | --- |
| **Client UI** | React 18, Vite, Tailwind | Lightning-fast, ultra-responsive SPA with real-time UI state management and asynchronous data hydration. |
| **Core API** | Node.js, Express, TS | High-throughput RESTful orchestration layer with strict TypeScript type-safety across all endpoints. |
| **Data Persistence** | SQLite (`better-sqlite3`) | Hyper-fast, lightweight relational storage utilizing WAL (Write-Ahead Logging) for optimized concurrency. |
| **AI Subsystem** | Google GenAI, Zod | Synchronous LLM orchestration with absolute payload validation and retry logic. |
| **DevOps** | Docker, Docker Compose | Immutable, environment-agnostic containerization ensuring pixel-perfect reproducible deployments. |

## 📂 Repository Matrix

```text
procurement-recommender-system/
├── apps/
│   ├── api/                  # High-Throughput Node.js Backend (Port 4000)
│   │   ├── src/services/     # NLP Extraction & AI Orchestration logic
│   │   ├── src/db/           # SQLite schemas and optimized queries
│   │   └── src/validators/   # Zod boundary enforcement schemas
│   └── web/                  # Next-Gen React Client (Port 5173)
│       ├── src/components/   # Modular UI, Form Control, & Data Visualization
│       └── src/api/          # Axios HTTP client configuration
├── docker-compose.yml        # Multi-container orchestration matrix
└── package.json              # Monorepo workspace and concurrent execution scripts

```

## 🚀 Deployment & Initialization

### Prerequisites

* Node.js (v20+ recommended)
* Docker daemon (required for isolated container execution)
* Google Gemini API Key (required for live generative inference)

### 1. Environment Configuration

Establish your environment variables in the `apps/api/` directory:

```env
# apps/api/.env
PORT=4000

# Leave GEMINI_API_KEY empty to trigger the Zero-Latency Offline Heuristic Mode
GEMINI_API_KEY=your_production_gemini_key
GEMINI_MODEL=gemini-2.5-flash

```

### 2. Containerized Execution (Recommended)

Deploy the entire infrastructure stack securely within isolated Docker containers. Local volumes are automatically mapped to enable real-time hot-reloading during active development.

```bash
# Execute from the repository root to build and launch the matrix
docker-compose up --build

```

* **Frontend Application:** `http://localhost:5173`
* **API Orchestrator:** `http://localhost:4000`

### 3. Native Execution

To run the framework directly on your local hardware:

```bash
# Resolve and map all monorepo dependencies instantly
npm run install:all

# Boot up the frontend and backend engines concurrently
npm run dev

```

## 🧪 Rigorous Validation Suite

The backend framework is fortified by a comprehensive `vitest` unit and integration testing matrix, verifying absolute data integrity across the ingestion algorithms, REST routing, and AI interaction layers.

```bash
# Execute the automated backend testing matrix
npm run test

```