import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Conversation, Customer, Order, Message, Brand, KBEntry } from '../types/database';
import { GenerateReplyOutput } from '../services/aiGenerator';
import { OrderContextCard } from './OrderContextCard';
import {
  Sparkles,
  Send,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  User,
  Trash2,
  RotateCcw,
  PlusCircle,
  Search,
  MessageSquare,
  Shield,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  X,
  Clock,
  Layers,
  Inbox,
  Bot
} from 'lucide-react';

interface AgentPortalProps {
  currentUser: { id: string; name: string; email: string } | null;
  activeBrand: Brand | null;
  conversations: Array<Conversation & { customer: Customer; order: Order | null; latestMessage: Message | null }>;
  selectedConversationId: string | null;
  onSelectConversation: (convId: string) => void;
  conversationContext: {
    conversation: Conversation;
    brand: Brand;
    customer: Customer;
    order: Order | null;
    messages: Message[];
  } | null;
  brandPolicies?: KBEntry[];
  currentDraft: GenerateReplyOutput | null;
  isGeneratingAI: boolean;
  onTriggerAIGeneration: () => Promise<void>;
  onApproveAndSend: (approvedText: string, clientRequestId: string) => Promise<void>;
  onSendManualReply: (body: string) => Promise<void>;
  onClearDraft: () => void;
  onOpenNewInquiry: () => void;
  onClearQueue: () => void;
  onResetDemo: () => void;
  onStartNewConversation?: (query: string, orderNumber?: string, brandId?: string) => void;
  onResolveConversation?: (conversationId: string) => void;
  isSplitView?: boolean;
}

