-- ==============================================================================
-- CX Copilot: Initial Schema Migration
-- Tables: brands, brand_memberships, customers, orders, conversations,
--         messages, kb_entries, ai_generations, generation_sources, reply_reviews
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BRANDS
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. BRAND MEMBERSHIPS (Agent / Admin RBAC)
CREATE TABLE IF NOT EXISTS brand_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('agent', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_brand_user UNIQUE (brand_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON brand_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_brand ON brand_memberships(brand_id);

-- 3. CUSTOMERS (Scoped to Brand)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_brand_customer_id UNIQUE (id, brand_id)
);

CREATE INDEX IF NOT EXISTS idx_customers_brand ON customers(brand_id);

-- 4. ORDERS (Scoped to Brand and Customer)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'shipped', 'delivered', 'cancelled', 'returned')),
  delivered_at TIMESTAMPTZ,
  items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_orders_brand_order_number UNIQUE (brand_id, order_number),
  CONSTRAINT uq_orders_id_brand UNIQUE (id, brand_id),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id, brand_id) REFERENCES customers(id, brand_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_brand ON orders(brand_id);

-- 5. CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  order_id UUID,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending_approval', 'resolved', 'closed')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_conversations_id_brand UNIQUE (id, brand_id),
  CONSTRAINT fk_conversations_customer FOREIGN KEY (customer_id, brand_id) REFERENCES customers(id, brand_id) ON DELETE CASCADE,
  CONSTRAINT fk_conversations_order FOREIGN KEY (order_id, brand_id) REFERENCES orders(id, brand_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_brand ON conversations(brand_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);

-- 6. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent')),
  body TEXT NOT NULL,
  client_request_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_messages_conversation_req UNIQUE (conversation_id, client_request_id),
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id, brand_id) REFERENCES conversations(id, brand_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

-- 7. KNOWLEDGE BASE ENTRIES
CREATE TABLE IF NOT EXISTS kb_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('returns', 'refunds', 'shipping', 'cancellation', 'damage')),
  content TEXT NOT NULL,
  rules_json JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_brand_active ON kb_entries(brand_id, active, category);

-- 8. AI GENERATIONS
CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  trigger_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('grounded', 'needs_information', 'no_relevant_knowledge', 'policy_conflict')),
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL DEFAULT 'v1.0',
  original_response TEXT NOT NULL,
  usage_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_generations_conversation FOREIGN KEY (conversation_id, brand_id) REFERENCES conversations(id, brand_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_generations_conversation ON ai_generations(conversation_id);

-- 9. GENERATION SOURCES (Immutable snapshots of retrieved policies)
CREATE TABLE IF NOT EXISTS generation_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES ai_generations(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES kb_entries(id) ON DELETE SET NULL,
  policy_version INTEGER NOT NULL,
  content_snapshot TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gen_sources_generation ON generation_sources(generation_id);

-- 10. REPLY REVIEWS (Approval and dispatch audit)
CREATE TABLE IF NOT EXISTS reply_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES ai_generations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  edited_response TEXT NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  final_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_generation ON reply_reviews(generation_id);
