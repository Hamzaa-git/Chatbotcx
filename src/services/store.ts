import {
  Brand,
  BrandMembership,
  Customer,
  Order,
  Conversation,
  ConversationStatus,
  Message,
  KBEntry,
  AIGeneration,
  GenerationSource,
  ReplyReview,
  KBCategory,
  PolicyRules
} from '../types/database';
import {
  SEED_BRANDS,
  SEED_MEMBERSHIPS,
  SEED_CUSTOMERS,
  SEED_ORDERS,
  SEED_CONVERSATIONS,
  SEED_MESSAGES,
  SEED_KB_ENTRIES
} from '../data/seedData';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

export const DEMO_USERS: Record<string, CurrentUser> = {
  admin: {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    email: 'admin@cx-copilot.demo',
    name: 'Sarah Connor (Admin)'
  },
  agent: {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    email: 'agent@cx-copilot.demo',
    name: 'Alex Mercer (Support Agent)'
  },
  singleBrandAgent: {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    email: 'shein-only@cx-copilot.demo',
    name: 'Riley Vance (Shein Designs Only Agent)'
  }
};

/**
 * Enterprise In-Memory & LocalStorage Database Store
 * Implements strict multi-tenant authorization, RLS simulation,
 * version increments, idempotency deduplication, and atomic review dispatch.
 */
class CopilotDataStore {
  private brands: Brand[] = [];
  private memberships: BrandMembership[] = [];
  private customers: Customer[] = [];
  private orders: Order[] = [];
  private conversations: Conversation[] = [];
  private messages: Message[] = [];
  private kbEntries: KBEntry[] = [];
  private aiGenerations: AIGeneration[] = [];
  private generationSources: GenerationSource[] = [];
  private replyReviews: ReplyReview[] = [];

  constructor() {
    const loaded = this.loadFromStorage();
    if (!loaded) {
      this.resetToSeed();
    }
  }

