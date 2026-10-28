-- ==============================================================================
-- CX Copilot: Seed Data & Test Fixtures
-- Brands: Glassleaf & PureSip
-- Policies: returns, refunds, shipping, cancellation, damage
-- Test Scenarios:
--   1. Broken Bottle (Glassleaf - GL-1001)
--   2. 20-Day Refund Window Violation (Glassleaf - GL-1002, 20d > 7d window)
--   3. Unknown Delivery Date (PureSip - PS-2001, delivered_at IS NULL)
--   4. Unrelated Query / Zero-Knowledge (PureSip - PS-2002, college sponsorship)
-- ==============================================================================

-- Static Deterministic UUIDs for Seed Consistency
DO $$
DECLARE
  v_brand_glassleaf UUID := '11111111-1111-1111-1111-111111111111';
  v_brand_puresip   UUID := '22222222-2222-2222-2222-222222222222';
  
  v_user_admin      UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_user_agent      UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  
  v_cust_1          UUID := 'c1111111-1111-1111-1111-111111111111';
  v_cust_2          UUID := 'c2222222-2222-2222-2222-222222222222';
  v_cust_3          UUID := 'c3333333-3333-3333-3333-333333333333';
  v_cust_4          UUID := 'c4444444-4444-4444-4444-444444444444';
  
  v_order_1         UUID := 'd1111111-1111-1111-1111-111111111111';
  v_order_2         UUID := 'd2222222-2222-2222-2222-222222222222';
  v_order_3         UUID := 'd3333333-3333-3333-3333-333333333333';
  v_order_4         UUID := 'd4444444-4444-4444-4444-444444444444';
  
  v_conv_1          UUID := 'e1111111-1111-1111-1111-111111111111';
  v_conv_2          UUID := 'e2222222-2222-2222-2222-222222222222';
  v_conv_3          UUID := 'e3333333-3333-3333-3333-333333333333';
  v_conv_4          UUID := 'e4444444-4444-4444-4444-444444444444';

  v_kb_gl_return    UUID := 'f1111111-1111-1111-1111-111111111111';
  v_kb_gl_refund    UUID := 'f2222222-2222-2222-2222-222222222222';
  v_kb_gl_damage    UUID := 'f3333333-3333-3333-3333-333333333333';
  v_kb_gl_ship      UUID := 'f4444444-4444-4444-4444-444444444444';
  v_kb_gl_cancel    UUID := 'f5555555-5555-5555-5555-555555555555';

  v_kb_ps_return    UUID := 'f6666666-6666-6666-6666-666666666666';
  v_kb_ps_refund    UUID := 'f7777777-7777-7777-7777-777777777777';
  v_kb_ps_damage    UUID := 'f8888888-8888-8888-8888-888888888888';
  v_kb_ps_ship      UUID := 'f9999999-9999-9999-9999-999999999999';
  v_kb_ps_cancel    UUID := 'faaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