export const AgentPortal: React.FC<AgentPortalProps> = ({
  currentUser,
  activeBrand,
  conversations,
  selectedConversationId,
  onSelectConversation,
  conversationContext,
  brandPolicies = [],
  currentDraft,
  isGeneratingAI,
  onTriggerAIGeneration,
  onApproveAndSend,
  onSendManualReply,
  onClearDraft,
  onOpenNewInquiry,
  onClearQueue,
  onResetDemo,
  onResolveConversation,
  isSplitView = false
}) => {
  // Unified Composer state
  const [composerText, setComposerText] = useState('');
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [isDraftEdited, setIsDraftEdited] = useState(false);
  const [lastOriginalDraft, setLastOriginalDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Per-conversation unsaved draft memory to prevent losing unsaved work when switching tickets
  const unsavedDraftsRef = useRef<Record<string, { text: string; isDraftMode: boolean; isDraftEdited: boolean }>>({});
  const prevConvIdRef = useRef<string | null>(selectedConversationId);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isEvidenceCollapsed, setIsEvidenceCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Staleness detection: checks if conversation version advanced since draft creation
  const isDraftStale = Boolean(
    isDraftMode &&
    currentDraft &&
    currentDraft.conversationVersion !== undefined &&
    conversationContext &&
    conversationContext.conversation.version > currentDraft.conversationVersion
  );

  // Preserve unsaved draft when switching conversations
  useEffect(() => {
    if (prevConvIdRef.current && prevConvIdRef.current !== selectedConversationId) {
      unsavedDraftsRef.current[prevConvIdRef.current] = {
        text: composerText,
        isDraftMode,
        isDraftEdited
      };
    }

    if (selectedConversationId) {
      const saved = unsavedDraftsRef.current[selectedConversationId];
      if (saved) {
        setComposerText(saved.text);
        setIsDraftMode(saved.isDraftMode);
        setIsDraftEdited(saved.isDraftEdited);
      } else {
        setComposerText('');
        setIsDraftMode(false);
        setIsDraftEdited(false);
      }
    }

    prevConvIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  // Sync draft text directly into unified composer when AI draft is generated
  useEffect(() => {
    if (currentDraft) {
      setComposerText(currentDraft.draft);
      setIsDraftMode(true);
      setIsDraftEdited(false);
      setLastOriginalDraft(currentDraft.draft);
      // Auto-expand evidence panel so agent immediately sees supporting rules
      setIsEvidenceCollapsed(false);
      // Focus textarea for instant agent editing
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [currentDraft]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationContext?.messages]);

  // Handle composer text editing
  const handleComposerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setComposerText(newText);
    if (isDraftMode && newText !== lastOriginalDraft) {
      setIsDraftEdited(true);
    }
  };

  // Unified Send Handler: handles both manual reply and approved AI draft
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = composerText.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (isDraftMode && currentDraft) {
        if (isDraftStale) {
          window.alert(
            'The conversation has received new updates since this draft was generated. Please click "Regenerate Draft" before approving.'
          );
          return;
        }
        // Human approved AI suggestion
        const clientRequestId = `agent-appr-${Date.now()}`;
        await onApproveAndSend(trimmed, clientRequestId);
      } else {
        // Direct manual agent response
        await onSendManualReply(trimmed);
      }
      setComposerText('');
      setIsDraftMode(false);
      setIsDraftEdited(false);
      setLastOriginalDraft('');
      if (selectedConversationId) {
        delete unsavedDraftsRef.current[selectedConversationId];
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Regenerate with edit-loss protection
  const handleRegenerate = async () => {
    if (isGeneratingAI || !conversationContext) return;
    if (isDraftEdited) {
      const confirmOverwrite = window.confirm(
        'You have edited this draft. Regenerating will replace your edits with a freshly generated suggestion. Do you wish to continue?'
      );
      if (!confirmOverwrite) return;
    }
    await onTriggerAIGeneration();
  };

  // Discard Draft with confirmation if modified
  const handleDiscardDraft = () => {
    if (isDraftEdited) {
      const confirmDiscard = window.confirm('Discard your edits and reset the composer to an empty manual message?');
      if (!confirmDiscard) return;
    }
    onClearDraft();
    setComposerText('');
    setIsDraftMode(false);
    setIsDraftEdited(false);
    setLastOriginalDraft('');
    if (selectedConversationId) {
      delete unsavedDraftsRef.current[selectedConversationId];
    }
  };

  const [queueBrandFilter, setQueueBrandFilter] = useState<'all' | string>('all');

  const availableBrands: Array<{ id: string; name: string }> = useMemo(() => {
    const map = new Map<string, string>();
    conversations.forEach((c) => {
      const bName = (c as any).brandName;
      if (c.brand_id && bName) {
        map.set(c.brand_id, bName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [conversations]);

  // Filter conversations in inbox
  const filteredConversations = conversations.filter((c) => {
    if (queueBrandFilter !== 'all' && c.brand_id !== queueBrandFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.customer.name.toLowerCase().includes(q) ||
      c.order?.order_number.toLowerCase().includes(q) ||
      c.latestMessage?.body.toLowerCase().includes(q) ||
      (c as any).brandName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex gap-3 min-h-0 h-full overflow-hidden">
      {/* ========================================================= */}
      {/* REGION 1 (LEFT): Conversation Inbox & Order Facts (300px) */}
      {/* ========================================================= */}
      <aside className={`${isSplitView ? 'w-48 xl:w-52 shrink-0' : 'w-72 lg:w-80 shrink-0'} flex flex-col gap-2.5 min-h-0 overflow-hidden`}>
        {/* Inbox Queue Card */}
        <div className="ds-card flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Queue Header */}
          <div className="p-2.5 sm:p-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <MessageSquare className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-slate-900 truncate max-w-[110px] sm:max-w-[140px]">
                  {activeBrand?.name || 'Inbox'}
                </h3>
                <span className="text-[10px] text-slate-500 font-medium block truncate">
                  {conversations.length} ticket{conversations.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={onOpenNewInquiry}
                title="Create New Customer Inquiry"
                className="p-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Clear all tickets in this queue?')) {
                    onClearQueue();
                  }
                }}
                title="Clear Ticket Queue"
                className="p-1 rounded-md bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onResetDemo}
                title="Reset to Seed Scenarios"
                className="p-1 rounded-md bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-2 border-b border-slate-100 shrink-0 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer, order #..."
                className="w-full pl-8 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Brand Filter Pills if multiple brands present */}
          {availableBrands.length > 1 && (
            <div className="px-2 py-1.5 border-b border-slate-100 bg-slate-50 flex items-center gap-1 overflow-x-auto text-[10px]">
              <button
                type="button"
                onClick={() => setQueueBrandFilter('all')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  queueBrandFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All ({conversations.length})
              </button>
              {availableBrands.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setQueueBrandFilter(b.id)}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    queueBrandFilter === b.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-3 flex-1 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Inbox className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-700 text-xs">Queue is Empty</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[190px] mx-auto leading-relaxed">
                    No open tickets for {activeBrand?.name || 'this brand'}.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 w-full pt-1">
                  <button
                    onClick={onOpenNewInquiry}
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create Inquiry</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = c.id === selectedConversationId;
                const hasUnsavedDraft = Boolean(unsavedDraftsRef.current[c.id]?.text);

                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectConversation(c.id)}
                    className={`w-full text-left p-3 transition-colors flex flex-col gap-1 border-l-4 ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-blue-600'
                        : 'hover:bg-slate-50/80 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                          {c.customer.name}
                        </span>
                        {hasUnsavedDraft && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Unsaved draft exists" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {(c as any).brandName && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {(c as any).brandName}
                          </span>
                        )}
                        {c.order && (
                          <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200">
                            #{c.order.order_number}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {c.latestMessage ? c.latestMessage.body : 'No messages yet'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                      <span className="font-mono text-[9px]">Ticket v{c.version}</span>
                      {c.latestMessage && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(c.latestMessage.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Compact Docked Order Context Card */}
        {conversationContext && (
          <div className="shrink-0 max-h-[320px] overflow-y-auto rounded-xl shadow-2xs">
            <OrderContextCard
              order={conversationContext.order}
              brandSlug={activeBrand?.slug || ''}
            />
          </div>
        )}
      </aside>

      {/* ========================================================================= */}
      {/* REGION 2 (CENTER): Dominant Conversation Timeline & Unified Reply Composer */}
      {/* ========================================================================= */}
      <section className="flex-1 min-w-0 flex flex-col ds-card min-h-0 overflow-hidden shadow-xs">
        {/* Compact Ticket Header */}
        <div className="p-3 sm:px-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {conversationContext?.customer.name || 'No Conversation Selected'}
                </h2>
                {activeBrand && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {activeBrand.name}
                  </span>
                )}
                {conversationContext?.order && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                    Order #{conversationContext.order.order_number}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                {conversationContext?.customer.email} · Assigned Agent:{' '}
                <strong className="text-slate-800">{currentUser?.name || 'Support Agent'}</strong>
              </p>
            </div>
          </div>

          {/* Right Header Controls: Evidence Panel Toggle & Resolve Action */}
          <div className="flex items-center gap-2 shrink-0">
            {conversationContext && (
              conversationContext.conversation.status === 'resolved' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Resolved
                </span>
              ) : onResolveConversation ? (
                <button
                  type="button"
                  onClick={() => onResolveConversation(conversationContext.conversation.id)}
                  className="px-2.5 py-1 rounded-lg border border-emerald-300 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Mark this ticket as resolved"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Resolve Ticket</span>
                </button>
              ) : null
            )}

            <button
              onClick={() => setIsEvidenceCollapsed(!isEvidenceCollapsed)}
              className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isEvidenceCollapsed ? 'Show Evidence Panel' : 'Hide Evidence Panel'}
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline text-xs font-medium">
                {isEvidenceCollapsed ? 'Show Evidence' : 'Hide Evidence'}
              </span>
              {isEvidenceCollapsed ? (
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Message Stream (Chronological) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/50">
          {!conversationContext ? (
            conversations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs mb-3">
                  <Inbox className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200 mb-2">
                  {activeBrand?.name || 'Support Queue'} · Fresh State
                </span>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Agent Inbox is Clear
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">
                  There are currently no customer inquiries in the queue. You can test live AI reply generation by selecting a test scenario below or opening the Customer Portal.
                </p>

                <div className="w-full mt-5 p-5 rounded-2xl border border-slate-200 bg-white text-center space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-center gap-2 text-slate-800 font-bold text-xs">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>Customer Support Queue Live</span>
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Customer inquiries submitted through the Customer Portal stream directly into this queue in real-time. Use the Customer Portal to submit an inquiry.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">Select a conversation</p>
                <p className="text-[11px] max-w-xs text-slate-500 leading-relaxed">
                  Choose a ticket from the inbox on the left to read customer messages and compose or generate replies.
                </p>
              </div>
            )
          ) : conversationContext.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <p className="text-xs">This ticket has no messages yet.</p>
            </div>
          ) : (
            conversationContext.messages.map((msg) => {
              const isCustomer = msg.sender_type === 'customer';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500 font-semibold">
                    {isCustomer ? (
                      <>
                        <User className="w-3 h-3 text-slate-500" />
                        <span>Customer ({conversationContext.customer.name})</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-800 font-bold">Support Agent (Approved &amp; Sent)</span>
                      </>
                    )}
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-400 font-mono text-[9px]">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-xl p-3.5 text-xs leading-relaxed shadow-2xs border ${
                      isCustomer
                        ? 'bg-white text-slate-900 border-slate-200'
                        : 'bg-blue-600 text-white border-blue-700'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ========================================================================= */}
        {/* UNIFIED REPLY COMPOSER: Single composer for AI Draft and Manual Response */}
        {/* ========================================================================= */}
        {conversationContext && (
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2 shrink-0"
          >
            {/* Context/Mode Banner */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isDraftMode ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-900 font-semibold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>AI Suggested Reply</span>
                    {isDraftEdited && (
                      <span className="text-[10px] font-normal text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded">
                        Edited
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                    <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Manual Response (Direct agent message)</span>
                  </div>
                )}
              </div>

              {isDraftMode && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                    Unsent Draft
                  </span>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-0.5"
                    title="Discard AI draft and switch to blank manual reply"
                  >
                    <X className="w-3 h-3" />
                    <span>Discard</span>
                  </button>
                </div>
              )}
            </div>

            {/* Staleness Warning Alert Banner */}
            {isDraftStale && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Draft is Stale:</strong> A new message was received since this draft was generated (conv v{conversationContext?.conversation.version} vs draft v{currentDraft?.conversationVersion}). Click <strong>Regenerate Draft</strong> to include recent messages.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isGeneratingAI}
                  className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] whitespace-nowrap cursor-pointer shrink-0 ml-2"
                >
                  Regenerate
                </button>
              </div>
            )}

            {/* Editable Textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                rows={3}
                value={composerText}
                onChange={handleComposerChange}
                placeholder="Type a manual response to send directly to customer..."
                className={`w-full rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none leading-relaxed transition-all ${
                  isDraftMode
                    ? 'bg-blue-50/30 border border-blue-200'
                    : 'bg-slate-50 border border-slate-200 focus:bg-white'
                }`}
              />
            </div>

            {/* Composer Action Toolbar */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              {/* Left Action Buttons: Generate AI Reply or Regenerate */}
              <div className="flex items-center gap-2">
                {!isDraftMode ? (
                  <button
                    type="button"
                    onClick={onTriggerAIGeneration}
                    disabled={isGeneratingAI}
                    className="ds-btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3 shadow-xs disabled:opacity-40 cursor-pointer"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingAI ? 'Generating...' : 'Generate AI Reply'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={isGeneratingAI}
                      className="ds-btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 cursor-pointer"
                      title="Generate a new AI draft (will prompt before replacing unsaved edits)"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingAI ? 'Regenerating...' : 'Regenerate Draft'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDiscardDraft}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                      title="Clear draft and return to manual message"
                    >
                      Discard Draft
                    </button>
                  </div>
                )}
              </div>

              {/* Right Action: Character Count & Send / Approve Button */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  {composerText.length} chars
                </span>

                <button
                  type="submit"
                  disabled={!composerText.trim() || isSubmitting || isDraftStale}
                  title={isDraftStale ? 'New customer message received. Please regenerate draft first.' : undefined}
                  className={`ds-btn-primary flex items-center gap-1.5 text-xs py-1.5 px-4 shadow-xs disabled:opacity-40 cursor-pointer ${
                    isDraftMode
                      ? isDraftStale
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : ''
                  }`}
                >
                  {isDraftMode ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                      <span>{isSubmitting ? 'Sending...' : 'Approve & Send to Customer'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Sending...' : 'Send'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* ========================================================================= */}
      {/* REGION 3 (RIGHT): Retrieved Policy Evidence & Grounding Panel (340px)      */}
      {/* ========================================================================= */}
      {!isEvidenceCollapsed && (
        <aside className={`${isSplitView ? 'w-64 shrink-0' : 'w-80 lg:w-88 shrink-0'} flex flex-col ds-card min-h-0 overflow-hidden shadow-xs`}>
          {/* Evidence Header */}
          <div className="p-2.5 sm:p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-slate-900 truncate">AI Suggested Reply</h3>
                <span className="text-[10px] text-slate-500 truncate block">Supporting brand policies &amp; evidence</span>
              </div>
            </div>

            <button
              onClick={() => setIsEvidenceCollapsed(true)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              title="Collapse Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Brand Isolation Badge */}
          <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 text-[10px] text-slate-600 flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5 truncate">
              <Shield className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">
                Isolated to <strong>{activeBrand?.name}</strong>
              </span>
            </span>
            {currentDraft && (
              <span className="font-mono text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-bold border border-blue-200">
                {currentDraft.sources.length} Retrieved
              </span>
            )}
          </div>

          {/* Evidence Content Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {!currentDraft ? (
              // Empty State: Explaining evidence will appear after generation
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3 text-slate-500">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                  <Bot className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {conversationContext ? 'Supporting Evidence Ready' : 'AI Assistant Idle'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    {conversationContext ? (
                      <>Click <strong>Generate AI Reply</strong> in the composer to evaluate the customer inquiry against official <strong>{activeBrand?.name}</strong> policies.</>
                    ) : (
                      <>Select or launch a customer ticket to evaluate inquiries against official <strong>{activeBrand?.name}</strong> policies.</>
                    )}
                  </p>
                </div>
                <div className="w-full text-left bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-[10px]">
                  <span className="font-bold text-slate-700 block uppercase tracking-wider text-[9px]">
                    Available Brand Knowledge Domains:
                  </span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {brandPolicies.map((p) => (
                      <span key={p.id} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-600">
                        {p.category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Active Evidence Display
              <div className="space-y-3">
                {/* Generation Status Pill */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Retrieval Status</span>
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      currentDraft.status === 'grounded'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : currentDraft.status === 'needs_information'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {currentDraft.status === 'grounded' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Policy Grounded</span>
                      </>
                    ) : currentDraft.status === 'needs_information' ? (
                      <>
                        <HelpCircle className="w-3 h-3 text-amber-600" />
                        <span>Needs Info</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>No Relevant Policy</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Policy Warning Limitation Alert */}
                {currentDraft.warnings.length > 0 && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Policy Limitation Alert</span>
                    </div>
                    <ul className="text-[10px] text-rose-800 space-y-1 list-disc list-inside">
                      {currentDraft.warnings.map((w, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Information Checklist */}
                {currentDraft.missingInformation.length > 0 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Required Customer Information</span>
                    </div>
                    <ul className="text-[10px] text-amber-800 space-y-1 list-disc list-inside">
                      {currentDraft.missingInformation.map((m, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Specific Retrieved Evidence Passages */}
                {currentDraft.sources.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Retrieved Policy Passages ({currentDraft.sources.length}):
                    </span>
                    {currentDraft.sources.map((s, idx) => {
                      const matched = brandPolicies.find((p) => p.id === s.policyId);
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1.5 border-l-4 border-l-blue-600"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-900 truncate max-w-[170px]">
                              {matched ? matched.title : `Policy Citation #${idx + 1}`}
                            </span>
                            <span className="font-mono text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-semibold">
                              v{s.policyVersion}
                            </span>
                          </div>
                          {matched && (
                            <span className="inline-block text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {matched.category}
                            </span>
                          )}
                          <p className="text-[11px] text-slate-700 leading-relaxed font-sans bg-slate-50/70 p-2 rounded border border-slate-100">
                            {s.contentSnapshot}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-1.5">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">No Matching Policies Found</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      This inquiry does not match any documented brand policies. A generic acknowledgment was drafted. The agent must verify facts manually before responding.
                    </p>
                  </div>
                )}

                {/* Model Attribution Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Layers className="w-3 h-3 text-slate-400" />
                    {currentDraft.model}
                  </span>
                  <span>{currentDraft.usage?.latency_ms || 120}ms latency</span>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
