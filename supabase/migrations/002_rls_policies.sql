-- ==============================================================================
-- CX Copilot: Row Level Security (RLS) & RBAC Policies
-- Enforces tenant isolation so users can ONLY access records belonging
-- to brands where they possess an active brand_membership.
-- ==============================================================================

-- Enable RLS on all 10 tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_reviews ENABLE ROW LEVEL SECURITY;

-- Helper functions for authorization checks
CREATE OR REPLACE FUNCTION auth_is_brand_member(p_brand_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM brand_memberships
    WHERE brand_id = p_brand_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION auth_is_brand_admin(p_brand_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM brand_memberships
    WHERE brand_id = p_brand_id
      AND user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- 1. BRANDS
CREATE POLICY brands_select ON brands
  FOR SELECT
  USING (auth_is_brand_member(id));

-- 2. BRAND MEMBERSHIPS
CREATE POLICY brand_memberships_select ON brand_memberships
  FOR SELECT
  USING (user_id = auth.uid() OR auth_is_brand_admin(brand_id));

-- 3. CUSTOMERS
CREATE POLICY customers_select ON customers
  FOR SELECT
  USING (auth_is_brand_member(brand_id));

CREATE POLICY customers_insert ON customers
  FOR INSERT
  WITH CHECK (auth_is_brand_member(brand_id));

-- 4. ORDERS
CREATE POLICY orders_select ON orders
  FOR SELECT
  USING (auth_is_brand_member(brand_id));

-- 5. CONVERSATIONS
CREATE POLICY conversations_select ON conversations
  FOR SELECT
  USING (auth_is_brand_member(brand_id));

CREATE POLICY conversations_update ON conversations
  FOR UPDATE
  USING (auth_is_brand_member(brand_id));

-- 6. MESSAGES
CREATE POLICY messages_select ON messages
  FOR SELECT
  USING (auth_is_brand_member(brand_id));

CREATE POLICY messages_insert ON messages
  FOR INSERT
  WITH CHECK (auth_is_brand_member(brand_id));

-- 7. KNOWLEDGE BASE ENTRIES
CREATE POLICY kb_select ON kb_entries
  FOR SELECT
  USING (auth_is_brand_member(brand_id));

CREATE POLICY kb_insert ON kb_entries
  FOR INSERT
  WITH CHECK (auth_is_brand_admin(brand_id));

CREATE POLICY kb_update ON kb_entries
  FOR UPDATE
  USING (auth_is_brand_admin(brand_id))
  WITH CHECK (auth_is_brand_admin(brand_id));

CREATE POLICY kb_delete ON kb_entries
  FOR DELETE
  USING (auth_is_brand_admin(brand_id));

-- 8. AI GENERATIONS
CREATE POLICY ai_generations_select ON ai_generations
  FOR SELECT
  USING (auth_is_brand_member(brand_id));

CREATE POLICY ai_generations_insert ON ai_generations
  FOR INSERT
  WITH CHECK (auth_is_brand_member(brand_id));

-- 9. GENERATION SOURCES
CREATE POLICY generation_sources_select ON generation_sources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_generations g
      WHERE g.id = generation_sources.generation_id
        AND auth_is_brand_member(g.brand_id)
    )
  );

-- 10. REPLY REVIEWS
CREATE POLICY reply_reviews_select ON reply_reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_generations g
      WHERE g.id = reply_reviews.generation_id
        AND auth_is_brand_member(g.brand_id)
    )
  );

CREATE POLICY reply_reviews_insert ON reply_reviews
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_generations g
      WHERE g.id = reply_reviews.generation_id
        AND auth_is_brand_member(g.brand_id)
    )
  );
