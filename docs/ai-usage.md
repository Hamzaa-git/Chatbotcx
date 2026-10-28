# CX Copilot — AI Usage Disclosure & Engineering Journal

**Assessment Deliverable:** Transparent AI-Assistance Documentation  
**Requirement:** Disclose actual tools, specific prompt workflows, and at least one genuine mistake caught and corrected.

---

## 1. AI Tools Utilized During Build
- **Google Antigravity IDE (Gemini 3.8 Flash Agentic Engine):** Full-stack architectural scaffolding, Vitest test authoring, database schema migrations, and React 19 UI component development.
- **OpenRouter API Gateway:** LLM inference testing with `meta-llama/llama-3.3-70b-instruct:free` and configurable model support.
- **TypeScript Compiler (`tsc`) & Vitest Runner:** Automated static analysis, regression tracking, and acceptance suite validation.

---

## 2. Key Prompts & Architecture Workflows

### Prompt Workflow 1: Relational Schema & Row-Level Security
- **Intent:** Design 10 relational tables supporting multi-brand tenancy, versioned policy history, and immutable generation snapshots without cascading deletions destroying audit logs.
- **Outcome:** Generated `001_initial_schema.sql` and `002_rls_policies.sql`. Composite foreign keys `(brand_id, customer_id)` guarantee that customers, orders, and conversations cannot cross tenant boundaries.

### Prompt Workflow 2: Deterministic Rule Engine vs. LLM Hallucinations
- **Intent:** Prevent the language model from guessing or miscalculating delivery date windows (e.g., assessing whether 20 days exceeds a 7-day refund policy).
- **Outcome:** Designed `retrieveBrandKnowledgeAndEvaluateRules` in `src/services/retrieval.ts`. The rule engine computes exact elapsed milliseconds, days, and hours in TypeScript, injects verified rule warnings into the context, and instructs the model or mock engine accordingly.

---

## 3. Real Mistakes Caught & Corrected During Development

### Mistake 1: Substring Matching Causing False Positives in Retrieval (The "President / Dent" Bug)
- **Description:** During initial implementation of the keyword synonym map in `src/services/retrieval.ts`, the code used naive JavaScript `queryText.includes(term)`.
- **The Bug:** In Test **T10** (Unrelated query: *"Hi there! I am the president of the university cycling club. Does PureSip sponsor collegiate athletics or esports tournaments?"*), the customer query was expected to return `status: "no_relevant_knowledge"`. Instead, it unexpectedly matched the `damage` category!
- **Root Cause:** The word `"president"` contains the substring `"dent"`, which was registered in the synonym map for damaged flasks (`'dent' -> ['damage']`).
- **Correction:** Refactored the synonym engine to use strict word-boundary regular expressions:
  ```ts
  function matchesTerm(text: string, term: string): boolean {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\W)${escaped}(\\W|$)`, 'i');
    return regex.test(text);
  }
  ```
  After this fix, subword collisions were eliminated and T10 passed cleanly.

### Mistake 2: CamelCase vs. Snake_case Interface Mismatch in Generation Sources
- **Description:** During Acceptance Test **T12** (Deleted/inactive policy snapshot retention), the test asserted `pastGen?.sources.some((s) => s.policyId === damagePolicy.id)`. The assertion failed with `false`.
- **Root Cause:** The database entity `GenerationSource` strictly mirrored Postgres snake_case column names (`policy_id`), while the test attempted to read `s.policyId`. Because `policyId` was undefined on the object, the comparison failed.
- **Correction:** Standardized property names to `policy_id` across the audit log inspection and test assertions, ensuring consistent typing and full schema alignment.

---

## 4. Engineering Reflections
The combination of strict TypeScript contracts, deterministic pre-execution rule validation, and a comprehensive Vitest acceptance suite (T01–T18) allowed us to catch these edge cases early during Phase 1 and Phase 4, well before deployment.
