# Chatbotcx — Enterprise AI Customer Support & Copilot Platform

[![Vitest](https://img.shields.io/badge/Vitest-23%2F23%20Passing-brightgreen.svg?style=flat-square)](https://vitest.dev/)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg?style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg?style=flat-square)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg?style=flat-square)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-336791.svg?style=flat-square)](https://www.postgresql.org/)

> **A production-ready, guardrailed multi-brand customer service platform** built with **React 19**, **TypeScript**, **Tailwind CSS**, deterministic policy grounding, a secure server-side AI proxy, human-in-the-loop review, and complete PostgreSQL Row-Level Security (RLS).

---

## 🚀 Key Highlights & Architectural Features

- **🛡️ Deterministic Anti-Hallucination Guardrails:** Evaluates return windows, delivery dates, and replacement eligibility in deterministic code before invoking the LLM, eliminating hallucinated refund promises.
- **🔒 Zero Client-Side Secret Exposure:** AI credentials (`GEMINI_API_KEY`) are isolated strictly on the server-side proxy (`/api/gemini`), preventing credential leaks in client bundles.
- **🏢 Multi-Tenant Brand Isolation:** Tenant data is partitioned logically by `brand_id` and enforced with PostgreSQL Row-Level Security (RLS) policies.
- **⚡ Dual Portal Architecture:**
  - **Customer Portal:** Clean live chat interface with brand switching, customer order lookups, and ticket creation.
  - **Agent Copilot Workstation:** High-velocity ticket queue, order context inspection, AI-suggested grounded replies, confidence scoring, 1-click approvals, and manual editing.
- **📚 Policy & Knowledge Base Manager:** Dynamic CRUD for brand return, replacement, and warranty policies with version tracking.
- **📝 Immutable Audit Trail:** Full audit logging for every draft generation, agent revision, confidence score, and outbound reply.
- **🔄 Zero-Friction Fallback:** Deterministic local mock fallback activates automatically when API keys are absent or rate limits are reached, ensuring the app works out-of-the-box.

---

## 🗂️ Clean Repository Structure

```text
Chatbotcx/
├── .env.example                            # Documented environment template
├── .gitignore                              # Git exclusion rules
├── README.md                               # Project overview and architectural guide
├── SETUP.md                                # Step-by-step local installation and setup guide
├── index.html                              # HTML5 web application entry point
├── package.json                            # Dependencies, npm scripts, and test definitions
├── package-lock.json                       # Dependency lockfile
├── playwright.config.ts                    # Playwright end-to-end testing configuration
├── server.cjs                              # Unified Node.js server with secure Gemini proxy
├── tsconfig.json                           # TypeScript strict configuration
├── vercel.json                             # Vercel serverless deployment routing
├── vite.config.ts                          # Vite bundler configuration & local API proxy
│
├── api/                                    # Serverless Backend Functions
│   └── gemini.js                           # Secure server-side AI gateway proxy
│
├── docs/                                   # Clean Documentation Package
│   ├── DATABASE_SCHEMA.md                  # Complete database schema, ERD & RLS policies
│   ├── architecture.md                     # Systems architecture blueprint & data flow
│   ├── architecture.mmd                    # Mermaid systems diagram source
│   ├── ai-usage.md                         # AI prompting, token economics & guardrails
│   └── demo-script.md                      # Live evaluator demo walkthrough guide
│
├── e2e/                                    # End-to-End Tests
│   └── cx-copilot.spec.ts                  # Playwright browser integration suite
│
├── scripts/                                # Utility & Testing Scripts
│   ├── test-prod-server.cjs                # Production server diagnostic probe
│   └── verify-gemini.cjs                   # Isolated Gemini API connectivity test
│
├── src/                                    # Frontend Application Source Code
│   ├── App.tsx                             # Root application state & navigation router
│   ├── main.tsx                            # React 19 mount point
│   ├── index.css                           # Tailwind CSS & design tokens
│   │
│   ├── components/                         # UI Components
│   │   ├── LoginScreen.tsx                 # Role-based login with persistent sessions
│   │   ├── CustomerPortal.tsx              # Customer live chat & order inquiry
│   │   ├── AgentPortal.tsx                 # Agent workstation with ticket queue
│   │   ├── AIReplyPanel.tsx                # AI draft review card with confidence badges
│   │   ├── OrderContextCard.tsx            # Live order specs, delivery & tracking info
│   │   ├── KnowledgeBaseManager.tsx        # Policy management & versioning
│   │   ├── AuditLogView.tsx                # Immutable review history & audit log
│   │   ├── Header.tsx                      # Top navigation bar & brand switcher
│   │   └── NewInquiryModal.tsx             # New customer inquiry modal
│   │
│   ├── data/                               # Multi-Tenant Seed Scenarios
│   │   └── seedData.ts                     # Pre-seeded brands, orders, tickets & policies
│   │
│   ├── lib/                                # Utilities
│   │   └── utils.ts                        # Styling and className merge helpers
│   │
│   ├── services/                           # Core Business Logic & Rule Engines
│   │   ├── store.ts                        # Reactive multi-tenant in-memory data store
│   │   ├── retrieval.ts                    # Deterministic date delta & policy rule engine
│   │   ├── aiGenerator.ts                  # AI gateway caller & prompt engineering
│   │   └── __tests__/                      # Automated Vitest Test Suite
│   │       └── acceptanceTests.test.ts     # Acceptance tests (23/23 passing)
│   │
│   └── types/                              # Strict TypeScript Definitions
│       └── index.ts                        # Domain interfaces (Brand, Order, Ticket, etc.)
│
└── supabase/                               # Database Migrations & Seeds
    ├── migrations/
    │   ├── 001_initial_schema.sql          # 10 core relational tables & constraints
    │   └── 002_rls_policies.sql            # Row-Level Security policies & access controls
    ├── seed.sql                            # Multi-brand PostgreSQL seed fixtures
    └── functions/
        └── generate-reply/                 # Supabase Deno Edge Function
            └── index.ts                    # Secure AI dispatch edge function
```

---

## ⚡ Quick Start

```bash
# 1. Clone repository
git clone https://github.com/Hamzaa-git/Chatbotcx.git
cd Chatbotcx

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env

# 4. Start full-stack server
npm start
```
> Platform opens at **[http://localhost:3000](http://localhost:3000)**.

For detailed developer setup, see **[`SETUP.md`](./SETUP.md)**.

---

## 🏛️ System Architecture

```text
[ 1. Ingestion & Customer Channels ]
  (Web Chat Widget, Mobile, WhatsApp Webhooks)
                  │
                  ▼
[ 2. API Gateway & Security Proxy ]
  (Fastify/Node.js, JWT Multi-Brand Auth, Rate Limiter)
                  │
         ┌────────┴────────┐
         ▼                 ▼
[ 3. Deterministic Engine ] [ 4. AI Generator (Gemini) ]
  (Return Window Deltas,       (Grounding Prompt,
   Policy Rules, Claims)        Confidence Scoring)
         └────────┬────────┘
                  │
                  ▼
[ 5. Unified Multi-Tenant Database ]
  (PostgreSQL 16 + pgvector, Row-Level Security per brand_id)
                  │
                  ▼
[ 6. Agent Copilot Workstation ]
  (Human-in-the-Loop Review, 1-Click Send, Audit Trail)
```

For complete technical specifications, see **[`docs/architecture.md`](./docs/architecture.md)**.

---

## 🗄️ Database & Schema Information

The database layer is engineered with **PostgreSQL 16** with multi-tenant isolation:

- **Row-Level Security (RLS):** Every query evaluates against `brand_id = current_setting('app.current_brand_id')`.
- **Primary Entities:** `brands`, `brand_memberships`, `customers`, `orders`, `order_items`, `conversations`, `messages`, `policies`, `reply_reviews`.
- **Migrations & Seeds:** Pre-packaged SQL scripts ready for deployment in `supabase/migrations/` and `supabase/seed.sql`.

For full entity-relationship diagrams and table column definitions, see **[`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md)**.

---

## 🧪 Testing & Quality Assurance

```bash
# Run Vitest test suite
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Verify Gemini API connectivity
npm run test:gemini
```

### Test Coverage Highlights:
- **23/23 Vitest Tests Passing:** Validates deterministic date calculations, brand return windows, out-of-policy rejections, anti-hallucination guardrails, and role-based permissions.

---

## 🛡️ Security & Privacy Guardrails

1. **Zero Client Secret Exposure:** API credentials (`GEMINI_API_KEY`) reside exclusively in server-side environment variables.
2. **Deterministic Pre-Execution:** Dates and return windows are calculated deterministically in TypeScript code before querying the LLM.
3. **Atomic Human Approval:** AI drafts cannot be sent autonomously to customers without active human agent review and approval.
4. **Audit Logging:** Every generation is permanently recorded with prompt version, policy citation, and agent edits.

---

## 🚢 Deployment

### Vercel Deployment
1. Import repository into Vercel.
2. Set environment variable: `GEMINI_API_KEY`.
3. Deploy — Vercel routes `/api/gemini` to the serverless function in `api/gemini.js`.

### Docker / Standalone Node.js
```bash
npm run build
PORT=3000 node server.cjs
```

---

## 📄 License
MIT License. Developed by **Hamza** for the **Chatbotcx Platform**.
