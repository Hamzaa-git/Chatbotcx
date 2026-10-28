import {
  Brand,
  BrandMembership,
  Customer,
  Order,
  Conversation,
  Message,
  KBEntry
} from '../types/database';

export const SEED_BRANDS: Brand[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Shein Designs',
    slug: 'shein-designs',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Watford Leathers',
    slug: 'watford-leathers',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  }
];

export const SEED_MEMBERSHIPS: BrandMembership[] = [
  // Admin user has admin role in both brands
  {
    id: 'm1111111-1111-1111-1111-111111111111',
    brand_id: '11111111-1111-1111-1111-111111111111',
    user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    role: 'admin',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'm2222222-2222-2222-2222-222222222222',
    brand_id: '22222222-2222-2222-2222-222222222222',
    user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    role: 'admin',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  // Agent user has agent role in both brands
  {
    id: 'm3333333-3333-3333-3333-333333333333',
    brand_id: '11111111-1111-1111-1111-111111111111',
    user_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    role: 'agent',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'm4444444-4444-4444-4444-444444444444',
    brand_id: '22222222-2222-2222-2222-222222222222',
    user_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    role: 'agent',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  // Single-brand agent (Shein Designs only - for isolation testing)
  {
    id: 'm5555555-5555-5555-5555-555555555555',
    brand_id: '11111111-1111-1111-1111-111111111111',
    user_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    role: 'agent',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  }
];

export const SEED_KB_ENTRIES: KBEntry[] = [
  // 1. Shein Designs (Clothing & Apparel)
  {
    id: 'f1111111-1111-1111-1111-111111111111',
    brand_id: '11111111-1111-1111-1111-111111111111',
    title: 'Return Window Policy',
    category: 'returns',
    content:
      'Shein Designs accepts returns on clothing and apparel within 7 calendar days from the confirmed delivery date. Garments must be unworn, unwashed, and have all original tags attached. Return eligibility alone is not an automatic refund approval; garments undergo physical inspection upon arrival.',
    rules_json: { window_days: 7, requires_inspection: true },
    active: true,
    version: 1,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'f2222222-2222-2222-2222-222222222222',
    brand_id: '11111111-1111-1111-1111-111111111111',
    title: 'Refund Disbursement Schedule',
    category: 'refunds',
    content:
      'Refund requests must be initiated within 7 calendar days of delivery. Once inspected and approved by our quality control team, refunds are credited back to the original payment method within 5-7 business days.',
    rules_json: { window_days: 7, processing_days_min: 5, processing_days_max: 7 },
    active: true,
    version: 1,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'f3333333-3333-3333-3333-333333333333',
    brand_id: '11111111-1111-1111-1111-111111111111',
    title: 'Damaged & Defective Garment Policy',
    category: 'damage',
    content:
      'Defective zippers, torn seams, fabric flaws, or transit damage must be reported within 48 hours of confirmed delivery. Customers must provide the order reference number to process replacement or credit requests promptly without requiring photographs.',
    rules_json: { report_hours: 48, requires_photos: false, requires_order_ref: true },
    active: true,
    version: 1,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'f4444444-4444-4444-4444-444444444444',
    brand_id: '11111111-1111-1111-1111-111111111111',
    title: 'Apparel Shipping & Delivery Estimates',
    category: 'shipping',
    content:
      'Standard domestic apparel shipping takes 3-5 business days from order fulfillment. Tracking details are emailed immediately upon courier dispatch.',
    rules_json: { delivery_days_min: 3, delivery_days_max: 5 },
    active: true,
    version: 1,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'f5555555-5555-5555-5555-555555555555',
    brand_id: '11111111-1111-1111-1111-111111111111',
    title: 'Order Cancellation',
    category: 'cancellation',
    content:
      'Apparel orders can only be cancelled before they enter the picking and packaging stage. Once dispatched, the customer must follow standard return procedures.',
    rules_json: { allowed_before_dispatch: true },
    active: true,
    version: 1,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },

  // 2. Watford Leathers (Leather Goods)
  {
    id: 'f6666666-6666-6666-6666-666666666666',
    brand_id: '22222222-2222-2222-2222-222222222222',
    title: '30-Day Leather Satisfaction Guarantee',
    category: 'returns',
    content:
      'Watford Leathers offers a 30-day return window from the verified delivery date for unused handcrafted leather goods, jackets, and bags. Items must be in original dust bags and protective boxes.',
    rules_json: { window_days: 30, requires_inspection: true },
    active: true,
    version: 1,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'f7777777-7777-7777-7777-777777777777',
    brand_id: '22222222-2222-2222-2222-222222222222',
    title: 'Leather Goods Refund Protocol',
    category: 'refunds',
    content:
      'Refunds are available for requests within 30 days of delivery. Upon warehouse check-in and leather artisan inspection, refunds process within 7-10 business days.',
    rules_json: { window_days: 30, processing_days_min: 7, processing_days_max: 10 },
    active: true,
    version: 1,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'f8888888-8888-8888-8888-888888888888',
    brand_id: '22222222-2222-2222-2222-222222222222',
    title: 'Damaged or Scratched Leather Claims',
    category: 'damage',
    content:
      'For deep scratches, torn leather, defective brass hardware, or shipping damage, reports must be submitted within 7 calendar days of delivery. Requires order reference number and clear photo proof of the leather defect and packaging.',
    rules_json: { report_days: 7, requires_photos: true, requires_order_ref: true },
    active: true,
    version: 1,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'f9999999-9999-9999-9999-999999999999',
    brand_id: '22222222-2222-2222-2222-222222222222',
    title: 'Insured Courier Shipping',
    category: 'shipping',
    content:
      'Watford Leathers packages ship via insured premium logistics within 5-7 business days.',
    rules_json: { delivery_days_min: 5, delivery_days_max: 7 },
    active: true,
    version: 1,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'faaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    brand_id: '22222222-2222-2222-2222-222222222222',
    title: 'Rapid Cancellation Window',
    category: 'cancellation',
    content:
      'Orders may be cancelled within 2 hours of placement prior to leather cutting and warehouse dispatch. After 2 hours, automated packaging prevents cancellation.',
    rules_json: { cancel_window_hours: 2, allowed_before_dispatch: true },
    active: true,
    version: 1,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
  }
];

export const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    brand_id: '11111111-1111-1111-1111-111111111111',
    name: 'Emma Vance',
    email: 'emma.vance@example.com',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    brand_id: '11111111-1111-1111-1111-111111111111',
    name: 'Liam Chen',
    email: 'liam.chen@example.com',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    brand_id: '22222222-2222-2222-2222-222222222222',
    name: 'Sophia Patel',
    email: 'sophia.patel@example.com',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    brand_id: '22222222-2222-2222-2222-222222222222',
    name: 'Marcus Brody',
    email: 'marcus.brody@example.com',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  }
];

