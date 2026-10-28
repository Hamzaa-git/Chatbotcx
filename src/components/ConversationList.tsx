import React, { useState } from 'react';
import { Conversation, Customer, Order, Message } from '../types/database';
import {
  Search,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  PlusCircle,
  Trash2,
  RotateCcw,
  Sparkles,
  Inbox
} from 'lucide-react';

interface ConversationListItem extends Conversation {
  customer: Customer;
  order: Order | null;
  latestMessage: Message | null;
}

interface ConversationListProps {
  conversations: ConversationListItem[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  brandName: string;
  onOpenNewInquiry?: () => void;
  onClearQueue?: () => void;
  onResetDemo?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  brandName,
  onOpenNewInquiry,
  onClearQueue,
  onResetDemo
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const openCount = conversations.filter((c) => c.status !== 'resolved').length;
  const resolvedCount = conversations.filter((c) => c.status === 'resolved').length;

  const filtered = conversations.filter((c) => {
    if (statusFilter === 'open' && c.status === 'resolved') return false;
    if (statusFilter === 'resolved' && c.status !== 'resolved') return false;
    const q = searchTerm.toLowerCase();
    const customerName = c.customer.name.toLowerCase();
    const orderNum = c.order?.order_number.toLowerCase() || '';
    const lastMsg = c.latestMessage?.body.toLowerCase() || '';
    return customerName.includes(q) || orderNum.includes(q) || lastMsg.includes(q);
  });

  return (
    <div className="flex flex-col h-full ds-card overflow-hidden">
      {/* Header & Actions */}
      <div className="p-3.5 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="ds-eyebrow">TICKET QUEUE</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
              {filtered.length}
            </span>
          </div>
          <span className="text-[11px] text-blue-700 font-semibold">{brandName}</span>
        </div>

        {/* Action Button: Ingest Query / Brand Auto-Detect */}
        {onOpenNewInquiry && (
          <button
            onClick={onOpenNewInquiry}
            className="w-full ds-btn-primary flex items-center justify-center gap-2 py-2 text-xs shadow-xs"
            title="Enter customer query to auto-detect company and route ticket"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>+ Enter Customer Query</span>
          </button>
        )}

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({conversations.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('open')}
            className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
              statusFilter === 'open'
                ? 'bg-white text-amber-700 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Open ({openCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('resolved')}
            className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
              statusFilter === 'resolved'
                ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          {onClearQueue && (
            <button
              onClick={() => {
                if (window.confirm('Clear all tickets in this queue to start fresh?')) {
                  onClearQueue();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
              title="Clear all tickets (Empty Queue)"
              aria-label="Clear Queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onResetDemo && (
            <button
              onClick={() => {
                if (window.confirm('Reset queue back to default assessment seed data?')) {
                  onResetDemo();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors"
              title="Reset to Assessment Demo Seed"
              aria-label="Reset Seed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5" role="list" aria-label="Customer support conversations">
        {conversations.length === 0 ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Queue is Clean</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                No pre-existing tickets. Enter an incoming customer query to auto-detect the company and initiate an AI-assisted reply.
              </p>
            </div>
            {onOpenNewInquiry && (
              <button
                onClick={onOpenNewInquiry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Enter Query Now</span>
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No conversations match your search.
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = item.id === selectedConversationId;
            return (
              <div
                key={item.id}
                role="listitem"
                tabIndex={0}
                onClick={() => onSelectConversation(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectConversation(item.id);
                  }
                }}
                className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer select-none focus:outline-none ${
                  isSelected
                    ? 'border-l-4 border-l-blue-600 bg-blue-50/50 border-y-slate-200 border-r-slate-200 shadow-xs'
                    : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {item.customer.name}
                    </span>
                  </div>

                  {item.order && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 shrink-0 font-semibold">
                      <ShoppingBag className="w-2.5 h-2.5 text-slate-500" />
                      {item.order.order_number}
                    </span>
                  )}
                </div>

                {/* Message preview snippet */}
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-2 font-normal">
                  {item.latestMessage?.body || 'No messages yet in this conversation.'}
                </p>

                {/* Footer Badges */}
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    {item.status === 'open' ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                        <AlertCircle className="w-3 h-3 text-amber-600" /> Open
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Resolved
                      </span>
                    )}
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-slate-500 font-semibold">v{item.version}</span>
                  </div>

                  <span className="flex items-center gap-1 text-slate-400 font-mono">
                    <Clock className="w-3 h-3" />
                    {item.latestMessage ? new Date(item.latestMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recent'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