BEGIN

  -- Insert Brands
  INSERT INTO brands (id, name, slug) VALUES
    (v_brand_glassleaf, 'Glassleaf Drinkware', 'glassleaf'),
    (v_brand_puresip, 'PureSip Hydration', 'puresip')
  ON CONFLICT (id) DO NOTHING;

  -- Insert Brand Memberships
  INSERT INTO brand_memberships (brand_id, user_id, role) VALUES
    (v_brand_glassleaf, v_user_admin, 'admin'),
    (v_brand_glassleaf, v_user_agent, 'agent'),
    (v_brand_puresip, v_user_admin, 'admin'),
    (v_brand_puresip, v_user_agent, 'agent')
  ON CONFLICT (brand_id, user_id) DO NOTHING;

  -- Insert Knowledge Base for Glassleaf
  INSERT INTO kb_entries (id, brand_id, title, category, content, rules_json, active, version) VALUES
    (v_kb_gl_return, v_brand_glassleaf, 'Return Window Policy', 'returns',
     'Glassleaf accepts returns within 7 calendar days from the confirmed delivery date. Items must be in original condition and packaging. Return eligibility alone is not an automatic refund approval; items undergo physical inspection upon arrival.',
     '{"window_days": 7, "requires_inspection": true}'::jsonb, true, 1),
    (v_kb_gl_refund, v_brand_glassleaf, 'Refund Disbursement Schedule', 'refunds',
     'Refund requests must be initiated within 7 calendar days of delivery. Once inspected and approved by our support team, refunds are credited back to the original payment method within 5-7 business days.',
     '{"window_days": 7, "processing_days_min": 5, "processing_days_max": 7}'::jsonb, true, 1),
    (v_kb_gl_damage, v_brand_glassleaf, 'Damaged / Broken Glass Policy', 'damage',
     'Glassware is fragile. Damage or broken item reports must be submitted within 48 hours of confirmed delivery. Customers must provide the order reference number and clear photographs of the broken item and packaging for replacement or credit evaluation.',
     '{"report_hours": 48, "requires_photos": true, "requires_order_ref": true}'::jsonb, true, 1),
    (v_kb_gl_ship, v_brand_glassleaf, 'Fulfillment & Shipping Estimates', 'shipping',
     'Standard domestic shipping takes 3-5 business days from order fulfillment. Tracking details are emailed immediately upon courier dispatch.',
     '{"delivery_days_min": 3, "delivery_days_max": 5}'::jsonb, true, 1),
    (v_kb_gl_cancel, v_brand_glassleaf, 'Order Cancellation', 'cancellation',
     'Orders can only be cancelled before they enter the fulfillment and dispatch stage. Once dispatched, the customer must follow standard return procedures.',
     '{"allowed_before_dispatch": true}'::jsonb, true, 1)
  ON CONFLICT (id) DO NOTHING;

  -- Insert Knowledge Base for PureSip
  INSERT INTO kb_entries (id, brand_id, title, category, content, rules_json, active, version) VALUES
    (v_kb_ps_return, v_brand_puresip, '30-Day Happiness Guarantee', 'returns',
     'PureSip offers a 30-day return window from the verified delivery date for unused flasks and hydration accessories. Original packaging is required.',
     '{"window_days": 30, "requires_inspection": true}'::jsonb, true, 1),
    (v_kb_ps_refund, v_brand_puresip, 'Refund Processing Protocol', 'refunds',
     'Refunds are available for requests within 30 days of delivery. Upon warehouse check-in and quality approval, refunds process within 7-10 business days.',
     '{"window_days": 30, "processing_days_min": 7, "processing_days_max": 10}'::jsonb, true, 1),
    (v_kb_ps_damage, v_brand_puresip, 'Damaged or Defective Flask Claims', 'damage',
     'For dented, leaking, or damaged hydration gear, reports must be submitted within 7 calendar days of delivery. Requires order reference number and photo proof.',
     '{"report_days": 7, "requires_photos": true, "requires_order_ref": true}'::jsonb, true, 1),
    (v_kb_ps_ship, v_brand_puresip, 'Ground Shipping Timeline', 'shipping',
     'PureSip packages ship via insured ground logistics within 5-7 business days.',
     '{"delivery_days_min": 5, "delivery_days_max": 7}'::jsonb, true, 1),
    (v_kb_ps_cancel, v_brand_puresip, 'Rapid Cancellation Window', 'cancellation',
     'Orders may be cancelled within 2 hours of placement and prior to warehouse dispatch. After 2 hours, automated packaging prevents cancellation.',
     '{"cancel_window_hours": 2, "allowed_before_dispatch": true}'::jsonb, true, 1)
  ON CONFLICT (id) DO NOTHING;

  -- Customers
  INSERT INTO customers (id, brand_id, name, email) VALUES
    (v_cust_1, v_brand_glassleaf, 'Emma Vance', 'emma.vance@example.com'),
    (v_cust_2, v_brand_glassleaf, 'Liam Chen', 'liam.chen@example.com'),
    (v_cust_3, v_brand_puresip, 'Sophia Patel', 'sophia.patel@example.com'),
    (v_cust_4, v_brand_puresip, 'Marcus Brody', 'marcus.brody@example.com')
  ON CONFLICT (id, brand_id) DO NOTHING;

  -- Orders with relative dates for stable fixtures
  INSERT INTO orders (id, brand_id, customer_id, order_number, status, delivered_at, items_json, total_amount) VALUES
    -- Order 1: Glassleaf, delivered 1 day ago (within 48h damage report)
    (v_order_1, v_brand_glassleaf, v_cust_1, 'GL-1001', 'delivered', now() - INTERVAL '1 day',
     '[{"sku": "GL-CRF-01", "name": "Handmade Artisan Wine Carafe", "quantity": 1, "price": 48.00}]'::jsonb, 48.00),
    -- Order 2: Glassleaf, delivered 20 days ago (VIOLATES 7-day refund policy)
    (v_order_2, v_brand_glassleaf, v_cust_2, 'GL-1002', 'delivered', now() - INTERVAL '20 days',
     '[{"sku": "GL-WSK-04", "name": "Crystal Whiskey Tumbler Set (4pc)", "quantity": 1, "price": 64.00}]'::jsonb, 64.00),
    -- Order 3: PureSip, shipped, delivered_at IS NULL (UNKNOWN DELIVERY DATE)
    (v_order_3, v_brand_puresip, v_cust_3, 'PS-2001', 'shipped', NULL,
     '[{"sku": "PS-FLK-32", "name": "PureSip Insulated Flask 32oz Onyx", "quantity": 1, "price": 35.00}]'::jsonb, 35.00),
    -- Order 4: PureSip, delivered 3 days ago (UNRELATED QUESTION SCENARIO)
    (v_order_4, v_brand_puresip, v_cust_4, 'PS-2002', 'delivered', now() - INTERVAL '3 days',
     '[{"sku": "PS-TMG-16", "name": "PureSip Titanium Travel Mug 16oz", "quantity": 2, "price": 50.00}]'::jsonb, 50.00)
  ON CONFLICT (id, brand_id) DO NOTHING;

  -- Conversations
  INSERT INTO conversations (id, brand_id, customer_id, order_id, status, version) VALUES
    (v_conv_1, v_brand_glassleaf, v_cust_1, v_order_1, 'open', 1),
    (v_conv_2, v_brand_glassleaf, v_cust_2, v_order_2, 'open', 1),
    (v_conv_3, v_brand_puresip, v_cust_3, v_order_3, 'open', 1),
    (v_conv_4, v_brand_puresip, v_cust_4, v_order_4, 'open', 1)
  ON CONFLICT (id, brand_id) DO NOTHING;

  -- Messages
  INSERT INTO messages (brand_id, conversation_id, sender_type, body, client_request_id, created_at) VALUES
    -- Conv 1: Broken bottle
    (v_brand_glassleaf, v_conv_1, 'customer',
     'Hello, I just opened order GL-1001 and the glass carafe is cracked and broken into pieces inside the box. Can you send a replacement?',
     'seed-msg-001', now() - INTERVAL '2 hours'),
    -- Conv 2: 20-day refund window violation
    (v_brand_glassleaf, v_conv_2, 'customer',
     'Hi, I received order GL-1002 a few weeks ago (about 20 days ago). The tumbler set is nice but I would like to return it for a full refund.',
     'seed-msg-002', now() - INTERVAL '3 hours'),
    -- Conv 3: Unknown delivery date inquiry
    (v_brand_puresip, v_conv_3, 'customer',
     'Hello, I ordered the PureSip flask (PS-2001). If it arrives and does not fit my bike bottle cage, what is your refund process?',
     'seed-msg-003', now() - INTERVAL '4 hours'),
    -- Conv 4: Unrelated query / no relevant knowledge
    (v_brand_puresip, v_conv_4, 'customer',
     'Hi there! I am the president of the university cycling club. Does PureSip sponsor collegiate athletics or esports tournaments?',
     'seed-msg-004', now() - INTERVAL '5 hours')
  ON CONFLICT (conversation_id, client_request_id) DO NOTHING;

END $$;
