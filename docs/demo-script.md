# CX Copilot — Assessment Demo Video Script (< 5 Minutes)

**Target Duration:** 4 minutes 45 seconds  
**Objective:** Deliver a crisp, confident walkthrough demonstrating every core requirement of the Datastraw Tech Lead Assessment.

---

## ⏱️ Video Timeline Breakdown

### 0:00 - 0:30 | Product Overview & Scope
- **Screen:** CX Copilot Workspace with Header and 3-column layout.
- **Narrative:**
  > "Hi everyone, I'm presenting **CX Copilot**, an enterprise-grade, multi-brand customer support reply copilot built for the Datastraw Tech Lead assessment.
  > Unlike autonomous chatbots that hallucinate external actions or risk customer churn, CX Copilot keeps human agents firmly in the loop. The agent inspects grounded policy evidence, reviews actionable warnings, edits suggested drafts, and approves replies before atomic dispatch. Manual agent replies remain completely independent."

### 0:30 - 1:30 | Core Flow: Customer Message → AI Generation → Grounded Review → Atomic Send
- **Screen:** Conversation `GL-1001` (Emma Vance - Broken Wine Carafe).
- **Actions:**
  1. Point out the customer's message: *"I just opened order GL-1001 and the glass carafe is cracked..."*
  2. Click **"Generate AI Suggestion"**.
  3. Show the **AI Suggestion Panel** appear in under 500ms with **Policy Grounded** badge.
  4. Expand the **Audited Knowledge Sources** to show the exact snapshot: *Damaged / Broken Glass Policy*.
  5. Highlight the **Agent Warning**: *Photographic proof of damaged item and packaging is mandatory.*
  6. Edit the draft slightly in the textarea to personalize the greeting.
  7. Click **"Approve Draft"** → Explain that editing invalidates approval, ensuring human verification of final text.
  8. Click **"Send Approved Reply"** → Point out the message appearing in the timeline with the **Dispatched** status and unique `client_request_id`.

### 1:30 - 2:15 | Multi-Brand Comparison & Knowledge Base Management
- **Screen:** Brand Selector Dropdown & Knowledge Base Tab.
- **Actions:**
  1. Switch brand from **Glassleaf Drinkware** to **PureSip Hydration**.
  2. Point out that the conversation list immediately filters to PureSip customers only (zero cross-tenant leakage).
  3. Click the **Knowledge Base** tab.
  4. Compare policies: Glassleaf enforces a strict **7-day return window** and **48-hour damage report limit**, whereas PureSip offers a **30-day happiness guarantee**.
  5. Edit a policy as Admin to show version incrementing (`v1` → `v2`) without touching code.
  6. Note that historical generation snapshots in `generation_sources` remain immutable even if a policy is deactivated.

### 2:15 - 3:00 | Guardrails: Out-of-Window Violated Refund & Missing Information
- **Screen:** Conversation `GL-1002` (Liam Chen) and `PS-2001` (Sophia Patel).
- **Actions:**
  1. Open conversation `GL-1002`. Point out that the order was delivered **20 days ago**.
  2. Point out the Order Context card banner: *Policy Window Exceeded (20d > 7d max)*.
  3. Show the AI suggestion: It politely declines the refund based on the 7-day policy window, refusing to make false financial promises.
  4. Open conversation `PS-2001` where `delivered_at` is null/pending.
  5. Show status **Needs Information**: The assistant prompts the agent to ask the customer for carrier delivery confirmation before assessing refund eligibility.

### 3:00 - 4:00 | System Architecture & Security (500 Brands / 5,000 Agents)
- **Screen:** Architecture Tab.
- **Narrative & Actions:**
  1. Show the **18 / 18 Vitest Acceptance Test Suite Matrix** passing with zero security gaps.
  2. Explain the **Ingestion Webhook Gateway** with Redis distributed deduplication keys (`SET NX`) to defeat webhook retry storms.
  3. Explain the **Transactional Outbox Pattern**: outgoing approved messages are written atomically to PostgreSQL and relayed by an asynchronous worker, guaranteeing at-least-once delivery with external reconciliation.
  4. Point out **Supabase Row-Level Security (RLS)**: every read/write requires verified `brand_memberships`. Server-side OpenRouter keys never leak into browser client bundles.

### 4:00 - 4:40 | AI Cost Containment (Diagnosing the 5x Spike)
- **Screen:** Architecture Tab — Cost Investigation Card.
- **Narrative:**
  1. Explain Part 2: When conversation volume grew 40% while spend grew 400% (5x), cost per conversation surged 3.57x.
  2. Walk through the root causes: unbounded conversational history inflation ($O(N^2)$), full KB dumping into system prompts, and unneeded frontier model calls on trivial queries.
  3. Detail our engineering fixes: deterministic category retrieval, context budgeting (last 3 messages, ~600 tokens total), pre-execution deterministic rules, and on-demand agent invocation.

### 4:40 - 5:00 | Limitations & Next Steps
- **Screen:** Main Workspace.
- **Narrative:**
  > "For this MVP, retrieval uses deterministic keyword synonyms and structured rules. In future iterations, we can introduce hybrid vector search with pgvector—while preserving tenant-filtered boundaries—and asynchronous webhook adapters for real Shopify and Zendesk integrations. Thank you!"
