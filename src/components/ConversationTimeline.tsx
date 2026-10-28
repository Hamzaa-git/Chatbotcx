import React, { useState } from 'react';
import { Conversation, Customer, Order, Message } from '../types/database';
import {
  Send,
  Sparkles,
  Headphones,
  Radio,
  Clock,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';

interface ConversationTimelineProps {
  conversation: Conversation;
  customer: Customer;
  order: Order | null;
  messages: Message[];
  simulatorMode: boolean;
  onSendManualAgentMessage: (body: string) => Promise<void>;
  onSendSimulatorCustomerMessage: (body: string) => Promise<void>;
  onTriggerAIGeneration: () => Promise<void>;
  isGeneratingAI: boolean;
  brandName: string;
}

export const ConversationTimeline: React.FC<ConversationTimelineProps> = ({
  conversation,
  customer,
  order,
  messages,
  simulatorMode,
  onSendManualAgentMessage,
  onSendSimulatorCustomerMessage,
  onTriggerAIGeneration,
  isGeneratingAI,
  brandName
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    try {
      setIsSending(true);
      if (simulatorMode) {
        await onSendSimulatorCustomerMessage(inputText.trim());
      } else {
        await onSendManualAgentMessage(inputText.trim());
      }
      setInputText('');
    } finally {
      setIsSending(false);
    }
  };

  const loadScenarioPrompt = (text: string) => {
    setInputText(text);
  };

  return (
    <div className="flex flex-col h-full ds-card overflow-hidden">
      {/* Top Header: LIVE CONVERSATION */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE CONVERSATION
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold text-slate-900">{customer.name}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
            {brandName} • v{conversation.version}
          </span>
        </div>

        {order && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono font-bold text-slate-800">{order.order_number}</span>
            <span
              className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                order.status === 'delivered'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {order.status}
            </span>
          </div>
        )}
      </div>

      {/* Simulator Mode Reviewer Banner */}
      {simulatorMode && (
        <div className="bg-amber-50/80 border-b border-amber-200 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Radio className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Customer Simulator Active</span>
              <span className="text-[10px] font-normal text-amber-700">
                (Messages simulate incoming customer inquiries without autonomous AI trigger)
              </span>
            </div>
          </div>

          {/* Quick Scenario Fill Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-amber-800 font-semibold mr-1 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" /> Test Inquiries:
            </span>
            <button
              type="button"
              onClick={() =>
                loadScenarioPrompt(
                  'Hello, I just opened my delivery and the glass item is cracked into pieces! Can you send a replacement?'
                )
              }
              className="px-2.5 py-1 bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-300 rounded text-xs font-medium shadow-xs transition-colors"
            >
              Damage Claim
            </button>
            <button
              type="button"
              onClick={() =>
                loadScenarioPrompt(
                  'Hi, I received my order about 20 days ago. Can I return it for a full refund?'
                )
              }
              className="px-2.5 py-1 bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-300 rounded text-xs font-medium shadow-xs transition-colors"
            >
              20-Day Refund Window
            </button>
            <button
              type="button"
              onClick={() =>
                loadScenarioPrompt(
                  'Hello, what is your refund process if the flask does not fit my bicycle cage?'
                )
              }
              className="px-2.5 py-1 bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-300 rounded text-xs font-medium shadow-xs transition-colors"
            >
              Delivery Date Pending
            </button>
            <button
              type="button"
              onClick={() =>
                loadScenarioPrompt(
                  'Hi! Does your brand sponsor college athletics or university tournaments?'
                )
              }
              className="px-2.5 py-1 bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-300 rounded text-xs font-medium shadow-xs transition-colors"
            >
              Out of Scope Query
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/40">
        {/* System Event divider: Bot entered the chat */}
        <div className="flex items-center justify-center">
          <span className="text-[10px] font-medium text-slate-400 bg-white px-2.5 py-0.5 rounded-full border border-slate-200/80 shadow-xs">
            Conversation opened
          </span>
        </div>

        {messages.map((msg, index) => {
          const isCustomer = msg.sender_type === 'customer';
          const isAgent = msg.sender_type === 'agent';

          return (
            <React.Fragment key={msg.id}>
              {/* Optional divider before human agent message */}
              {isAgent && index > 0 && messages[index - 1].sender_type === 'customer' && (
                <div className="flex items-center justify-center my-2">
                  <span className="text-[10px] font-medium text-slate-400 bg-white px-2.5 py-0.5 rounded-full border border-slate-200/80 shadow-xs">
                    Agent joined thread
                  </span>
                </div>
              )}

              <div className={`flex items-start gap-2.5 ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                {/* Bot / Agent Avatar on Left */}
                {!isCustomer && (
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-700 shadow-xs">
                    <Headphones className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-lg rounded-xl p-3.5 transition-all ${
                    isCustomer
                      ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-[10px]">
                    <span className={`font-bold ${isCustomer ? 'text-blue-100' : 'text-slate-600'}`}>
                      {isCustomer ? `${customer.name} (Customer)` : 'Support Agent (Alex M.)'}
                    </span>
                    <span className={`font-mono ${isCustomer ? 'text-blue-200' : 'text-slate-400'} flex items-center gap-1`}>
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed whitespace-pre-wrap font-sans">{msg.body}</p>

                  <div
                    className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[9px] font-mono ${
                      isCustomer ? 'border-blue-500/80 text-blue-200' : 'border-slate-100 text-slate-400'
                    }`}
                  >
                    <span>req: {msg.client_request_id}</span>
                    {!isCustomer && (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Sent to Customer
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Composer & Action Dock */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Reply Composer</span>
            {simulatorMode ? (
              <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 px-2 py-0.2 rounded font-bold">
                Simulator Mode (Customer)
              </span>
            ) : (
              <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.2 rounded font-semibold">
                Manual Agent
              </span>
            )}
          </div>

          {/* Trigger AI Suggestion Button */}
          <button
            type="button"
            onClick={onTriggerAIGeneration}
            disabled={isGeneratingAI}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition-all disabled:opacity-50"
          >
            {isGeneratingAI ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Generating Suggestion...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                Generate AI Suggestion
              </>
            )}
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="space-y-2.5">
          <div className="relative">
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                simulatorMode
                  ? 'Simulate customer message (persists in thread, does not invoke AI)...'
                  : 'Type manual agent response (sends directly without AI generation or approval)...'
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              Enter sends message • Shift+Enter for newline
            </span>

            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                simulatorMode
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-blue-700 hover:bg-blue-800 text-white'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Send className="w-3.5 h-3.5" />
              {simulatorMode ? 'Send as Customer' : 'Send Manual Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
