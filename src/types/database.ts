export type Role = 'agent' | 'admin';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface BrandMembership {
  id: string;
  brand_id: string;
  user_id: string;
  role: Role;
  created_at: string;
}

export interface Customer {
  id: string;
  brand_id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
}

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface Order {
  id: string;
  brand_id: string;
  customer_id: string;
  order_number: string;
  status: OrderStatus;
  delivered_at: string | null;
  items_json: OrderItem[];
  total_amount: number;
  currency: string;
  created_at: string;
}

export type ConversationStatus = 'open' | 'pending_approval' | 'resolved' | 'closed';

export interface Conversation {
  id: string;
  brand_id: string;
  customer_id: string;
  order_id: string | null;
  status: ConversationStatus;
  version: number;
  created_at: string;
  updated_at: string;
}

export type SenderType = 'customer' | 'agent';

export interface Message {
  id: string;
  brand_id: string;
  conversation_id: string;
  sender_type: SenderType;
  body: string;
  client_request_id: string;
  created_at: string;
}

export type KBCategory = 'returns' | 'refunds' | 'shipping' | 'cancellation' | 'damage';

export interface PolicyRules {
  window_days?: number;
  report_hours?: number;
  report_days?: number;
  cancel_window_hours?: number;
  delivery_days_min?: number;
  delivery_days_max?: number;
  processing_days_min?: number;
  processing_days_max?: number;
  requires_photos?: boolean;
  requires_order_ref?: boolean;
  requires_inspection?: boolean;
  allowed_before_dispatch?: boolean;
  [key: string]: unknown;
}

export interface KBEntry {
  id: string;
  brand_id: string;
  title: string;
  category: KBCategory;
  content: string;
  rules_json: PolicyRules;
  active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export type GenerationStatus = 'grounded' | 'needs_information' | 'no_relevant_knowledge' | 'policy_conflict';

export interface AIGenerationResponse {
  status: GenerationStatus;
  draft: string;
  used_policy_ids: string[];
  missing_information: string[];
  warnings: string[];
}

export interface AIGeneration {
  id: string;
  brand_id: string;
  conversation_id: string;
  trigger_message_id: string | null;
  status: GenerationStatus;
  model: string;
  prompt_version: string;
  original_response: string;
  usage_json: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    estimated_cost_usd?: number;
    latency_ms?: number;
  };
  created_at: string;
}

export interface GenerationSource {
  id: string;
  generation_id: string;
  policy_id: string | null;
  policy_version: number;
  content_snapshot: string;
  created_at: string;
}

export interface ReplyReview {
  id: string;
  generation_id: string;
  agent_id: string;
  edited_response: string;
  approved_at: string;
  final_message_id: string | null;
  created_at: string;
}