  public saveToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const payload = {
        brands: this.brands,
        memberships: this.memberships,
        customers: this.customers,
        orders: this.orders,
        conversations: this.conversations,
        messages: this.messages,
        kbEntries: this.kbEntries,
        aiGenerations: this.aiGenerations,
        generationSources: this.generationSources,
        replyReviews: this.replyReviews
      };
      window.localStorage.setItem('cx_copilot_store_data', JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  public loadFromStorage(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      const raw = window.localStorage.getItem('cx_copilot_store_data');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.brands) || parsed.brands.length === 0) return false;
      this.brands = parsed.brands || [];
      this.memberships = parsed.memberships || [];
      this.customers = parsed.customers || [];
      this.orders = parsed.orders || [];
      this.conversations = parsed.conversations || [];
      this.messages = parsed.messages || [];
      this.kbEntries = parsed.kbEntries || [];
      this.aiGenerations = parsed.aiGenerations || [];
      this.generationSources = parsed.generationSources || [];
      this.replyReviews = parsed.replyReviews || [];
      return true;
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
      return false;
    }
  }

  public resetToFresh(): void {
    this.brands = JSON.parse(JSON.stringify(SEED_BRANDS));
    this.memberships = JSON.parse(JSON.stringify(SEED_MEMBERSHIPS));
    this.customers = JSON.parse(JSON.stringify(SEED_CUSTOMERS));
    this.orders = JSON.parse(JSON.stringify(SEED_ORDERS));
    this.conversations = [];
    this.messages = [];
    this.kbEntries = JSON.parse(JSON.stringify(SEED_KB_ENTRIES));
    this.aiGenerations = [];
    this.generationSources = [];
    this.replyReviews = [];
    this.saveToStorage();
  }

  public resetToSeed(): void {
    this.brands = JSON.parse(JSON.stringify(SEED_BRANDS));
    this.memberships = JSON.parse(JSON.stringify(SEED_MEMBERSHIPS));
    this.customers = JSON.parse(JSON.stringify(SEED_CUSTOMERS));
    this.orders = JSON.parse(JSON.stringify(SEED_ORDERS));
    this.conversations = JSON.parse(JSON.stringify(SEED_CONVERSATIONS));
    this.messages = JSON.parse(JSON.stringify(SEED_MESSAGES));
    this.kbEntries = JSON.parse(JSON.stringify(SEED_KB_ENTRIES));
    this.aiGenerations = [];
    this.generationSources = [];
    this.replyReviews = [];
    this.saveToStorage();
  }

  // ==========================================
  // Authorization & Membership Helpers (RLS)
  // ==========================================
  public checkBrandAccess(userId: string | null | undefined, brandId: string): BrandMembership {
    if (!userId) {
      throw new Error('401 Unauthorized: User is not authenticated.');
    }
    const membership = this.memberships.find(
      (m) => m.user_id === userId && m.brand_id === brandId
    );
    if (!membership) {
      throw new Error(`403 Forbidden: User does not possess membership in brand '${brandId}'. Direct cross-tenant access denied.`);
    }
    return membership;
  }

  public checkAdminAccess(userId: string | null | undefined, brandId: string): BrandMembership {
    const membership = this.checkBrandAccess(userId, brandId);
    if (membership.role !== 'admin') {
      throw new Error(`403 Forbidden: Admin privileges required for brand '${brandId}'. User role is '${membership.role}'.`);
    }
    return membership;
  }

  // ==========================================
  // Brand Queries
  // ==========================================
  public getAuthorizedBrands(userId: string | null | undefined): Brand[] {
    if (!userId) return [];
    const authorizedBrandIds = new Set(
      this.memberships.filter((m) => m.user_id === userId).map((m) => m.brand_id)
    );
    return this.brands.filter((b) => authorizedBrandIds.has(b.id));
  }

  public getBrandById(userId: string | null | undefined, brandId: string): Brand {
    this.checkBrandAccess(userId, brandId);
    const brand = this.brands.find((b) => b.id === brandId);
    if (!brand) throw new Error(`Brand not found: ${brandId}`);
    return brand;
  }

  // ==========================================
  // Conversation & Order Queries
  // ==========================================
  public getConversations(
    userId: string | null | undefined,
    brandId: string
  ): Array<Conversation & { customer: Customer; order: Order | null; latestMessage: Message | null; brandName?: string }> {
    if (brandId === 'all') {
      if (!userId) {
        throw new Error('401 Unauthorized: Valid user session required to access conversations.');
      }
      const authorizedBrands = this.getAuthorizedBrands(userId);
      if (authorizedBrands.length === 0) {
        throw new Error('403 Forbidden: User does not possess membership in any brand.');
      }
      const authorizedBrandIds = new Set(authorizedBrands.map((b) => b.id));
      return this.conversations
        .filter((c) => authorizedBrandIds.has(c.brand_id))
        .map((conv) => {
          const customer = this.customers.find((c) => c.id === conv.customer_id)!;
          const order = this.orders.find((o) => o.id === conv.order_id) || null;
          const brand = this.brands.find((b) => b.id === conv.brand_id);
          const convMessages = this.messages
            .filter((m) => m.conversation_id === conv.id)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          const latestMessage = convMessages.length > 0 ? convMessages[convMessages.length - 1] : null;

          return {
            ...conv,
            customer,
            order,
            latestMessage,
            brandName: brand?.name
          };
        });
    }

    this.checkBrandAccess(userId, brandId);
    const brand = this.brands.find((b) => b.id === brandId);
    return this.conversations
      .filter((c) => c.brand_id === brandId)
      .map((conv) => {
        const customer = this.customers.find((c) => c.id === conv.customer_id)!;
        const order = this.orders.find((o) => o.id === conv.order_id) || null;
        const convMessages = this.messages
          .filter((m) => m.conversation_id === conv.id)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const latestMessage = convMessages.length > 0 ? convMessages[convMessages.length - 1] : null;

        return {
          ...conv,
          customer,
          order,
          latestMessage,
          brandName: brand?.name
        };
      });
  }

  public getConversationContext(
    userId: string | null | undefined,
    conversationId: string
  ): {
    conversation: Conversation;
    brand: Brand;
    customer: Customer;
    order: Order | null;
    messages: Message[];
  } {
    const conversation = this.conversations.find((c) => c.id === conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    // Verify authorized brand access through conversation record
    this.checkBrandAccess(userId, conversation.brand_id);

    const brand = this.brands.find((b) => b.id === conversation.brand_id)!;
    const customer = this.customers.find((c) => c.id === conversation.customer_id)!;
    const order = this.orders.find((o) => o.id === conversation.order_id) || null;
    const messages = this.messages
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return {
      conversation,
      brand,
      customer,
      order,
      messages
    };
  }

  // ==========================================
  // Messaging & Customer Simulator
  // ==========================================
  public sendMessage(
    userId: string | null | undefined,
    conversationId: string,
    senderType: 'customer' | 'agent',
    body: string,
    clientRequestId: string
  ): Message {
    const conversation = this.conversations.find((c) => c.id === conversationId);
    if (!conversation) throw new Error(`Conversation not found: ${conversationId}`);

    // Authorize caller
    this.checkBrandAccess(userId, conversation.brand_id);

    // Idempotency check: if client_request_id already exists for this conversation, return existing
    const existing = this.messages.find(
      (m) => m.conversation_id === conversationId && m.client_request_id === clientRequestId
    );
    if (existing) {
      return existing;
    }

    if (!body || body.trim().length === 0) {
      throw new Error('Message body cannot be empty.');
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      brand_id: conversation.brand_id,
      conversation_id: conversationId,
      sender_type: senderType,
      body: body.trim(),
      client_request_id: clientRequestId,
      created_at: new Date().toISOString()
    };

    this.messages.push(newMessage);

    // Increment conversation version (triggers staleness on pending AI drafts)
    conversation.version += 1;
    conversation.updated_at = new Date().toISOString();

    this.saveToStorage();
    return newMessage;
  }

  public switchConversationBrand(conversationId: string, newBrandId: string): void {
    const conversation = this.conversations.find((c) => c.id === conversationId);
    if (!conversation) return;
    const targetBrand = this.brands.find((b) => b.id === newBrandId);
    if (!targetBrand) return;

    conversation.brand_id = newBrandId;
    conversation.version += 1;
    conversation.updated_at = new Date().toISOString();

    this.messages.forEach((m) => {
      if (m.conversation_id === conversationId) {
        m.brand_id = newBrandId;
      }
    });
    this.saveToStorage();
  }

  public updateConversationStatus(
    userId: string | null | undefined,
    conversationId: string,
    status: ConversationStatus
  ): Conversation {
    const conversation = this.conversations.find((c) => c.id === conversationId);
    if (!conversation) throw new Error(`Conversation not found: ${conversationId}`);

    this.checkBrandAccess(userId, conversation.brand_id);

    conversation.status = status;
    conversation.version += 1;
    conversation.updated_at = new Date().toISOString();
    this.saveToStorage();
    return conversation;
  }

  public linkOrderToConversation(conversationId: string, orderNumber: string): Order | null {
    const conversation = this.conversations.find((c) => c.id === conversationId);
    if (!conversation) return null;

    const cleanOrderNum = orderNumber.trim().replace(/^#/, '').toUpperCase();
    let order = this.orders.find(
      (o) => o.order_number.toUpperCase() === cleanOrderNum
    );

    if (order) {
      conversation.order_id = order.id;
      if (order.brand_id !== conversation.brand_id) {
        this.switchConversationBrand(conversationId, order.brand_id);
      }
      return order;
    }

    // Enforce valid brand order prefix guardrail (SD- for Shein Designs, WL- for Watford Leathers)
    let brandId = conversation.brand_id;
    if (/^SD[-\s]?/i.test(cleanOrderNum)) {
      const shein = this.brands.find((b) => b.slug === 'shein-designs');
      if (shein) brandId = shein.id;
    } else if (/^WL[-\s]?/i.test(cleanOrderNum)) {
      const watford = this.brands.find((b) => b.slug === 'watford-leathers');
      if (watford) brandId = watford.id;
    } else {
      // Invalid/unrecognized order reference (e.g. XYZ-1234)
      return null;
    }

    const brand = this.brands.find((b) => b.id === brandId) || this.brands[0];
    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      brand_id: brandId,
      customer_id: conversation.customer_id,
      order_number: cleanOrderNum,
      status: 'delivered',
      delivered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      total_amount: 45.00,
      currency: 'USD',
      items_json: [
        {
          sku: `${brand.slug.toUpperCase()}-ITEM`,
          name: `${brand.name} Order Item`,
          quantity: 1,
          price: 45.00
        }
      ],
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    };

    this.orders.push(newOrder);
    conversation.order_id = newOrder.id;
    if (brandId !== conversation.brand_id) {
      this.switchConversationBrand(conversationId, brandId);
    }
    return newOrder;
  }

  // ==========================================
  // Knowledge Base CRUD (Admin Authorized)
  // ==========================================
  public getPolicies(userId: string | null | undefined, brandId: string): KBEntry[] {
    this.checkBrandAccess(userId, brandId);
    return this.kbEntries.filter((p) => p.brand_id === brandId);
  }

  public createPolicy(
    userId: string | null | undefined,
    brandId: string,
    data: {
      title: string;
      category: KBCategory;
      content: string;
      rules_json?: PolicyRules;
    }
  ): KBEntry {
    this.checkAdminAccess(userId, brandId);

    if (!data.title || !data.content) {
      throw new Error('Title and content are required.');
    }

    const newPolicy: KBEntry = {
      id: `kb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      brand_id: brandId,
      title: data.title.trim(),
      category: data.category,
      content: data.content.trim(),
      rules_json: data.rules_json || {},
      active: true,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.kbEntries.push(newPolicy);
    this.saveToStorage();
    return newPolicy;
  }

  public updatePolicy(
    userId: string | null | undefined,
    policyId: string,
    updates: {
      title?: string;
      category?: KBCategory;
      content?: string;
      rules_json?: PolicyRules;
      active?: boolean;
    }
  ): KBEntry {
    const policy = this.kbEntries.find((p) => p.id === policyId);
    if (!policy) throw new Error(`Policy not found: ${policyId}`);

    this.checkAdminAccess(userId, policy.brand_id);

    // Apply updates and increment version
    if (updates.title !== undefined) policy.title = updates.title.trim();
    if (updates.category !== undefined) policy.category = updates.category;
    if (updates.content !== undefined) policy.content = updates.content.trim();
    if (updates.rules_json !== undefined) policy.rules_json = updates.rules_json;
    if (updates.active !== undefined) policy.active = updates.active;

    policy.version += 1;
    policy.updated_at = new Date().toISOString();
    this.saveToStorage();

    return policy;
  }

  public deletePolicy(userId: string | null | undefined, policyId: string): { success: boolean; softDeleted: boolean } {
    const policy = this.kbEntries.find((p) => p.id === policyId);
    if (!policy) throw new Error(`Policy not found: ${policyId}`);

    this.checkAdminAccess(userId, policy.brand_id);

    // Soft delete by marking active = false to preserve historical snapshot integrity
    policy.active = false;
    policy.version += 1;
    policy.updated_at = new Date().toISOString();
    this.saveToStorage();

    return { success: true, softDeleted: true };
  }

  // ==========================================
  // AI Generation & Source Persistence
  // ==========================================
  public saveAIGeneration(
    userId: string | null | undefined,
    conversationId: string,
    generationData: {
      triggerMessageId: string | null;
      status: 'grounded' | 'needs_information' | 'no_relevant_knowledge' | 'policy_conflict';
      model: string;
      promptVersion: string;
      originalResponse: string;
      usageJson: Record<string, unknown>;
      sources: Array<{
        policyId: string | null;
        policyVersion: number;
        contentSnapshot: string;
      }>;
    }
  ): { generation: AIGeneration; sources: GenerationSource[] } {
    const conversation = this.conversations.find((c) => c.id === conversationId);
    if (!conversation) throw new Error(`Conversation not found: ${conversationId}`);

    this.checkBrandAccess(userId, conversation.brand_id);

    const generationId = `gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const generation: AIGeneration = {
      id: generationId,
      brand_id: conversation.brand_id,
      conversation_id: conversationId,
      trigger_message_id: generationData.triggerMessageId,
      status: generationData.status,
      model: generationData.model,
      prompt_version: generationData.promptVersion,
      original_response: generationData.originalResponse,
      usage_json: generationData.usageJson,
      created_at: new Date().toISOString()
    };

    this.aiGenerations.push(generation);

    const createdSources: GenerationSource[] = generationData.sources.map((s) => {
      const sourceRecord: GenerationSource = {
        id: `src-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        generation_id: generationId,
        policy_id: s.policyId,
        policy_version: s.policyVersion,
        content_snapshot: s.contentSnapshot,
        created_at: new Date().toISOString()
      };
      this.generationSources.push(sourceRecord);
      return sourceRecord;
    });

    this.saveToStorage();
    return { generation, sources: createdSources };
  }

  public getGenerationAudit(
    userId: string | null | undefined,
    conversationId: string
  ): Array<AIGeneration & { sources: GenerationSource[]; review: ReplyReview | null }> {
    const conversation = this.conversations.find((c) => c.id === conversationId);
    if (!conversation) throw new Error(`Conversation not found: ${conversationId}`);

    this.checkBrandAccess(userId, conversation.brand_id);

    return this.aiGenerations
      .filter((g) => g.conversation_id === conversationId)
      .map((gen) => {
        const sources = this.generationSources.filter((s) => s.generation_id === gen.id);
        const review = this.replyReviews.find((r) => r.generation_id === gen.id) || null;
        return {
          ...gen,
          sources,
          review
        };
      });
  }

  // ==========================================
  // Review, Approval & Sending Lifecycle
  // ==========================================
  public approveReply(
    userId: string | null | undefined,
    generationId: string,
    editedResponse: string
  ): ReplyReview {
    const generation = this.aiGenerations.find((g) => g.id === generationId);
    if (!generation) throw new Error(`Generation not found: ${generationId}`);

    this.checkBrandAccess(userId, generation.brand_id);

    if (!editedResponse || editedResponse.trim().length === 0) {
      throw new Error('Approved response text cannot be empty.');
    }

    // Save or update review record
    let review = this.replyReviews.find((r) => r.generation_id === generationId);
    if (!review) {
      review = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        generation_id: generationId,
        agent_id: userId!,
        edited_response: editedResponse.trim(),
        approved_at: new Date().toISOString(),
        final_message_id: null,
        created_at: new Date().toISOString()
      };
      this.replyReviews.push(review);
    } else {
      review.agent_id = userId!;
      review.edited_response = editedResponse.trim();
      review.approved_at = new Date().toISOString();
    }

    this.saveToStorage();
    return review;
  }

  public sendApprovedReply(
    userId: string | null | undefined,
    reviewId: string,
    clientRequestId: string,
    expectedConversationVersion: number
  ): { message: Message; review: ReplyReview } {
    const review = this.replyReviews.find((r) => r.id === reviewId);
    if (!review) throw new Error(`Review record not found: ${reviewId}`);

    const generation = this.aiGenerations.find((g) => g.id === review.generation_id);
    if (!generation) throw new Error(`Linked generation not found for review: ${reviewId}`);

    const conversation = this.conversations.find((c) => c.id === generation.conversation_id);
    if (!conversation) throw new Error(`Linked conversation not found: ${generation.conversation_id}`);

    this.checkBrandAccess(userId, generation.brand_id);

    // Deduplication check
    if (review.final_message_id) {
      const existingMessage = this.messages.find((m) => m.id === review.final_message_id);
      if (existingMessage) {
        return { message: existingMessage, review };
      }
    }

    // Idempotency by client_request_id
    const duplicateMessage = this.messages.find(
      (m) => m.conversation_id === conversation.id && m.client_request_id === clientRequestId
    );
    if (duplicateMessage) {
      review.final_message_id = duplicateMessage.id;
      return { message: duplicateMessage, review };
    }

    // Staleness Guard: check if newer customer messages or changes occurred
    if (conversation.version !== expectedConversationVersion) {
      throw new Error(
        `Stale Draft Rejected: The conversation has received new updates (current version: ${conversation.version}, expected: ${expectedConversationVersion}). Please regenerate the AI suggestion.`
      );
    }

    // Atomic creation of final agent message and review linkage
    const finalMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      brand_id: generation.brand_id,
      conversation_id: conversation.id,
      sender_type: 'agent',
      body: review.edited_response,
      client_request_id: clientRequestId,
      created_at: new Date().toISOString()
    };

    this.messages.push(finalMessage);
    review.final_message_id = finalMessage.id;

    conversation.version += 1;
    conversation.updated_at = new Date().toISOString();
    this.saveToStorage();

    return { message: finalMessage, review };
  }

  // ==========================================
  // Live Ticket Ingestion & Company Auto-Detection
  // ==========================================
  public clearConversations(userId: string | null | undefined, brandId?: string): void {
    if (!userId) throw new Error('401 Unauthorized');
    if (brandId) {
      this.checkBrandAccess(userId, brandId);
      const convIdsToDelete = new Set(this.conversations.filter((c) => c.brand_id === brandId).map((c) => c.id));
      this.conversations = this.conversations.filter((c) => c.brand_id !== brandId);
      this.messages = this.messages.filter((m) => !convIdsToDelete.has(m.conversation_id));
      const genIdsToDelete = new Set(this.aiGenerations.filter((g) => convIdsToDelete.has(g.conversation_id)).map((g) => g.id));
      this.aiGenerations = this.aiGenerations.filter((g) => !convIdsToDelete.has(g.conversation_id));
      this.generationSources = this.generationSources.filter((s) => !genIdsToDelete.has(s.generation_id));
      this.replyReviews = this.replyReviews.filter((r) => !genIdsToDelete.has(r.generation_id));
    } else {
      const authorizedBrandIds = new Set(this.getAuthorizedBrands(userId).map((b) => b.id));
      const convIdsToDelete = new Set(this.conversations.filter((c) => authorizedBrandIds.has(c.brand_id)).map((c) => c.id));
      this.conversations = this.conversations.filter((c) => !authorizedBrandIds.has(c.brand_id));
      this.messages = this.messages.filter((m) => !convIdsToDelete.has(m.conversation_id));
      const genIdsToDelete = new Set(this.aiGenerations.filter((g) => convIdsToDelete.has(g.conversation_id)).map((g) => g.id));
      this.aiGenerations = this.aiGenerations.filter((g) => !convIdsToDelete.has(g.conversation_id));
      this.generationSources = this.generationSources.filter((s) => !genIdsToDelete.has(s.generation_id));
      this.replyReviews = this.replyReviews.filter((r) => !genIdsToDelete.has(r.generation_id));
    }
    this.saveToStorage();
  }

  public detectBrandFromQuery(query: string, currentBrandId?: string): {
    brand: Brand | null;
    confidence: number;
    reason: string;
    matchedKeywords: string[];
  } {
    if (!query || query.trim().length === 0) {
      return { brand: null, confidence: 0, reason: 'Empty query', matchedKeywords: [] };
    }

    const lower = query.toLowerCase();
    const shein = this.brands.find((b) => b.slug === 'shein-designs' || b.slug === 'glassleaf') || this.brands[0];
    const watford = this.brands.find((b) => b.slug === 'watford-leathers' || b.slug === 'puresip') || this.brands[1];

    let sheinScore = 0;
    const sheinMatches: string[] = [];
    let watfordScore = 0;
    const watfordMatches: string[] = [];

    // Shein Designs (Clothes & Apparel)
    const sdPatterns = [
      { pattern: /\bshein\b/i, weight: 10, label: 'brand: shein' },
      { pattern: /\bshein designs\b/i, weight: 12, label: 'brand: shein designs' },
      { pattern: /\bglassleaf\b/i, weight: 10, label: 'brand: glassleaf' },
      { pattern: /\b(clothes|clothing|apparel|wear|outfit|garment)\b/i, weight: 6, label: 'category: apparel' },
      { pattern: /\b(dress|midi dress|maxi dress|gown|skirt|blouse|shirt|t-shirt|tee|top|hoodie|sweater|cardigan)\b/i, weight: 5, label: 'product: garment' },
      { pattern: /\b(denim|pants|jeans|trousers|shorts|leggings|suit|blazer|coat)\b/i, weight: 4, label: 'product: apparel' },
      { pattern: /\b(fabric|cotton|silk|chiffon|wool|linen|polyester|spandex|satin|lace)\b/i, weight: 4, label: 'material: fabric' },
      { pattern: /\b(zipper|seam|hem|stitch|stitching|thread|button|sleeve|collar|tags attached|unworn)\b/i, weight: 5, label: 'apparel feature' },
      { pattern: /\b(size|sizing|fitted|too small|too large|extra small|small|medium|large|xl)\b/i, weight: 4, label: 'apparel sizing' },
      { pattern: /\b(sd[-_\s]?\d{3,8})\b/i, weight: 20, label: 'order prefix: SD-' },
      { pattern: /\bsd-\d+/i, weight: 20, label: 'order prefix: SD-' },
      { pattern: /\bgl-\d+/i, weight: 10, label: 'order prefix: GL-' },
      { pattern: /\b(torn seam|broken zipper|fabric tear|ripped|color difference|colour difference|stain on dress)\b/i, weight: 6, label: 'damage: garment flaw' },
    ];

    // Watford Leathers (Leather Goods)
    const wlPatterns = [
      { pattern: /\bwatford\b/i, weight: 10, label: 'brand: watford' },
      { pattern: /\bwatford leathers\b/i, weight: 12, label: 'brand: watford leathers' },
      { pattern: /\bpuresip\b/i, weight: 10, label: 'brand: puresip' },
      { pattern: /\bleather\b/i, weight: 7, label: 'category: leather' },
      { pattern: /\b(bag|handbag|briefcase|tote|backpack|messenger bag|duffle|purse|satchel|clutch|crossbody)\b/i, weight: 6, label: 'product: leather bag' },
      { pattern: /\b(jacket|leather jacket|biker jacket|bomber jacket|vest)\b/i, weight: 6, label: 'product: leather jacket' },
      { pattern: /\b(boots|chelsea boots|shoes|loafers|oxfords)\b/i, weight: 5, label: 'product: footwear' },
      { pattern: /\b(wallet|belt|cardholder|keychain|strap|buckle|brass hardware)\b/i, weight: 5, label: 'accessory: leather' },
      { pattern: /\b(full-grain|top-grain|patina|hide|tanned|genuine leather|leather craft|craftsmanship|leather care|conditioner)\b/i, weight: 6, label: 'material: leather grain' },
      { pattern: /\b(wl[-_\s]?\d{3,8})\b/i, weight: 20, label: 'order prefix: WL-' },
      { pattern: /\bwl-\d+/i, weight: 20, label: 'order prefix: WL-' },
      { pattern: /\bps-\d+/i, weight: 10, label: 'order prefix: PS-' },
      { pattern: /\b(scratched leather|scratch on leather|torn leather|scuffed|scuff mark|hardware defect|broken buckle|broken clasp)\b/i, weight: 6, label: 'damage: leather flaw' },
    ];

    for (const p of sdPatterns) {
      if (p.pattern.test(lower)) {
        sheinScore += p.weight;
        sheinMatches.push(p.label);
      }
    }

    for (const p of wlPatterns) {
      if (p.pattern.test(lower)) {
        watfordScore += p.weight;
        watfordMatches.push(p.label);
      }
    }

    if (sheinScore > watfordScore && shein) {
      const conf = Math.min(99, Math.max(65, sheinScore * 12));
      return {
        brand: shein,
        confidence: conf,
        reason: `Detected '${shein.name}' based on: ${sheinMatches.join(', ')}`,
        matchedKeywords: sheinMatches
      };
    } else if (watfordScore > sheinScore && watford) {
      const conf = Math.min(99, Math.max(65, watfordScore * 12));
      return {
        brand: watford,
        confidence: conf,
        reason: `Detected '${watford.name}' based on: ${watfordMatches.join(', ')}`,
        matchedKeywords: watfordMatches
      };
    }

    // Generic query with no brand indicators: preserve current brand if provided
    const currentBrand = currentBrandId ? this.brands.find((b) => b.id === currentBrandId) : null;
    if (currentBrand) {
      return {
        brand: currentBrand,
        confidence: 0,
        reason: `Preserving active brand '${currentBrand.name}' (no distinctive brand terms or order prefix detected).`,
        matchedKeywords: []
      };
    }

    return { brand: null, confidence: 0, reason: 'No matching company detected', matchedKeywords: [] };
  }

  public createTicketFromInquiry(
    userId: string | null | undefined,
    params: {
      brandId: string;
      query: string;
      customerName?: string;
      customerEmail?: string;
      orderNumber?: string;
    }
  ): {
    conversation: Conversation;
    customer: Customer;
    order: Order | null;
    initialMessage: Message;
  } {
    this.checkBrandAccess(userId, params.brandId);

    const brand = this.brands.find((b) => b.id === params.brandId);
    if (!brand) throw new Error(`Brand not found: ${params.brandId}`);

    // Create Customer
    const custName = params.customerName?.trim() || 'Inquiring Customer';
    const custEmail = params.customerEmail?.trim() || `customer.${Date.now().toString(36)}@inquiry.com`;
    const customer: Customer = {
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      brand_id: params.brandId,
      name: custName,
      email: custEmail,
      created_at: new Date().toISOString()
    };
    this.customers.push(customer);

    // Detect or create matching order
    let order: Order | null = null;
    let matchedOrderNum = params.orderNumber?.trim().replace(/^#/, '');
    if (!matchedOrderNum) {
      const extracted = params.query.match(/#?([A-Za-z]{2,5}-\d+)/i)?.[1];
      if (extracted) {
        matchedOrderNum = extracted;
      }
    }

    if (matchedOrderNum) {
      const isValidPrefix = /^SD[-\s]?/i.test(matchedOrderNum) || /^WL[-\s]?/i.test(matchedOrderNum);
      order =
        this.orders.find(
          (o) => o.order_number.toLowerCase() === matchedOrderNum.toLowerCase() && o.brand_id === params.brandId
        ) || null;
      if (!order && isValidPrefix) {
        order = {
          id: `ord-${Date.now()}`,
          brand_id: params.brandId,
          customer_id: customer.id,
          order_number: matchedOrderNum.toUpperCase(),
          status: 'delivered',
          delivered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          total_amount: 38.50,
          currency: 'USD',
          items_json: [
            {
              sku: `${brand.slug.toUpperCase()}-01`,
              name: `${brand.name} Registered Item`,
              quantity: 1,
              price: 38.50
            }
          ],
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        };
        this.orders.push(order);
      }
    }

    // Create Conversation Ticket
    const conversation: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      brand_id: params.brandId,
      customer_id: customer.id,
      order_id: order?.id || null,
      status: 'open',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.conversations.unshift(conversation);

    // Create Initial Customer Inquiry Message
    const initialMessage: Message = {
      id: `msg-${Date.now()}`,
      brand_id: params.brandId,
      conversation_id: conversation.id,
      sender_type: 'customer',
      body: params.query.trim(),
      client_request_id: `inquiry-req-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    this.messages.push(initialMessage);
    this.saveToStorage();

    return {
      conversation,
      customer,
      order,
      initialMessage
    };
  }
}

// Export singleton instance
export const dataStore = new CopilotDataStore();