// Helper to calculate relative stable dates
const now = Date.now();
const oneDayAgo = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString();
const twentyDaysAgo = new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString();
const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();

export const SEED_ORDERS: Order[] = [
  // 1. Damaged Dress scenario: Shein Designs, delivered 1 day ago
  {
    id: 'd1111111-1111-1111-1111-111111111111',
    brand_id: '11111111-1111-1111-1111-111111111111',
    customer_id: 'c1111111-1111-1111-1111-111111111111',
    order_number: 'SD-1001',
    status: 'delivered',
    delivered_at: oneDayAgo,
    items_json: [
      { sku: 'SD-DRS-01', name: 'Floral Silk Chiffon Midi Dress', quantity: 1, price: 58.0 }
    ],
    total_amount: 58.0,
    currency: 'USD',
    created_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  // 2. 20-Day Refund Window violation: Shein Designs, delivered 20 days ago (window is 7 days)
  {
    id: 'd2222222-2222-2222-2222-222222222222',
    brand_id: '11111111-1111-1111-1111-111111111111',
    customer_id: 'c2222222-2222-2222-2222-222222222222',
    order_number: 'SD-1002',
    status: 'delivered',
    delivered_at: twentyDaysAgo,
    items_json: [
      { sku: 'SD-JKT-04', name: 'Vintage Denim Trucker Jacket', quantity: 1, price: 74.0 }
    ],
    total_amount: 74.0,
    currency: 'USD',
    created_at: new Date(now - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  // 3. Unknown delivery date scenario: Watford Leathers, shipped, delivered_at is null
  {
    id: 'd3333333-3333-3333-3333-333333333333',
    brand_id: '22222222-2222-2222-2222-222222222222',
    customer_id: 'c3333333-3333-3333-3333-333333333333',
    order_number: 'WL-2001',
    status: 'shipped',
    delivered_at: null,
    items_json: [
      { sku: 'WL-BAG-15', name: 'Full-Grain Leather Messenger Bag - Cognac', quantity: 1, price: 185.0 }
    ],
    total_amount: 185.0,
    currency: 'USD',
    created_at: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  // 4. Out of scope / Unrelated Question scenario: Watford Leathers, delivered 3 days ago
  {
    id: 'd4444444-4444-4444-4444-444444444444',
    brand_id: '22222222-2222-2222-2222-222222222222',
    customer_id: 'c4444444-4444-4444-4444-444444444444',
    order_number: 'WL-2002',
    status: 'delivered',
    delivered_at: threeDaysAgo,
    items_json: [
      { sku: 'WL-BOT-09', name: 'Handcrafted Leather Chelsea Boots - Espresso', quantity: 1, price: 210.0 }
    ],
    total_amount: 210.0,
    currency: 'USD',
    created_at: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    brand_id: '11111111-1111-1111-1111-111111111111',
    customer_id: 'c1111111-1111-1111-1111-111111111111',
    order_id: 'd1111111-1111-1111-1111-111111111111',
    status: 'open',
    version: 1,
    created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'e2222222-2222-2222-2222-222222222222',
    brand_id: '11111111-1111-1111-1111-111111111111',
    customer_id: 'c2222222-2222-2222-2222-222222222222',
    order_id: 'd2222222-2222-2222-2222-222222222222',
    status: 'open',
    version: 1,
    created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'e3333333-3333-3333-3333-333333333333',
    brand_id: '22222222-2222-2222-2222-222222222222',
    customer_id: 'c3333333-3333-3333-3333-333333333333',
    order_id: 'd3333333-3333-3333-3333-333333333333',
    status: 'open',
    version: 1,
    created_at: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'e4444444-4444-4444-4444-444444444444',
    brand_id: '22222222-2222-2222-2222-222222222222',
    customer_id: 'c4444444-4444-4444-4444-444444444444',
    order_id: 'd4444444-4444-4444-4444-444444444444',
    status: 'open',
    version: 1,
    created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now - 5 * 60 * 60 * 1000).toISOString()
  }
];

export const SEED_MESSAGES: Message[] = [
  // 1. Different Colour / Return Request (Shein Designs)
  {
    id: 'm-001',
    brand_id: '11111111-1111-1111-1111-111111111111',
    conversation_id: 'e1111111-1111-1111-1111-111111111111',
    sender_type: 'customer',
    body: 'Hello, I received order SD-1001 yesterday. The silk midi dress is a different colour than I expected from the photos online, and I would like to return it. Could you please guide me on how to proceed?',
    client_request_id: 'seed-msg-001',
    created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString()
  },
  // 2. 20-Day Refund Window violation (Shein Designs)
  {
    id: 'm-002',
    brand_id: '11111111-1111-1111-1111-111111111111',
    conversation_id: 'e2222222-2222-2222-2222-222222222222',
    sender_type: 'customer',
    body: 'Hi, I received order SD-1002 about 20 days ago. The denim jacket is nice but fits a bit too loose, and I would like to return it for a full refund.',
    client_request_id: 'seed-msg-002',
    created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString()
  },
  // 3. Unknown delivery date inquiry (Watford Leathers)
  {
    id: 'm-003',
    brand_id: '22222222-2222-2222-2222-222222222222',
    conversation_id: 'e3333333-3333-3333-3333-333333333333',
    sender_type: 'customer',
    body: 'Hello, I ordered the Watford leather messenger bag (WL-2001). If it arrives and does not fit my 15-inch laptop sleeve, what is your refund process?',
    client_request_id: 'seed-msg-003',
    created_at: new Date(now - 4 * 60 * 60 * 1000).toISOString()
  },
  // 4. Out of scope query / no relevant knowledge (Watford Leathers)
  {
    id: 'm-004',
    brand_id: '22222222-2222-2222-2222-222222222222',
    conversation_id: 'e4444444-4444-4444-4444-444444444444',
    sender_type: 'customer',
    body: 'Hi there! Does Watford Leathers offer custom bespoke equestrian saddles or horse tack?',
    client_request_id: 'seed-msg-004',
    created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString()
  }
];
