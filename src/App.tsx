import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { dataStore, DEMO_USERS, CurrentUser } from './services/store';
import { generateAIReply, GenerateReplyOutput } from './services/aiGenerator';
import { Header, ActiveView } from './components/Header';
import { CustomerPortal } from './components/CustomerPortal';
import { AgentPortal } from './components/AgentPortal';
import { KnowledgeBaseManager } from './components/KnowledgeBaseManager';
import { AuditLogView } from './components/AuditLogView';
import { NewInquiryModal } from './components/NewInquiryModal';
import { LoginScreen } from './components/LoginScreen';
import { ArchitectureView } from './components/ArchitectureView';

const STORAGE_KEYS = {
  CURRENT_USER: 'cx_current_user',
  ACTIVE_VIEW: 'cx_active_view',
  SELECTED_BRAND: 'cx_selected_brand_id',
  SELECTED_CONV: 'cx_selected_conversation_id',
  IS_LOGGED_OUT: 'cx_is_logged_out'
};

export const App: React.FC = () => {
  // 1. Authentication State with Session Persistence
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    if (typeof window === 'undefined') return DEMO_USERS.agent;
    const isLoggedOut = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_OUT) === 'true';
    if (isLoggedOut) return null;
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.name) return parsed;
      } catch {
        // ignore
      }
    }
    return DEMO_USERS.agent;
  });

  // 2. Active Brand Selection with Persistence
  const [selectedBrandId, setSelectedBrandId] = useState<string>(() => {
    if (typeof window === 'undefined') return '11111111-1111-1111-1111-111111111111';
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_BRAND);
    return saved || '11111111-1111-1111-1111-111111111111';
  });

  // 3. Current Page / View with Refresh Persistence (Stays on the exact view upon refresh)
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    if (typeof window === 'undefined') return 'customer';
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_VIEW);
    if (saved && ['customer', 'agent', 'split', 'kb', 'audit', 'architecture'].includes(saved)) {
      return saved as ActiveView;
    }
    return 'customer';
  });

  const [isNewInquiryOpen, setIsNewInquiryOpen] = useState<boolean>(false);

  // 4. Conversation & AI Draft State: restored from persistence
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.SELECTED_CONV) || null;
  });
  const [currentDraft, setCurrentDraft] = useState<GenerateReplyOutput | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [storeRevision, setStoreRevision] = useState<number>(0);

  // Force reactive re-render when store mutates
  const triggerStoreUpdate = useCallback(() => {
    setStoreRevision((prev) => prev + 1);
  }, []);

  // Preserve stored state across refresh; only reset on explicit URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('e2e_seed') === 'true') {
        dataStore.resetToSeed();
        setSelectedConversationId('e1111111-1111-1111-1111-111111111111');
        localStorage.setItem(STORAGE_KEYS.SELECTED_CONV, 'e1111111-1111-1111-1111-111111111111');
        triggerStoreUpdate();
      } else if (params.get('reset') === 'true') {
        dataStore.resetToFresh();
        setSelectedConversationId(null);
        setCurrentDraft(null);
        localStorage.removeItem(STORAGE_KEYS.SELECTED_CONV);
        window.history.replaceState({}, '', window.location.pathname);
        triggerStoreUpdate();
      } else {
        // Normal load/refresh: PRESERVE EXACT CURRENT PAGE AND STORED CONVERSATIONS!
        try {
          const stored = dataStore.getConversations(currentUser?.id, 'all');
          if (stored.length > 0) {
            setSelectedConversationId((prev) => {
              if (prev && stored.some((c) => c.id === prev)) return prev;
              const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_CONV);
              if (saved && stored.some((c) => c.id === saved)) return saved;
              return stored[0].id;
            });
          }
        } catch {
          // ignore
        }
        triggerStoreUpdate();
      }
    }
  }, [triggerStoreUpdate, currentUser]);

  // Compute authorized brands for current user
  const authorizedBrands = useMemo(() => {
    return dataStore.getAuthorizedBrands(currentUser?.id);
  }, [currentUser, storeRevision]);

  // Keep selected brand valid when user changes
  const activeBrand = useMemo(() => {
    if (authorizedBrands.length === 0) return null;
    return authorizedBrands.find((b) => b.id === selectedBrandId) || authorizedBrands[0];
  }, [authorizedBrands, selectedBrandId]);

  // Check admin privileges for active brand
  const isAdmin = useMemo(() => {
    if (!currentUser || !activeBrand) return false;
    try {
      const membership = dataStore.checkBrandAccess(currentUser.id, activeBrand.id);
      return membership.role === 'admin';
    } catch {
      return false;
    }
  }, [currentUser, activeBrand, storeRevision]);

  // Load all authorized conversations (for both Agent Portal queue and Customer Portal history)
  const agentConversations = useMemo(() => {
    if (!currentUser) return [];
    try {
      const convs = dataStore.getConversations(currentUser.id, 'all');
      return [...convs].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
    } catch {
      return [];
    }
  }, [currentUser, storeRevision]);

  // Ensure selected conversation exists in authorized conversations
  const validSelectedConvId = useMemo(() => {
    if (!selectedConversationId || agentConversations.length === 0) return null;
    const exists = agentConversations.some((c) => c.id === selectedConversationId);
    return exists ? selectedConversationId : null;
  }, [agentConversations, selectedConversationId]);

  // Load active conversation context
  const currentConversationContext = useMemo(() => {
    if (!currentUser || !validSelectedConvId) return null;
    try {
      return dataStore.getConversationContext(currentUser.id, validSelectedConvId);
    } catch {
      return null;
    }
  }, [currentUser, validSelectedConvId, storeRevision]);

  // Load policies for active brand
  const brandPolicies = useMemo(() => {
    if (!currentUser || !activeBrand) return [];
    try {
      return dataStore.getPolicies(currentUser.id, activeBrand.id);
    } catch {
      return [];
    }
  }, [currentUser, activeBrand, storeRevision]);

  // Load audit logs for active brand
  const auditLogs = useMemo(() => {
    if (!currentUser || !activeBrand) return [];
    try {
      const convs = dataStore.getConversations(currentUser.id, activeBrand.id);
      const allLogs = convs.flatMap((c) => dataStore.getGenerationAudit(currentUser.id, c.id));
      return allLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return [];
    }
  }, [currentUser, activeBrand, storeRevision]);

  // User Authentication Handler with LocalStorage Persistence
  const handleSelectUser = useCallback((user: CurrentUser | null) => {
    setCurrentUser(user);
    if (user) {
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_OUT);
      } catch {
        // ignore
      }
      const userBrands = dataStore.getAuthorizedBrands(user.id);
      if (userBrands.length > 0 && !userBrands.some((b) => b.id === selectedBrandId)) {
        setSelectedBrandId(userBrands[0].id);
        try {
          localStorage.setItem(STORAGE_KEYS.SELECTED_BRAND, userBrands[0].id);
        } catch {
          // ignore
        }
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.setItem(STORAGE_KEYS.IS_LOGGED_OUT, 'true');
      } catch {
        // ignore
      }
    }
    setCurrentDraft(null);
    triggerStoreUpdate();
  }, [selectedBrandId, triggerStoreUpdate]);

  // View Switcher Handler with LocalStorage Persistence
  const handleSelectView = useCallback((view: ActiveView) => {
    setActiveView(view);
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_VIEW, view);
    } catch {
      // ignore
    }
  }, []);

  // Select brand with persistence
  const handleSelectBrand = (brandId: string) => {
    setSelectedBrandId(brandId);
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_BRAND, brandId);
    } catch {
      // ignore
    }
    setCurrentDraft(null);
    try {
      const brandConvs = dataStore.getConversations(currentUser?.id, brandId);
      const newConvId = brandConvs[0]?.id || null;
      setSelectedConversationId(newConvId);
      if (newConvId) {
        localStorage.setItem(STORAGE_KEYS.SELECTED_CONV, newConvId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_CONV);
      }
    } catch {
      setSelectedConversationId(null);
      localStorage.removeItem(STORAGE_KEYS.SELECTED_CONV);
    }
  };

  const handleSelectConversation = (convId: string | null) => {
    setSelectedConversationId(convId || null);
    try {
      if (convId) {
        localStorage.setItem(STORAGE_KEYS.SELECTED_CONV, convId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_CONV);
      }
    } catch {
      // ignore
    }
    setCurrentDraft(null);
    if (!convId) {
      triggerStoreUpdate();
      return;
    }
    try {
      const ctx = dataStore.getConversationContext(currentUser?.id, convId);
      if (ctx && ctx.brand && ctx.brand.id !== selectedBrandId) {
        setSelectedBrandId(ctx.brand.id);
        localStorage.setItem(STORAGE_KEYS.SELECTED_BRAND, ctx.brand.id);
      }
    } catch {
      // Ignored
    }
  };

  // Messaging Actions
  const handleCustomerSendMessage = async (text: string) => {
    if (!currentUser) return;
    if (!currentConversationContext) {
      await handleCustomerStartNewConversation(text);
      return;
    }
    const clientRequestId = `cust-req-${Date.now()}`;

    // 1. Detect and link order number if mentioned
    const extractedOrderNum = text.match(/#?([A-Za-z]{2,5}-\d+)/i)?.[1];
    if (extractedOrderNum) {
      dataStore.linkOrderToConversation(currentConversationContext.conversation.id, extractedOrderNum);
    }

    // 2. Detect brand from text and switch if distinctive keywords/prefixes present
    const detected = dataStore.detectBrandFromQuery(text);
    if (detected.confidence >= 60 && detected.brand && detected.brand.id !== currentConversationContext.brand.id) {
      dataStore.switchConversationBrand(currentConversationContext.conversation.id, detected.brand.id);
      setSelectedBrandId(detected.brand.id);
    }

    // Reopen conversation only if it was not definitively terminated by a loop kill
    if (currentConversationContext.conversation.status === 'resolved') {
      const msgs = currentConversationContext.messages;
      const lastAgentMsg = [...msgs].reverse().find((m) => m.sender_type === 'agent')?.body?.toLowerCase() || '';
      const isLoopTerminated =
        lastAgentMsg.includes('circular loop') ||
        lastAgentMsg.includes('determination on this matter is final') ||
        lastAgentMsg.includes('concluded and marked as resolved');
      if (!isLoopTerminated) {
        dataStore.updateConversationStatus(currentUser.id, currentConversationContext.conversation.id, 'open');
      }
    }

    dataStore.sendMessage(
      currentUser.id,
      currentConversationContext.conversation.id,
      'customer',
      text,
      clientRequestId
    );
    triggerStoreUpdate();

    // Automatically generate response based on this company's policies
    try {
      setIsGeneratingAI(true);
      const output = await generateAIReply({
        conversationId: currentConversationContext.conversation.id,
        clientRequestId: `gen-reply-${Date.now()}`,
        userId: currentUser.id
      });
      setCurrentDraft(output);
      triggerStoreUpdate();
    } catch (err) {
      console.error('Failed to generate automated reply for customer message:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleResolveConversation = (conversationId: string) => {
    if (!currentUser) return;
    dataStore.updateConversationStatus(currentUser.id, conversationId, 'resolved');
    triggerStoreUpdate();
  };

  const handleSendManualReply = async (body: string) => {
    if (!currentUser || !currentConversationContext) return;
    const clientRequestId = `manual-agent-req-${Date.now()}`;
    dataStore.sendMessage(
      currentUser.id,
      currentConversationContext.conversation.id,
      'agent',
      body,
      clientRequestId
    );
    triggerStoreUpdate();
  };

  // Trigger AI Suggestion
  const handleTriggerAIGeneration = async () => {
    if (!currentUser || !currentConversationContext) return;
    try {
      setIsGeneratingAI(true);
      const clientRequestId = `gen-req-${Date.now()}`;
      const output = await generateAIReply({
        conversationId: currentConversationContext.conversation.id,
        clientRequestId,
        userId: currentUser.id
      });
      setCurrentDraft(output);
      triggerStoreUpdate();
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Approve & Atomic Send
  const handleApproveAndSend = async (approvedText: string, clientRequestId: string) => {
    if (!currentUser || !currentDraft || !currentConversationContext) return;
    try {
      const review = dataStore.approveReply(currentUser.id, currentDraft.generationId, approvedText);
      const expectedVersion = currentDraft.conversationVersion ?? currentConversationContext.conversation.version;
      dataStore.sendApprovedReply(
        currentUser.id,
        review.id,
        clientRequestId,
        expectedVersion
      );
      setCurrentDraft(null);
      triggerStoreUpdate();
    } catch (err: any) {
      console.error('Failed to send approved reply:', err);
      window.alert(err.message || 'Failed to dispatch approved reply.');
    }
  };

  // Knowledge Base Actions
  const handleCreatePolicy = (data: Parameters<typeof dataStore.createPolicy>[2]) => {
    if (!currentUser || !activeBrand) return;
    dataStore.createPolicy(currentUser.id, activeBrand.id, data);
    triggerStoreUpdate();
  };

  const handleUpdatePolicy = (policyId: string, updates: Parameters<typeof dataStore.updatePolicy>[2]) => {
    if (!currentUser) return;
    dataStore.updatePolicy(currentUser.id, policyId, updates);
    triggerStoreUpdate();
  };

  const handleDeletePolicy = (policyId: string) => {
    if (!currentUser) return;
    dataStore.deletePolicy(currentUser.id, policyId);
    triggerStoreUpdate();
  };

  // Inquiry Ingestion & Customer New Inquiry
  const handleIngestQuery = async (params: {
    brandId: string;
    query: string;
    customerName?: string;
    orderNumber?: string;
    autoGenerateAI: boolean;
  }) => {
    if (!currentUser) return;
    const ticket = dataStore.createTicketFromInquiry(currentUser.id, {
      brandId: params.brandId,
      query: params.query,
      customerName: params.customerName,
      orderNumber: params.orderNumber
    });

    setSelectedBrandId(params.brandId);
    setSelectedConversationId(ticket.conversation.id);
    setCurrentDraft(null);
    triggerStoreUpdate();

    if (params.autoGenerateAI) {
      try {
        setIsGeneratingAI(true);
        const clientRequestId = `gen-auto-${Date.now()}`;
        const output = await generateAIReply({
          conversationId: ticket.conversation.id,
          clientRequestId,
          userId: currentUser.id
        });
        setCurrentDraft(output);
        triggerStoreUpdate();
      } finally {
        setIsGeneratingAI(false);
      }
    }
  };

  const handleCustomerStartNewConversation = async (query: string, orderNumber?: string, brandId?: string) => {
    if (!currentUser) return;
    let targetBrandId = brandId;
    if (!targetBrandId) {
      // 1. Fast synchronous detection from keywords & prefixes
      const detected = dataStore.detectBrandFromQuery(query, activeBrand?.id);
      if (detected.confidence > 0 && detected.brand) {
        targetBrandId = detected.brand.id;
      } else {
        targetBrandId = activeBrand?.id || authorizedBrands[0]?.id;
      }
    }
    if (!targetBrandId) return;

    // Switch active brand if target brand differs
    if (targetBrandId !== selectedBrandId) {
      setSelectedBrandId(targetBrandId);
    }

    // 2. Ingest customer ticket under this brand IMMEDIATELY and SYNCHRONOUSLY
    const ticket = dataStore.createTicketFromInquiry(currentUser.id, {
      brandId: targetBrandId,
      query,
      customerName: 'Customer',
      orderNumber
    });

    // 3. Immediately select this new conversation and trigger re-render
    setSelectedConversationId(ticket.conversation.id);
    setCurrentDraft(null);
    triggerStoreUpdate();

    // 4. In background, generate Gemini suggestion for the Support Agent
    try {
      setIsGeneratingAI(true);
      const clientRequestId = `gen-auto-${Date.now()}`;
      const output = await generateAIReply({
        conversationId: ticket.conversation.id,
        clientRequestId,
        userId: currentUser.id
      });
      setCurrentDraft(output);
      triggerStoreUpdate();
    } catch (err) {
      console.error('Failed to generate initial reply for customer ticket:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleClearQueue = () => {
    if (!currentUser || !activeBrand) return;
    dataStore.clearConversations(currentUser.id, activeBrand.id);
    setSelectedConversationId(null);
    setCurrentDraft(null);
    triggerStoreUpdate();
  };

  const handleResetDemo = () => {
    dataStore.resetToFresh();
    setSelectedConversationId(null);
    setCurrentDraft(null);
    triggerStoreUpdate();
  };

  return (
    <div className="h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans antialiased overflow-hidden">
      <Header
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        brands={authorizedBrands}
        selectedBrandId={activeBrand?.id || ''}
        onSelectBrand={handleSelectBrand}
        activeView={activeView}
        onSelectView={handleSelectView}
        isAdmin={isAdmin}
      />

      {/* Main Experience Body */}
      <main className="flex-1 flex flex-col p-3 sm:p-4 max-w-[1800px] w-full mx-auto min-h-0 overflow-hidden">
        {!currentUser ? (
          <LoginScreen
            onLogin={handleSelectUser}
            onContinueAsCustomer={() => {
              handleSelectUser(DEMO_USERS.agent);
              handleSelectView('customer');
            }}
          />
        ) : activeView === 'customer' ? (
          // VIEW 1: DEDICATED CUSTOMER PORTAL (PRIMARY ENTRY POINT)
          <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
            <CustomerPortal
              brand={currentConversationContext?.brand || activeBrand}
              customer={currentConversationContext?.customer || null}
              order={currentConversationContext?.order || null}
              conversation={currentConversationContext?.conversation || null}
              conversations={agentConversations}
              messages={currentConversationContext?.messages || []}
              onSendMessage={handleCustomerSendMessage}
              onSelectConversation={handleSelectConversation}
              onStartNewConversation={handleCustomerStartNewConversation}
              onResolveConversation={handleResolveConversation}
              isGeneratingAI={isGeneratingAI}
            />
          </div>
        ) : activeView === 'agent' ? (
          // VIEW 2: SUPPORT AGENT PORTAL
          <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
            <AgentPortal
              currentUser={currentUser}
              activeBrand={activeBrand}
              conversations={agentConversations}
              selectedConversationId={validSelectedConvId}
              onSelectConversation={handleSelectConversation}
              conversationContext={currentConversationContext}
              brandPolicies={brandPolicies}
              currentDraft={currentDraft}
              isGeneratingAI={isGeneratingAI}
              onTriggerAIGeneration={handleTriggerAIGeneration}
              onApproveAndSend={handleApproveAndSend}
              onSendManualReply={handleSendManualReply}
              onClearDraft={() => setCurrentDraft(null)}
              onOpenNewInquiry={() => setIsNewInquiryOpen(true)}
              onClearQueue={handleClearQueue}
              onResetDemo={handleResetDemo}
              onStartNewConversation={handleCustomerStartNewConversation}
              onResolveConversation={handleResolveConversation}
            />
          </div>
        ) : activeView === 'split' ? (
          // VIEW 3: DUAL SPLIT-SCREEN (CUSTOMER PORTAL ON LEFT, AGENT PORTAL ON RIGHT)
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0 overflow-hidden">
            {/* Left: Customer View */}
            <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
              <CustomerPortal
                brand={currentConversationContext?.brand || activeBrand}
                customer={currentConversationContext?.customer || null}
                order={currentConversationContext?.order || null}
                conversation={currentConversationContext?.conversation || null}
                conversations={agentConversations}
                messages={currentConversationContext?.messages || []}
                onSendMessage={handleCustomerSendMessage}
                onSelectConversation={handleSelectConversation}
                onStartNewConversation={handleCustomerStartNewConversation}
                onResolveConversation={handleResolveConversation}
                isGeneratingAI={isGeneratingAI}
              />
            </div>

            {/* Right: Agent View */}
            <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
              <AgentPortal
                currentUser={currentUser}
                activeBrand={activeBrand}
                conversations={agentConversations}
                selectedConversationId={validSelectedConvId}
                onSelectConversation={handleSelectConversation}
                conversationContext={currentConversationContext}
                brandPolicies={brandPolicies}
                currentDraft={currentDraft}
                isGeneratingAI={isGeneratingAI}
                onTriggerAIGeneration={handleTriggerAIGeneration}
                onApproveAndSend={handleApproveAndSend}
                onSendManualReply={handleSendManualReply}
                onClearDraft={() => setCurrentDraft(null)}
                onOpenNewInquiry={() => setIsNewInquiryOpen(true)}
                onClearQueue={handleClearQueue}
                onResetDemo={handleResetDemo}
                onStartNewConversation={handleCustomerStartNewConversation}
                onResolveConversation={handleResolveConversation}
                isSplitView={true}
              />
            </div>
          </div>
        ) : activeView === 'kb' ? (
          // VIEW 4: BRAND KNOWLEDGE BASE MANAGER
          <div className="flex-1 overflow-y-auto">
            <KnowledgeBaseManager
              policies={brandPolicies}
              brandName={activeBrand?.name || ''}
              brandId={activeBrand?.id || ''}
              isAdmin={isAdmin}
              onCreatePolicy={handleCreatePolicy}
              onUpdatePolicy={handleUpdatePolicy}
              onDeletePolicy={handleDeletePolicy}
            />
          </div>
        ) : activeView === 'architecture' ? (
          // VIEW 6: PART 2 SYSTEM ARCHITECTURE PRESENTATION
          <div className="flex-1 overflow-y-auto bg-slate-50">
            <ArchitectureView />
          </div>
        ) : (
          // VIEW 5: AUDIT LOGS
          <div className="flex-1 overflow-y-auto">
            <AuditLogView auditLogs={auditLogs} brandName={activeBrand?.name || ''} />
          </div>
        )}
      </main>

      {/* Query Ingestion & Company Auto-Detection Modal */}
      <NewInquiryModal
        isOpen={isNewInquiryOpen}
        onClose={() => setIsNewInquiryOpen(false)}
        authorizedBrands={authorizedBrands}
        onIngestQuery={handleIngestQuery}
      />
    </div>
  );
};

export default App;
