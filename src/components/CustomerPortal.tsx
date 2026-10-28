import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Conversation, Customer, Order, Message, Brand } from '../types/database';
import { CURATED_TEST_CASES, TestCaseScenario } from '../data/testScenarios';
import {
  Send,
  Building2,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  X,
  Plus,
  ShoppingBag,
  UserCheck,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Headphones,
  ShieldAlert
} from 'lucide-react';

interface CustomerPortalProps {
  brand: Brand | null;
  customer: Customer | null;
  order: Order | null;
  conversation: Conversation | null;
  conversations: Array<Conversation & { customer: Customer; order: Order | null; latestMessage: Message | null }>;
  messages: Message[];
  onSendMessage: (text: string) => Promise<void> | void;
  onSelectConversation: (convId: string) => void;
  onStartNewConversation: (query: string, orderNumber?: string, brandId?: string) => void;
  onResolveConversation?: (convId: string) => void;
  isGeneratingAI?: boolean;
}

interface CatalogProduct {
  brandName: 'Shein Designs' | 'Watford Leathers';
  brandId: string;
  orderNumber: string;
  itemName: string;
  category: string;
  icon: string;
  deliveredText: string;
  policySummary: string;
}

const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    brandName: 'Shein Designs',
    brandId: '11111111-1111-1111-1111-111111111111',
    orderNumber: 'SD-1001',
    itemName: 'Floral Silk Chiffon Midi Dress',
    category: 'Clothing & Apparel',
    icon: '👗',
    deliveredText: 'Delivered yesterday',
    policySummary: '7-day window · Unworn with tags · 48h damage photo check'
  },
  {
    brandName: 'Shein Designs',
    brandId: '11111111-1111-1111-1111-111111111111',
    orderNumber: 'SD-1002',
    itemName: 'Vintage Denim Trucker Jacket',
    category: 'Clothing & Apparel',
    icon: '🧥',
    deliveredText: 'Delivered 20 days ago',
    policySummary: '7-day window · Unworn with tags'
  },
  {
    brandName: 'Watford Leathers',
    brandId: '22222222-2222-2222-2222-222222222222',
    orderNumber: 'WL-2001',
    itemName: 'Full-Grain Leather Messenger Bag',
    category: 'Leather Goods',
    icon: '💼',
    deliveredText: 'Shipped (In transit)',
    policySummary: '30-day window · Unused in original packaging'
  },
  {
    brandName: 'Watford Leathers',
    brandId: '22222222-2222-2222-2222-222222222222',
    orderNumber: 'WL-2002',
    itemName: 'Handcrafted Leather Chelsea Boots',
    category: 'Leather Footwear',
    icon: '👢',
    deliveredText: 'Delivered 3 days ago',
    policySummary: '30-day window · Unused in box'
  }
];

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '';
  const now = Date.now();
  const past = new Date(dateString).getTime();
  const diffSec = Math.max(0, Math.floor((now - past) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getConversationTitle(conv: Conversation & { order: Order | null; latestMessage: Message | null }): string {
  if (conv.order && conv.order.items_json.length > 0) {
    return conv.order.items_json[0].name;
  }
  if (conv.latestMessage?.body) {
    const clean = conv.latestMessage.body.replace(/\s+/g, ' ').trim();
    if (clean.length > 30) return clean.substring(0, 30) + '...';
    return clean;
  }
  return 'Support Inquiry';
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  customer,
  order,
  conversation,
  conversations,
  messages,
  onSendMessage,
  onSelectConversation,
  onStartNewConversation,
  onResolveConversation,
  isGeneratingAI = false
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'shein' | 'watford' | 'borderline' | 'custom'>('all');
  const [customQuery, setCustomQuery] = useState('');
  const [customOrderNum, setCustomOrderNum] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Directly verify whether we are inside an active conversation thread
  const hasActiveChat = Boolean(conversation && messages.length > 0);

  const openConversationsCount = useMemo(() => {
    return conversations.filter((c) => c.status !== 'resolved').length;
  }, [conversations]);

  const resolvedConversationsCount = useMemo(() => {
    return conversations.filter((c) => c.status === 'resolved').length;
  }, [conversations]);

  const displayedConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (sidebarFilter === 'open') return c.status !== 'resolved';
      if (sidebarFilter === 'resolved') return c.status === 'resolved';
      return true;
    });
  }, [conversations, sidebarFilter]);

  // Check if current conversation has reached a definitive policy conclusion
  const isDefinitivePolicyEnd = useMemo(() => {
    if (!hasActiveChat || messages.length === 0) return false;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.sender_type !== 'agent') return false;
    const body = lastMsg.body.toLowerCase();
    return (
      body.includes('end this chat') ||
      body.includes('cannot authorize') ||
      body.includes('outside our return window') ||
      body.includes('exceeds our') ||
      body.includes('only help with orders related to') ||
      body.includes('mark your inquiry as resolved') ||
      body.includes('circular loop') ||
      body.includes('loop killer') ||
      conversation?.status === 'resolved'
    );
  }, [hasActiveChat, messages, conversation?.status]);

  // Check if current conversation had a loop killed early
  const isLoopTerminated = useMemo(() => {
    if (!messages || messages.length === 0) return false;
    const lastAgent = [...messages].reverse().find((m) => m.sender_type === 'agent');
    if (!lastAgent) return false;
    const text = lastAgent.body.toLowerCase();
    return (
      text.includes('circular loop') ||
      text.includes('prevent repetitive circular messaging') ||
      text.includes('unproductive circular loop') ||
      text.includes('loop killer')
    );
  }, [messages]);

  const handleResolveCurrentChat = () => {
    if (!conversation) return;
    if (onResolveConversation) {
      onResolveConversation(conversation.id);
    }
  };

  // Helper to detect if a query is an ambiguous return/refund inquiry with no product/order specified
  const isVagueReturnQuery = (text: string) => {
    const lower = text.toLowerCase().trim();
    const returnIntent = /\b(return|refund|money back|exchange|send back|give back|replace|cancel|damaged|broken)\b/i.test(lower);
    const hasSpecificProduct =
      /\b(sd-\d+|wl-\d+|dress|garment|jacket|shirt|blouse|pants|bag|leather|boots|shoes|wallet|belt|denim|chiffon|silk|tote|backpack|messenger)\b/i.test(lower);

    return returnIntent && !hasSpecificProduct;
  };

  // Determine if active chat is currently awaiting product identification
  const isAwaitingProductClarification = useMemo(() => {
    if (!hasActiveChat || order || messages.length === 0) return false;
    const initialText = messages[0]?.body || '';
    return isVagueReturnQuery(initialText);
  }, [hasActiveChat, order, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (hasActiveChat) {
      scrollToBottom();
    }
  }, [messages.length, hasActiveChat, isAwaitingProductClarification]);

  // Handle send: if in active chat, append message; if on welcome screen, start new conversation
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    try {
      setIsSending(true);
      setInputText('');

      if (!hasActiveChat) {
        // Starts a brand new conversation ticket synchronously in the store
        onStartNewConversation(trimmed);
      } else {
        // Sends follow-up message into current active chat
        await onSendMessage(trimmed);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Direct selection of product from clarification cards inside active chat
  const handleSelectClarificationProduct = async (prod: CatalogProduct) => {
    await onSendMessage(`I would like to return the ${prod.itemName} (Order #${prod.orderNumber})`);
  };

  // Launch a curated test scenario directly or into active chat
  const handleLaunchScenario = (scenario: TestCaseScenario, asNewTicket = false) => {
    setShowNewModal(false);
    if (hasActiveChat && !asNewTicket) {
      onSendMessage(scenario.query);
    } else {
      onStartNewConversation(scenario.query, scenario.orderNumber, scenario.brandId);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    onStartNewConversation(customQuery.trim(), customOrderNum.trim() || undefined);
    setCustomQuery('');
    setCustomOrderNum('');
    setShowNewModal(false);
  };

  const handleSwitchConversation = (convId: string) => {
    if (!convId) {
      handleResetToFresh();
      return;
    }
    onSelectConversation(convId);
    // On small screens, close sidebar upon selection
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleResetToFresh = () => {
    setInputText('');
    onSelectConversation('');
    // On small screens, close sidebar upon new chat
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Filter test scenarios
  const filteredScenarios = CURATED_TEST_CASES.filter((tc) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'shein') return tc.brandName === 'Shein Designs';
    if (selectedFilter === 'watford') return tc.brandName === 'Watford Leathers';
    if (selectedFilter === 'borderline') return tc.category === 'Borderline Ambiguity';
    return true;
  });

  return (
    <div className="flex-1 flex flex-row h-full min-h-0 w-full bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden relative">
      {/* ========================================================================= */}
      {/* 1. CHATGPT-STYLE CONVERSATION HISTORY SIDEBAR                             */}
      {/* ========================================================================= */}

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-72 sm:w-80 bg-slate-50/90 text-slate-800 flex flex-col shrink-0
          border-r border-slate-200/90 transition-all duration-200 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}
        `}
      >
        {/* Sidebar Header: + New Chat & Collapse Button */}
        <div className="p-3 border-b border-slate-200/80 bg-white/70 backdrop-blur-xs flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToFresh}
            className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer group"
          >
            <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-200" />
            <span>New Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Conversation List (Newest First) */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="p-1 mb-1.5 bg-slate-200/60 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSidebarFilter('all')}
              className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-center ${
                sidebarFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({conversations.length})
            </button>
            <button
              type="button"
              onClick={() => setSidebarFilter('open')}
              className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-center ${
                sidebarFilter === 'open'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Active ({openConversationsCount})
            </button>
            <button
              type="button"
              onClick={() => setSidebarFilter('resolved')}
              className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-center ${
                sidebarFilter === 'resolved'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Resolved ({resolvedConversationsCount})
            </button>
          </div>

          {displayedConversations.length === 0 ? (
            <div className="p-6 text-center text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                {sidebarFilter === 'resolved' ? 'No resolved matters' : sidebarFilter === 'open' ? 'No active chats' : 'No previous chats'}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {sidebarFilter === 'resolved'
                  ? 'Chats concluded with a definitive policy decision will appear here once marked as resolved.'
                  : 'Start a new conversation to ask about returns, refunds, or orders.'}
              </p>
            </div>
          ) : (
            displayedConversations.map((c) => {
              const isActive = hasActiveChat && conversation?.id === c.id;
              const title = getConversationTitle(c);
              const preview = c.latestMessage?.body || 'No messages yet';
              const time = formatRelativeTime(c.latestMessage?.created_at || c.created_at);
              const isResolved = c.status === 'resolved';

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSwitchConversation(c.id)}
                  className={`
                    w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex flex-col gap-1 group
                    ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90 border-l-4 border-l-blue-600 pl-2.5'
                        : 'text-slate-700 hover:bg-white/90 hover:text-slate-900 border border-transparent hover:border-slate-200/60 hover:shadow-2xs'
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <span className="text-xs font-semibold truncate flex items-center gap-1.5 flex-1">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span className={`truncate ${isActive ? 'text-slate-950 font-bold' : 'text-slate-800'}`}>{title}</span>
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isResolved ? (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Resolved
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 font-medium">
                          Active
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {time}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pl-5">
                    <span className="truncate max-w-[170px]">{preview}</span>
                    {c.order && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80 shrink-0 font-semibold">
                        #{c.order.order_number}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Sidebar Footer: Customer Status Card */}
        <div className="p-3 border-t border-slate-200/80 bg-white/80 backdrop-blur-xs text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-[11px] shrink-0">
              {customer?.name ? customer.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="overflow-hidden">
              <div className="font-semibold text-slate-800 truncate">{customer?.name || 'Customer'}</div>
              <div className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Support Online
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CHAT AREA                                                         */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white">
        {/* Header Bar */}
        <header className="p-3.5 sm:p-4 border-b border-slate-200/80 bg-white text-slate-800 shrink-0 shadow-2xs">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Left: Sidebar Toggle & Customer Support Title */}
            <div className="flex items-center gap-3">
              {!isSidebarOpen && (
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                  title="Open conversation history"
                >
                  <PanelLeftOpen className="w-4 h-4 text-slate-700" />
                </button>
              )}

              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shadow-2xs shrink-0">
                <Headphones className="w-5 h-5 text-blue-600" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                    Customer Support
                    <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Support Online
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>Customer: <strong className="text-slate-800 font-medium">{customer?.name || 'Guest User'}</strong></span>
                  {customer?.email && <span className="text-slate-400 text-[11px] hidden sm:inline">({customer.email})</span>}
                </div>
              </div>
            </div>

            {/* Right: + New Chat & Test Cases */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToFresh}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Start a new separate customer chat"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>New Chat</span>
              </button>

              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                title="Browse all test cases"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>Test Cases</span>
              </button>
            </div>
          </div>

          {/* Linked Order Ribbon (Only when active in a specific order conversation) */}
          {hasActiveChat && order && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2 bg-slate-50/80 px-3 py-2 rounded-xl animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                  Order Reference:
                </span>
                <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">
                  #{order.order_number}
                </span>
                <span className="text-slate-600 font-medium">
                  ({order.items_json.map((i) => i.name).join(', ')})
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold uppercase text-[10px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {order.status}
                </span>
                <span>
                  Total: <strong className="text-slate-900 font-mono">${order.total_amount.toFixed(2)}</strong>
                </span>
              </div>
            </div>
          )}
        </header>

        {/* Main Body: Welcome Screen or Active Chat Timeline */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {!hasActiveChat ? (
            /* FRESH CONCIERGE CANVAS: Clean Welcome Screen with Quick Starters */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-2xs">
                <Building2 className="w-7 h-7 text-blue-600" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Customer Support Assistant
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Need help with a return, refund, or order question? Click a quick starter below or type your inquiry:
                </p>
              </div>

              {/* Quick starter inquiry chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onStartNewConversation('I want a refund')}
                  className="px-3.5 py-2 rounded-full bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-xs text-slate-700 font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                  title="Starts inquiry and opens product clarification"
                >
                  <span>💬</span>
                  <span>I want a refund</span>
                </button>

                <button
                  type="button"
                  onClick={() => onStartNewConversation('I want to return things')}
                  className="px-3.5 py-2 rounded-full bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-xs text-slate-700 font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                  title="Starts inquiry and opens product clarification"
                >
                  <span>🔄</span>
                  <span>I want to return things</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onStartNewConversation(
                      'I received my Floral Silk Chiffon Midi Dress from order SD-1001 yesterday but the zipper is broken and seam torn. Can I get a replacement or refund?',
                      'SD-1001',
                      '11111111-1111-1111-1111-111111111111'
                    )
                  }
                  className="px-3.5 py-2 rounded-full bg-blue-50 border border-blue-200 hover:bg-blue-100 text-xs text-blue-900 font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>👗</span>
                  <span>Return Silk Dress (#SD-1001)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onStartNewConversation(
                      'I ordered the Full-Grain Leather Messenger Bag (Order #WL-2001) and I want to return it for a refund.',
                      'WL-2001',
                      '22222222-2222-2222-2222-222222222222'
                    )
                  }
                  className="px-3.5 py-2 rounded-full bg-slate-100 border border-slate-300 hover:bg-slate-200 text-xs text-slate-800 font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>💼</span>
                  <span>Return Leather Bag (#WL-2001)</span>
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE CHAT TIMELINE */
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((msg) => {
                const isCustomer = msg.sender_type === 'customer';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      isCustomer ? 'flex-row-reverse' : 'flex-row'
                    } animate-fadeIn`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs ${
                        isCustomer
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-600 border border-blue-200'
                      }`}
                    >
                      {isCustomer ? 'ME' : <Headphones className="w-4 h-4 text-blue-600" />}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`flex flex-col space-y-1 max-w-[80%] ${
                        isCustomer ? 'items-end' : 'items-start'
                      }`}
                    >
                      {!isCustomer && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold px-1">
                          <UserCheck className="w-3 h-3 text-blue-600" />
                          <span className="font-bold text-slate-800">Support Team</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-mono text-[9px]">
                            Policy Verified
                          </span>
                        </div>
                      )}

                      <div
                        className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                          isCustomer
                            ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs shadow-2xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.body}</p>
                      </div>

                      <div
                        className={`flex items-center gap-1 text-[10px] text-slate-400 px-1 ${
                          isCustomer ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {isCustomer && (
                          <span className="text-slate-500 font-medium ml-1">• Sent</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* INLINE PRODUCT CLARIFICATION PROMPT (Neutral Customer-Facing) */}
              {isAwaitingProductClarification && (
                <div className="flex items-start gap-2.5 flex-row animate-fadeIn my-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs shrink-0">
                    <Headphones className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col space-y-2 max-w-[95%] items-start w-full">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold px-1">
                      <UserCheck className="w-3 h-3 text-blue-600" />
                      <span className="font-bold text-slate-800">Support Concierge</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-mono text-[9px]">
                        Product Clarification
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-2xs space-y-3.5 w-full">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          What is the item or product that you would like to return or inquire about?
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Select your product or enter your order details below so our support team can verify your eligibility and process your request.
                        </p>
                      </div>

                      {/* 4 Interactive Product Selection Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {CATALOG_PRODUCTS.map((prod) => (
                          <button
                            key={prod.orderNumber}
                            type="button"
                            onClick={() => handleSelectClarificationProduct(prod)}
                            className="text-left p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 bg-slate-50/70 transition-all flex flex-col justify-between group cursor-pointer shadow-2xs"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 flex items-center gap-1.5">
                                  <span className="text-sm">{prod.icon}</span>
                                  <span className="truncate">{prod.itemName}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className="font-semibold px-1.5 py-0.2 rounded font-mono text-[9px] bg-slate-100 text-slate-700 border border-slate-200">
                                  {prod.category}
                                </span>
                                <span className="text-slate-600 font-mono font-bold">#{prod.orderNumber}</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Status: <span className="font-medium text-slate-700">{prod.deliveredText}</span>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 truncate text-[9px]">{prod.policySummary}</span>
                              <span className="font-bold text-blue-600 flex items-center gap-0.5 ml-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                                Select <ArrowRight className="w-2.5 h-2.5 inline" />
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="pt-1 text-[11px] text-slate-400 border-t border-slate-100">
                        <span>Or type your product name or order number in the box below:</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Support Agent Reviewing Notification */}
              {(isSending || isGeneratingAI) && (
                <div className="flex items-start gap-2.5 animate-fadeIn">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs shrink-0">
                    <Headphones className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-700 font-semibold px-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      <span>Your inquiry has been received by our support team...</span>
                    </div>
                    <div className="bg-white border border-blue-200/80 rounded-2xl rounded-tl-xs p-3 text-xs text-slate-600 shadow-2xs flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[11px] text-slate-500 ml-1">Support agent is evaluating against return policies...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Definitive Policy End Prompt */}
              {isDefinitivePolicyEnd && conversation?.status !== 'resolved' && (
                <div className="flex items-start gap-2.5 animate-fadeIn my-4">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-2xs shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex flex-col space-y-2 max-w-[95%] items-start w-full">
                    <div className="bg-slate-900 text-white rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-md border border-slate-700/80 w-full space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Definitive Policy Conclusion
                        </span>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          Action Required
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Our store policy determination is complete. Would you like to end this chat and sort this inquiry into resolved matters?
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleResolveCurrentChat}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Yes, End Chat &amp; Mark as Resolved</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleResetToFresh}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                        >
                          Start New Chat
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loop Terminated Banner */}
              {isLoopTerminated && (
                <div className="flex items-center justify-between p-3.5 my-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs animate-fadeIn shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">Conversation Concluded — Loop Terminated Early</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">
                          Final Policy Determination
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Our store policy determination on this matter is final. To prevent an unproductive circular loop, this inquiry has been concluded and marked as resolved.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToFresh}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    + Start New Chat
                  </button>
                </div>
              )}

              {/* Resolved Matter Confirmation Banner */}
              {conversation?.status === 'resolved' && !isLoopTerminated && (
                <div className="flex items-center justify-between p-3.5 my-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs animate-fadeIn shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">This conversation has ended and is marked as Resolved.</span>
                      <p className="text-[11px] text-emerald-800 mt-0.5">Sorted into your resolved matters history.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToFresh}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    + Start New Chat
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Customer Message Composer */}
        <form
          onSubmit={handleSend}
          className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-col gap-2 shrink-0"
        >
          {isAwaitingProductClarification && (
            <div className="flex items-center justify-between px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 animate-fadeIn">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Awaiting product identification (click an item above or type product name below)</span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isLoopTerminated
                  ? 'This inquiry is concluded (Loop Terminated). Click "+ Start New Chat" to ask about another order...'
                  : conversation?.status === 'resolved'
                  ? 'This matter is resolved. Type a message to reopen, or click New Chat above...'
                  : isAwaitingProductClarification
                  ? 'Type your product name (e.g. Silk Dress or Chelsea Boots)...'
                  : hasActiveChat
                  ? 'Type your message or follow-up question to support...'
                  : 'Type your inquiry or issue here (e.g. I want a refund)...'
              }
              disabled={isSending || isLoopTerminated}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-inner disabled:opacity-60"
            />
            {isLoopTerminated ? (
              <button
                type="button"
                onClick={handleResetToFresh}
                className="px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>+ New Chat</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="ds-btn-primary flex items-center gap-1.5 px-5 py-2.5 text-xs shadow-xs disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending...' : 'Send'}</span>
              </button>
            )}
          </div>
        </form>
      </main>

      {/* ========================================================================= */}
      {/* 3. TEST CASES EXPLORER MODAL                                              */}
      {/* ========================================================================= */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Select Test Case Inquiry</h3>
                  <p className="text-xs text-slate-500">Pick any pre-configured test scenario or type a custom question.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 text-xs">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All Scenarios ({CURATED_TEST_CASES.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('shein')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedFilter === 'shein'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                Apparel Scenarios
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('watford')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedFilter === 'watford'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                Leather Goods Scenarios
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('borderline')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedFilter === 'borderline'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200'
                }`}
              >
                Borderline Tests
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('custom')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedFilter === 'custom'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                + Custom Query
              </button>
            </div>

            {/* Scenarios List / Custom Form */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[300px]">
              {selectedFilter !== 'custom' ? (
                filteredScenarios.map((tc) => (
                  <div
                    key={tc.id}
                    className="p-3.5 bg-slate-50 hover:bg-blue-50/40 border border-slate-200 hover:border-blue-300 rounded-xl transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {tc.orderNumber && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-bold">
                            #{tc.orderNumber}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Customer: {tc.customerName}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded bg-white border border-slate-200">
                        {tc.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{tc.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{tc.description}</p>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-xs text-slate-700 italic">
                      "{tc.query}"
                    </div>

                    <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                      <span className="text-[10px] text-slate-500 font-medium">
                        Expected: <strong className="text-slate-700 font-semibold">{tc.expectedBehavior}</strong>
                      </span>
                      {hasActiveChat ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleLaunchScenario(tc, false)}
                            className="ds-btn-primary flex items-center gap-1 text-xs py-1 px-2.5 shadow-xs cursor-pointer whitespace-nowrap"
                            title="Send this inquiry directly into the current chat"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send to Chat</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLaunchScenario(tc, true)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                            title="Create a separate ticket"
                          >
                            <span>New Ticket</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleLaunchScenario(tc, false)}
                          className="ds-btn-primary flex items-center gap-1 text-xs py-1 px-3 shadow-xs cursor-pointer whitespace-nowrap"
                        >
                          <span>Launch Test Case</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                /* Custom Query Form */
                <form onSubmit={handleCustomSubmit} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Order Reference (Optional)
                    </label>
                    <input
                      type="text"
                      value={customOrderNum}
                      onChange={(e) => setCustomOrderNum(e.target.value)}
                      placeholder="e.g. SD-1001 or WL-2001"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Your Message / Query <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={customQuery}
                      onChange={(e) => setCustomQuery(e.target.value)}
                      placeholder="Describe your issue or inquiry..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewModal(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!customQuery.trim()}
                      className="ds-btn-primary px-4 py-1.5 text-xs cursor-pointer disabled:opacity-40"
                    >
                      Create Custom Inquiry
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
