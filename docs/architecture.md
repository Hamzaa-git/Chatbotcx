# CX Copilot — Production Scale Architecture & Systems Design

**System:** Multi-Brand Customer Support AI Reply Copilot  
**Scale Target:** 500 Brands • 5,000 Concurrent Agents • Millions of Monthly Inquiries  
**Document Limit:** ~2–3 Pages Equivalent (Concise Systems Design)  

---

## 1. High-Level Architecture Topology

```
                       [ Omni-Channel Ingestion Layer ]
         [Shopify]      [Zendesk / Gorgias]      [WhatsApp / Email]
             │                   │                        │
             └───────────────────┼────────────────────────┘
                                 ▼
                     [ API & Webhook Gateway ]
                     (Edge Auth / Signature Check /
                      Redis Distributed Dedupe Key)
                                 │
                                 ▼
                    [ Durable Inbound Message Queue ]
                    (Kafka / AWS SQS / RabbitMQ Partitioned by Brand)
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       [ Worker Ingestion Pool ]       [ Transactional Outbox Worker ]
       (Idempotent Msg Ingestion)      (Poller for Approved Replies)
                 │                               │
                 ▼                               ▼
       [ Supabase PostgreSQL ]         [ External Dispatch Adapters ]
       (RLS Multi-Tenant DB)           (Shopify/Zendesk Delivery APIs)
                 │                               ▲
                 │ (JWT Auth + RLS)              │
                 ▼                               │ (Approved Reply)
    [ Agent Frontend Workspace ] ────────────────┘
    (React 19 / TypeScript / Vite)
                 │
                 ▼
     [ Server-Side Edge Function ]
     (Context Retrieval + Rule Engine + Model Gateway)
                 │
                 ▼
      [ Model Gateway & Providers ]
      (OpenRouter / Claude / Llama / Gemini / Fallback Mock Engine)
```

---

## 2. Ingestion, Idempotency & Delivery Reconciliation

### A. Webhook Deduplication at Ingestion
External channels (e.g. Shopify webhook, WhatsApp Cloud API) frequently exhibit transient retries during high-volume spikes. To avoid duplicate message insertion:
1. **Edge Fingerprinting:** The Webhook Gateway extracts a unique natural idempotency key from headers or payloads (e.g., `X-Shopify-Webhook-Id` or `sha256(provider + channel + event_id)`).
2. **Atomic Set-NX Cache:** The gateway performs an atomic `SET key EX 86400 NX` in a Redis distributed cache. Duplicate incoming deliveries are acknowledged with `200 OK` immediately without re-enqueuing.
3. **Database Uniqueness Constraint:** The Postgres `messages` table enforces `UNIQUE(conversation_id, client_request_id)` as the ultimate durable source-of-truth.

### B. Transactional Outbox Pattern for Outgoing Replies
The system guarantees that an agent-approved reply is never lost between database commit and external channel dispatch:
1. **Atomic Local Commit:** When an agent approves and sends a reply, the `messages` record and the `reply_reviews` record are inserted in a single database transaction alongside an `outbox_events` row with status `PENDING`.
2. **Outbox Relay Workers:** An asynchronous worker process polls `outbox_events` using `SELECT ... FOR UPDATE SKIP LOCKED` and dispatches the payload to the external channel API.
3. **Delivery Reconciliation:** Once the provider returns a delivery acknowledgment ID, the worker updates the outbox status to `DELIVERED`. If the channel API times out, the worker backs off exponentially with jitter. If an acknowledgment is lost, the worker verifies message existence before retrying, ensuring **at-least-once delivery with end-to-end reconciliation**.

---

## 3. Multi-Tenant Isolation & Security Boundaries

Operating 500 distinct brands on a shared infrastructure demands bulletproof isolation:

1. **Row-Level Security (RLS) as Ground Truth:**
   - Every table contains `brand_id`.
   - Access is mediated through `brand_memberships` (`auth.uid() = user_id`).
   - Tenant boundaries are enforced in Postgres SQL, not in client-side code.
2. **Context Resolution by Conversation:**
   - When generating an AI reply, the backend resolves `brand_id` directly from the authorized `conversations` record, **never from client assertions or customer message text**.
3. **Noisy-Tenant Contention Control:**
   - Message queues are partitioned with brand-level quotas and fair-share scheduling (Deficit Weighted Round Robin).
   - Rate limiters prevent a surge in one brand's traffic from starving database connections or model gateway capacity.

---

## 4. Model Gateway, Cost Economics & Latency Control

### A. Diagnosing the 5x Spend Spike (INR 20k → 100k)
In the assessment scenario, traffic grew 40% but total inference spend grew 400% (5x), causing cost per conversation to surge 3.57x. This structural escalation is diagnosed by analyzing:
- **Unbounded Context Inflation:** Legacy implementations passed entire unbounded conversation histories (20+ turns) on every turn, causing quadratic prompt token growth ($O(N^2)$).
- **Arbitrary Policy Ingestion:** Injecting full knowledge base manuals into prompts rather than deterministic category-specific extracts.
- **Model Overkill:** Using high-parameter flagship models for trivial classification or greeting tasks.
- **Autonomous Duplication:** Calling the model automatically on every customer ping rather than on agent request.

### B. Engineering Remedy Implemented in CX Copilot
1. **Bounded Retrieval Context:** Only the last 3 customer messages and exact matched category policies are loaded (~600 tokens total).
2. **Deterministic Pre-Execution Rules:** Deterministic rules (e.g. 20-day delivery > 7-day refund window) run locally in TypeScript before calling the LLM, eliminating unnecessary tokens.
3. **JSON Output Contract:** Forbidding hidden chain-of-thought tokens drastically reduces completion token cost.
4. **Estimated Cost Reduction:** 75–85% reduction in token burn, bringing per-conversation cost below baseline.

---

## 5. Observability, Evaluation & Fallback Safety

1. **Tracing & Telemetry:** Every generation records `latency_ms`, `prompt_tokens`, `completion_tokens`, and exact `generation_sources` snapshots.
2. **Circuit Breakers & Graceful Degradation:** If OpenRouter or the model provider experiences rate limiting or latency >15s, the system surfaces a clear safe warning while preserving independent manual agent messaging.
3. **Offline Mock Mode:** Offline reviewers can test all 18 acceptance scenarios without credentials using the built-in, labeled deterministic engine.
