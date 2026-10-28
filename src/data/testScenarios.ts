export interface TestCaseScenario {
  id: string;
  brandId: string;
  brandName: 'Shein Designs' | 'Watford Leathers';
  category: 'Valid Return' | 'Window Expired' | 'Missing Info' | 'Damage Claim' | 'Out of Scope' | 'Borderline Ambiguity';
  badge: string;
  orderNumber?: string;
  customerName: string;
  customerEmail: string;
  title: string;
  description: string;
  query: string;
  expectedBehavior: string;
}

export const CURATED_TEST_CASES: TestCaseScenario[] = [
  {
    id: 'tc-01',
    brandId: '11111111-1111-1111-1111-111111111111',
    brandName: 'Shein Designs',
    category: 'Valid Return',
    badge: 'Within Window',
    orderNumber: 'SD-1001',
    customerName: 'Emma Vance',
    customerEmail: 'emma.vance@example.com',
    title: 'Colour Difference & Return Inquiry',
    description: 'Delivered yesterday. Wants return without replacement promise; support team will follow up.',
    query: 'Hello, I received order SD-1001 yesterday. The silk midi dress is a different colour than I expected from the photos online, and I would like to return it. Could you please guide me on how to proceed?',
    expectedBehavior: 'Grounded in 7-day return policy. Confirms team review without promising replacement.'
  },
  {
    id: 'tc-02',
    brandId: '11111111-1111-1111-1111-111111111111',
    brandName: 'Shein Designs',
    category: 'Window Expired',
    badge: '7-Day Expired',
    orderNumber: 'SD-1002',
    customerName: 'Liam Chen',
    customerEmail: 'liam.chen@example.com',
    title: '20-Day Refund Window Violation',
    description: 'Delivered 20 days ago. Exceeds the 7-day refund window.',
    query: 'Hi, I received order SD-1002 about 20 days ago. The denim jacket is nice but fits a bit too loose, and I would like to return it for a full refund.',
    expectedBehavior: 'Politely declines return/refund due to exceeding the 7-day policy limit.'
  },
  {
    id: 'tc-03',
    brandId: '22222222-2222-2222-2222-222222222222',
    brandName: 'Watford Leathers',
    category: 'Missing Info',
    badge: 'In Transit',
    orderNumber: 'WL-2001',
    customerName: 'Sophia Patel',
    customerEmail: 'sophia.patel@example.com',
    title: 'In-Transit Messenger Bag Refund Inquiry',
    description: 'Delivered date is unconfirmed. Delivery date must be verified first.',
    query: 'Hello, I ordered the Watford leather messenger bag (WL-2001). If it arrives and does not fit my 15-inch laptop sleeve, what is your refund process?',
    expectedBehavior: 'Flags needs_information asking customer to confirm delivery date upon arrival.'
  },
  {
    id: 'tc-04',
    brandId: '22222222-2222-2222-2222-222222222222',
    brandName: 'Watford Leathers',
    category: 'Damage Claim',
    badge: 'Requires Photos',
    orderNumber: 'WL-2002',
    customerName: 'Marcus Brody',
    customerEmail: 'marcus.brody@example.com',
    title: 'Scratched Leather Boots Damage Report',
    description: 'Delivered 3 days ago. Watford policy mandates photo proof of defect and outer packaging.',
    query: 'I received order #WL-2002 3 days ago. The Chelsea boots have deep scratches and scuffs across the leather. How can I get a replacement?',
    expectedBehavior: 'Requests photographic proof of leather defect and outer packaging per 7-day rule.'
  },
  {
    id: 'tc-05',
    brandId: '22222222-2222-2222-2222-222222222222',
    brandName: 'Watford Leathers',
    category: 'Out of Scope',
    badge: 'No Knowledge',
    customerName: 'Marcus Brody',
    customerEmail: 'marcus.brody@example.com',
    title: 'Custom Equestrian Saddles / Tack',
    description: 'Query outside brand product line. Model must not hallucinate policies.',
    query: 'Hi there! Does Watford Leathers offer custom bespoke equestrian saddles or horse tack?',
    expectedBehavior: 'Politely explains out-of-scope inquiry without fabricating store policies.'
  },
  {
    id: 'tc-06',
    brandId: '22222222-2222-2222-2222-222222222222',
    brandName: 'Watford Leathers',
    category: 'Borderline Ambiguity',
    badge: 'Razor-Thin 1-Pt',
    customerName: 'Alex Turner',
    customerEmail: 'alex.turner@example.com',
    title: 'Zipper on Leather Pouch (Watford wins 6-5)',
    description: 'Zipper (+5 apparel) vs Leather (+6 leather). Tests 1-point difference auto-detection.',
    query: 'The metal zipper on my leather pouch broke.',
    expectedBehavior: 'Auto-detects Watford Leathers with 72% confidence based on leather weight.'
  },
  {
    id: 'tc-07',
    brandId: '22222222-2222-2222-2222-222222222222',
    brandName: 'Watford Leathers',
    category: 'Borderline Ambiguity',
    badge: 'Misleading Paradox',
    customerName: 'Chloe Bennett',
    customerEmail: 'chloe.bennett@example.com',
    title: 'Silk Dress with Leather Strap (Watford wins 11-9)',
    description: 'Silk dress (+9 Shein) vs Leather strap (+11 Watford).',
    query: 'My silk dress has a scuffed leather strap that I want to return.',
    expectedBehavior: 'Auto-detects Watford Leathers (11 pts) due to combined leather + strap keywords.'
  },
  {
    id: 'tc-08',
    brandId: '11111111-1111-1111-1111-111111111111',
    brandName: 'Shein Designs',
    category: 'Borderline Ambiguity',
    badge: '11-11 Dead Heat',
    customerName: 'Jordan Reed',
    customerEmail: 'jordan.reed@example.com',
    title: 'Apparel with Zipper & Leather Buckle (11-11 Tie)',
    description: 'Apparel + zipper (+11) vs Leather + buckle (+11). Tests tie-breaker default fallback.',
    query: 'I received an apparel order with a defective zipper and a leather buckle.',
    expectedBehavior: 'Exact tie triggers default fallback with 50% baseline confidence.'
  }
];
