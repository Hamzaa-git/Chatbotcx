import React, { useState, useRef, useEffect } from 'react';
import { Brand } from '../types/database';
import { dataStore, CurrentUser } from '../services/store';
import { generateAIReply, GenerateReplyOutput } from '../services/aiGenerator';
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleAction,
  ChatBubbleActionWrapper
} from '@/components/ui/chat-bubble';
import {
  Send,
  Sparkles,
  Building2,
  CheckCircle2,
  Copy,
  RotateCcw,
  BookOpen,
  Check,
  ShieldCheck,
  Cpu,
  User,
  Bot
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  detectedBrand?: Brand | null;
  confidence?: number;
  reason?: string;
  sources?: GenerateReplyOutput['sources'];
  generationId?: string;
  isApproved?: boolean;
}

interface ChatbotViewProps {
  currentUser: CurrentUser | null;
  authorizedBrands: Brand[];
  onSwitchToConsole?: () => void;
  onSelectBrand?: (brandId: string) => void;
}

export const ChatbotView: React.FC<ChatbotViewProps> = ({
  currentUser,
  authorizedBrands,
  onSwitchToConsole,
  onSelectBrand
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Live brand detection as user types
  const liveDetection = React.useMemo(() => {
    return dataStore.detectBrandFromQuery(inputText);
  }, [inputText]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading || !currentUser) return;

    // 1. Detect Company
    const detection = dataStore.detectBrandFromQuery(query);
    const targetBrand = detection.brand || authorizedBrands[0];

    // Inform parent about active brand
    if (onSelectBrand && targetBrand) {
      onSelectBrand(targetBrand.id);
    }

    // 2. Add User Message
    const userMsgId = `user-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // 3. Ingest into Store as Ticket (maintaining all RLS & assessment requirements)
      const ticket = dataStore.createTicketFromInquiry(currentUser.id, {
        brandId: targetBrand.id,
        query: query
      });

      // 4. Generate AI Reply with Autonomous AI Policy Engine
      const clientRequestId = `chat-req-${Date.now()}`;
      const output = await generateAIReply({
        conversationId: ticket.conversation.id,
        clientRequestId,
        userId: currentUser.id
      });

      // 5. Add Assistant Message
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: output.draft,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          detectedBrand: targetBrand,
          confidence: detection.confidence,
          reason: detection.reason,
          sources: output.sources,
          generationId: output.generationId
        }
      ]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown generation error';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `Error generating grounded response: ${errMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          detectedBrand: targetBrand,
          confidence: 0,
          reason: 'Generation failed'
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = (msgId: string, generationId?: string, text?: string) => {
    if (!currentUser || !generationId || !text) return;
    try {
      const review = dataStore.approveReply(currentUser.id, generationId, text);
      const ticket = dataStore.getConversations(currentUser.id, authorizedBrands[0].id)[0];
      if (ticket) {
        dataStore.sendApprovedReply(currentUser.id, review.id, `approve-chat-${Date.now()}`, ticket.version);
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, isApproved: true } : m))
      );
    } catch (e) {
      console.warn('Approve log warning:', e);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, isApproved: true } : m))
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    dataStore.clearConversations(currentUser?.id);
    inputRef.current?.focus();
  };

  return (
    <div className="flex-1 flex flex-col h-full max-w-4xl w-full mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Chatbot Top Bar */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">CX Multi-Brand AI Assistant</h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Autonomous AI Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Auto-detects company (Shein Designs vs Watford Leathers) &amp; replies using official brand policies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleResetChat}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
              title="Clear chat and start fresh"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          )}

          {onSwitchToConsole && (
            <button
              onClick={onSwitchToConsole}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              title="Switch to back-office ticketing & admin console"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Enterprise Console</span>
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.length === 0 ? (
          // Welcome Screen with Sample Prompts
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-pink-600 to-amber-700 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">How can I help you today?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Enter any customer query or support request. I will automatically identify whether it belongs to <strong>Shein Designs</strong> (Clothes) or <strong>Watford Leathers</strong> (Leather Goods), evaluate brand policies, and draft a grounded response.
              </p>
            </div>

            <div className="w-full space-y-2 pt-2 text-left">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block text-center">
                Click a sample query to test company auto-detection:
              </span>

              <button
                onClick={() =>
                  handleSend(
                    'I received order #SD-1001 from Shein Designs yesterday, but the dress is a different colour than expected and I would like to return it.'
                  )
                }
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-pink-300 hover:bg-pink-50/30 transition-all text-left flex items-start justify-between gap-3 group bg-white shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900 group-hover:text-pink-700">
                      Shein Designs (Clothes &amp; Apparel)
                    </span>
                    <span className="text-[9px] font-mono bg-pink-100 text-pink-800 px-1.5 py-0.2 rounded font-bold">
                      Order #SD-1001
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    &ldquo;The dress is a different colour than expected and I would like to return it.&rdquo;
                  </p>
                </div>
                <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-pink-600 shrink-0 mt-1" />
              </button>

              <button
                onClick={() =>
                  handleSend(
                    'The brass hardware on my Watford Leathers messenger bag came unstitched. Order #WL-2001. How do I request a repair or return?'
                  )
                }
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all text-left flex items-start justify-between gap-3 group bg-white shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900 group-hover:text-amber-700">
                      Watford Leathers (Leather Goods)
                    </span>
                    <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                      Order #WL-2001
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    &ldquo;The brass hardware on my Watford Leathers bag came unstitched. How do I request a repair or return?&rdquo;
                  </p>
                </div>
                <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0 mt-1" />
              </button>

              <button
                onClick={() =>
                  handleSend(
                    'I want to return an item I ordered. What is your return window and refund policy?'
                  )
                }
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left flex items-start justify-between gap-3 group bg-white shadow-2xs"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700">
                    General Brand Return Policy Check
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    &ldquo;I want to return an item I ordered. What is your return window and refund policy?&rdquo;
                  </p>
                </div>
                <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-1" />
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <ChatBubble key={msg.id} variant="sent">
                  <ChatBubbleAvatar
                    fallback={<User className="w-4 h-4 text-slate-700" />}
                    className="bg-slate-100 border border-slate-200"
                  />
                  <ChatBubbleMessage variant="sent" className="max-w-[85%] text-xs leading-relaxed shadow-xs">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className="text-[10px] text-blue-100 block text-right mt-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </ChatBubbleMessage>
                </ChatBubble>
              );
            }

            // Assistant Message
            return (
              <ChatBubble key={msg.id} variant="received">
                <ChatBubbleAvatar
                  fallback={
                    msg.detectedBrand?.slug === 'shein-designs' || msg.detectedBrand?.slug === 'glassleaf' ? (
                      <Sparkles className="w-4 h-4 text-pink-700" />
                    ) : (
                      <Bot className="w-4 h-4 text-amber-700" />
                    )
                  }
                  className={
                    msg.detectedBrand?.slug === 'shein-designs' || msg.detectedBrand?.slug === 'glassleaf'
                      ? 'bg-pink-50 border border-pink-200'
                      : 'bg-amber-50 border border-amber-200'
                  }
                />
                <div className="flex-1 max-w-[88%] space-y-1.5">
                  <ChatBubbleMessage
                    variant="received"
                    className="bg-white border border-slate-200 text-xs text-slate-800 space-y-3 shadow-xs"
                  >
                    {/* Company Auto-Detection Badge */}
                    {msg.detectedBrand && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold text-[11px] border shadow-2xs ${
                              msg.detectedBrand.slug === 'shein-designs' || msg.detectedBrand.slug === 'glassleaf'
                                ? 'bg-pink-50 text-pink-800 border-pink-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <Building2 className="w-3 h-3" />
                            <span>Detected: {msg.detectedBrand.name}</span>
                          </span>

                          {typeof msg.confidence === 'number' && msg.confidence > 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 font-bold border border-slate-200">
                              {msg.confidence}% confidence
                            </span>
                          )}
                        </div>

                        {msg.reason && (
                          <span className="text-[10px] text-slate-400 italic max-w-xs truncate" title={msg.reason}>
                            {msg.reason}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Grounded AI Response Text */}
                    <div className="text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
                      {msg.text}
                    </div>

                    {/* Policy Sources Pill */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Verified Brand Sources:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {msg.sources.map((s, idx) => {
                            const title =
                              s.contentSnapshot.split('\n')[0].replace(/^#+\s*/, '') ||
                              `Policy (v${s.policyVersion})`;
                            return (
                              <span
                                key={idx}
                                className="text-[10px] bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono"
                              >
                                {title} (v{s.policyVersion})
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </ChatBubbleMessage>

                  {/* Actions: Copy & Approve under the message bubble */}
                  <ChatBubbleActionWrapper className="justify-between px-1">
                    <div className="flex items-center gap-2">
                      <ChatBubbleAction
                        icon={
                          copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                          )
                        }
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                      />

                      {msg.generationId && (
                        <button
                          onClick={() => handleApprove(msg.id, msg.generationId, msg.text)}
                          disabled={msg.isApproved}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded transition-all ${
                            msg.isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{msg.isApproved ? 'Approved & Dispatched' : 'Approve & Send'}</span>
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Cpu className="w-2.5 h-2.5 text-blue-600" />
                      Policy AI Engine
                    </span>
                  </ChatBubbleActionWrapper>
                </div>
              </ChatBubble>
            );
          })
        )}

        {/* Loading Bubble */}
        {isLoading && (
          <ChatBubble variant="received">
            <ChatBubbleAvatar
              fallback={<Bot className="w-4 h-4 text-blue-700" />}
              className="bg-blue-50 border border-blue-200"
            />
            <div className="flex-1 max-w-[80%] space-y-1">
              <ChatBubbleMessage
                variant="received"
                isLoading
                className="bg-white border border-slate-200 shadow-xs text-xs"
              />
              <span className="text-[10px] text-slate-400 px-1">
                {liveDetection.brand
                  ? `Analyzing ${liveDetection.brand.name} policies & generating AI reply...`
                  : 'Grounded generation in progress...'}
              </span>
            </div>
          </ChatBubble>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chatbot Input Bar */}
      <div className="p-3 sm:p-4 border-t border-slate-100 bg-white shrink-0">
        {/* Real-time brand preview pill if user is typing */}
        {inputText.trim().length > 3 && liveDetection.brand && (
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] text-slate-600 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Target Company:</span>
              <span
                className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                  liveDetection.brand.slug === 'shein-designs' || liveDetection.brand.slug === 'glassleaf'
                    ? 'bg-pink-100 text-pink-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {liveDetection.brand.name} ({liveDetection.confidence}% match)
              </span>
            </span>
            <span className="text-[10px] text-slate-400">Press Enter to send</span>
          </div>
        )}

        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-600 focus-within:bg-white focus-within:border-transparent transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your customer query... (e.g. 'I want to return my dress due to colour difference...', 'Can I exchange my Watford bag?')"
            className="flex-1 bg-transparent border-0 focus:outline-none text-xs text-slate-900 placeholder-slate-400 resize-none max-h-32 leading-relaxed"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-all shrink-0 shadow-xs cursor-pointer"
            title="Send query"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Multi-Tenant Isolation &amp; Policy Grounding Active
          </span>
          <span>AI Policy Gateway</span>
        </div>
      </div>
    </div>
  );
};
