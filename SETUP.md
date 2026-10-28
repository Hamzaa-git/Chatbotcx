# Setup & Getting Started Guide

This guide walks you through setting up and running the **Chatbotcx - AI Customer Support Platform** locally on your machine.

---

## ⚡ Quick Start (Under 60 Seconds)

```bash
# 1. Clone the repository
git clone https://github.com/Hamzaa-git/Chatbotcx.git
cd Chatbotcx

# 2. Install dependencies
npm install

# 3. Create environment configuration
cp .env.example .env

# 4. Start the application
npm start
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the live platform!

---

## 📋 System Prerequisites

| Tool | Recommended Version | Verification Command |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` (LTS recommended) | `node -v` |
| **npm** | `>= 9.0.0` (or `pnpm` / `bun`) | `npm -v` |
| **Git** | `>= 2.30.0` | `git -v` |

---

## ⚙️ Detailed Installation Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy the template file:
```bash
cp .env.example .env
```
Open `.env` in your editor. The application runs immediately in **Deterministic Grounded Mode** without requiring external API keys. 

If you want live AI drafting via Google Gemini:
```env
# Add your Google Gemini API key:
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Keep mock fallback enabled as a safety guardrail:
VITE_ENABLE_MOCK_FALLBACK=true
```

### Step 3: Run the Application
You have two execution modes:

#### Option A: Full-Stack Mode (Recommended)
Runs the unified Node.js server with the secure server-side AI proxy and static frontend:
```bash
npm start
```
> Server starts on **[http://localhost:3000](http://localhost:3000)** with `/api/gemini` proxy endpoint available.

#### Option B: Frontend Vite Dev Mode
For rapid frontend UI component development with Hot Module Replacement (HMR):
```bash
npm run dev
```
> Dev server starts on **[http://localhost:5173](http://localhost:5173)**.

---

## 🧪 Running the Test Suite

The project includes an automated test suite verifying deterministic date deltas, policy compliance, anti-hallucination guardrails, and multi-tenant isolation.

```bash
# Run Vitest test suite once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with test coverage analysis
npm run test:coverage

# Verify Gemini API connectivity (if API key is configured)
npm run test:gemini
```
*Expected Result: 23 / 23 unit & acceptance tests passing.*

---

## 🗄️ Database Setup (Supabase / PostgreSQL)

The repository provides full PostgreSQL migrations with multi-tenant Row-Level Security:

1. **Using Supabase CLI (Local Docker):**
   ```bash
   supabase start
   supabase db reset
   ```
2. **Using External PostgreSQL:**
   ```bash
   psql $DATABASE_URL -f supabase/migrations/001_initial_schema.sql
   psql $DATABASE_URL -f supabase/migrations/002_rls_policies.sql
   psql $DATABASE_URL -f supabase/seed.sql
   ```

See [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md) for full ER diagrams, table schemas, and security policies.

---

## 🏗️ Production Build

To compile and bundle for production:
```bash
npm run build
```
This produces optimized production assets in `dist/`.

---

## 🚢 Deployment

### Deploying to Vercel
1. Push this repository to your GitHub account.
2. Import the project into your Vercel Dashboard.
3. In **Project Settings → Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
4. Deploy! Vercel automatically routes `/api/gemini` to the `api/gemini.js` serverless function.

### Deploying with Docker / Standalone Node.js
```bash
npm run build
PORT=3000 node server.cjs
```

---

## ❓ Troubleshooting & FAQs

- **Port 3000 in use?** Set `PORT=3001` in your `.env` or run `PORT=3001 npm start`.
- **Gemini API quota exceeded?** The app automatically falls back to local grounded deterministic policies without crashing or throwing client errors.
- **Node.js version mismatch?** Ensure you are on Node 18 or higher (`node -v`).
