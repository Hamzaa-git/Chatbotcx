import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Download,
  Bot,
  User,
  SlidersHorizontal,
  ArrowRight,
  Zap,
  Info
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  latencyMs?: number;
  tokens?: {
    prompt?: number;
    completion?: number;
  };
  modelName?: string;
  error?: boolean;
}

export type PersonaMode = 'general' | 'glassleaf' | 'puresip' | 'architect';

const PERSONA_CONFIGS: Record<
  PersonaMode,
  { name: string; tag: string; description: string; systemPrompt: string; badgeColor: string }
> = {
  general: {
    name: 'Universal LLM Assistant',
    tag: 'General Mode',
    description: 'Versatile, open-domain conversational AI. Ask anything: general knowledge, support best practices, drafting, coding, or problem solving.',
    systemPrompt:
      'You are a friendly, highly intelligent, and articulate AI assistant. Answer questions clearly, accurately, and concisely. Use formatting like bullet points and bold text where helpful.',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  glassleaf: {
    name: 'Glassleaf Support Concierge',
    tag: 'Brand: Glassleaf',
    description: 'Specialized in Glassleaf store policies: 7-day refund window from delivery, 48-hour damage reporting window with photo requirement, 3-5 business days shipping, cancel before dispatch.',
    systemPrompt:
      'You are the official customer support AI for Glassleaf. Strictly follow Glassleaf policies: 7-day refund window from delivery date; damage reports must be submitted within 48 hours with order reference and clear product photographs; shipping takes 3-5 business days; cancellations accepted only before dispatch; refunds process in 5-7 business days after approval. Be courteous, empathetic, and accurate.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  puresip: {
    name: 'PureSip Support Concierge',
    tag: 'Brand: PureSip',
    description: 'Specialized in PureSip store policies: 30-day refund window, 7-day damage reporting window with photo requirement, 5-7 business days shipping, cancel within 2 hours of order.',
    systemPrompt:
      'You are the official customer support AI for PureSip. Strictly follow PureSip policies: 30-day refund window from delivery date; damage reports must be filed within 7 days with order reference and photographs; shipping takes 5-7 business days; cancellations must be requested within 2 hours of ordering and before dispatch; refunds process in 7-10 business days after approval. Be helpful, professional, and precise.',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  architect: {
    name: 'Datastraw CX Architect',
    tag: 'System Architecture',
    description: 'Expert technical advisor for the CX Copilot system: RLS security, deterministic policy evaluation, multi-tenant boundaries, and scale design.',
    systemPrompt:
      'You are the Senior Technical Architect for Datastraw CX Copilot. You can explain the multi-brand architecture, deterministic retrieval and rule evaluation engine, Row-Level Security (RLS) enforcement, state transitions (editable -> approved -> sent), staleness protection, and 500-brand scale design.',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  }
};

const SUGGESTED_PROMPTS: Array<{ title: string; prompt: string; persona: PersonaMode }> = [
  {
    title: 'Check Glassleaf return window',
    prompt: 'I received my Glassleaf order GL-4012 20 days ago. Can I return it for a full refund?',
    persona: 'glassleaf'
  },
  {
    title: 'Report broken bottle arrival',
    prompt: 'My Glassleaf shipment arrived today with a broken glass bottle! What evidence do I need to submit to get a replacement?',
    persona: 'glassleaf'
  },
  {
    title: 'Compare Glassleaf vs PureSip policies',
    prompt: 'Can you compare the refund windows, damage reporting timeframes, and cancellation policies between Glassleaf and PureSip side-by-side?',
    persona: 'general'
  },
  {
    title: 'PureSip 25-day refund inquiry',
    prompt: 'I purchased a PureSip tumbler 25 days ago. Am I still eligible for a return and refund?',
    persona: 'puresip'
  },
  {
    title: 'Explain deterministic guardrails',
    prompt: 'How does the CX Copilot prevent AI hallucinations when checking elapsed return policy windows?',
    persona: 'architect'
  }
];

export const SimpleChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('cx_simple_chatbot_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse saved chat history:', e);
      }
    }
    return [
      {
        id: 'welcome-msg',
        role: 'model',
        text: "👋 **Hello! I'm your Gemini-powered conversational AI assistant.**\n\nI run directly on Google Gemini (`gemini-2.5-flash`) with full multi-turn conversational memory. You can ask me general questions, test customer support scenarios, or switch to dedicated brand personas for **Glassleaf** and **PureSip** below!\n\nHow can I help you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage && messages.length > 0) {
      window.localStorage.setItem('cx_simple_chatbot_history', JSON.stringify(messages));
    }
  }, [messages]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState<PersonaMode>('general');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [temperature, setTemperature] = useState<number>(0.2);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  // Send message to Gemini API via server proxy
  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend || input).trim();
      if (!query || isLoading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updatedHistory = [...messages, userMsg];
      setMessages(updatedHistory);
      setInput('');
      setIsLoading(true);

      const startTime = Date.now();

      // Format Gemini contents payload
      // Exclude welcome message if needed or format cleanly
      const contents = updatedHistory
        .filter((m) => !m.error)
        .map((m) => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.text }]
        }));

      // Add system prompt as context
      const systemPrompt = PERSONA_CONFIGS[persona].systemPrompt;

      try {
        const isBrowser = typeof window !== 'undefined';
        const cleanModel = selectedModel.replace(/^models\//, '') || 'gemini-2.5-flash';

        const url = isBrowser
          ? `/api/gemini/models/${cleanModel}:generateContent`
          : `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: contents,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              temperature: temperature,
              maxOutputTokens: 1024
            }
          })
        });

        const data = await res.json();
        const latencyMs = Date.now() - startTime;

        if (!res.ok) {
          throw new Error(data?.error?.message || `HTTP ${res.status} from Gemini API`);
        }

        const replyText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
          'No response generated by model.';

        const promptTokens = data?.usageMetadata?.promptTokenCount;
        const completionTokens = data?.usageMetadata?.candidatesTokenCount;

        setMessages((prev) => [
          ...prev,
          {
            id: `model-${Date.now()}`,
            role: 'model',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            latencyMs,
            tokens: {
              prompt: promptTokens,
              completion: completionTokens
            },
            modelName: cleanModel
          }
        ]);
      } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'model',
            text: `⚠️ **Gemini Generation Error:** ${err?.message || 'Failed to reach API'}\n\nPlease verify that your Gemini API key is configured and that the server proxy is active.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            latencyMs,
            error: true
          }
        ]);
      } finally {
        setIsLoading(false);
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    },
    [input, isLoading, messages, persona, selectedModel, temperature]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeakingId === id) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown before speaking
    const cleanText = text.replace(/[*_#`[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);
    setIsSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleClearChat = () => {
    window.speechSynthesis?.cancel();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('cx_simple_chatbot_history');
    }
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: `Conversation cleared. Active persona: **${PERSONA_CONFIGS[persona].name}**. How can I help you?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleExportChat = () => {
    const formatted = messages
      .map(
        (m) =>
          `[${m.timestamp}] ${m.role === 'user' ? 'USER' : 'GEMINI'}:\n${m.text}\n`
      )
      .join('\n---\n\n');

    const blob = new Blob([formatted], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cx-gemini-chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper for rendering simple markdown
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Code blocks or headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 text-sm mt-3 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="font-bold text-slate-900 text-base mt-3 mb-1">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const itemText = line.slice(2);
        return (
          <li key={idx} className="ml-4 list-disc text-slate-800 my-0.5">
            {parseInline(itemText)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        const itemText = line.replace(/^\d+\.\s/, '');
        return (
          <li key={idx} className="ml-4 list-decimal text-slate-800 my-0.5">
            {parseInline(itemText)}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="my-1 text-slate-800 leading-relaxed">
          {parseInline(line)}
        </p>
      );
    });
  };

  const parseInline = (str: string) => {
    // Basic regex parser for bold, italic, code
    const parts: React.ReactNode[] = [];
    let remaining = str;
    let key = 0;

    while (remaining.length > 0) {
      // Check for code `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-blue-800 border border-slate-200"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Check for bold **text**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={key++} className="font-semibold text-slate-900">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Check for italic *text*
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        parts.push(
          <em key={key++} className="italic text-slate-800">
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Next plain segment
      const nextSpecial = remaining.search(/[`*]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return parts;
  };

  return (
    <div className="flex-1 flex flex-col h-full max-w-5xl w-full mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Banner / Persona Switcher Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 bg-linear-to-r from-slate-50 via-white to-slate-50 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Simple Gemini Chatbot
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Gemini 3.5 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Multi-turn conversational LLM powered by Google Gemini with brand awareness and persona modes
            </p>
          </div>
        </div>

        {/* Persona Selector & Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Persona Picker */}
          <div className="relative">
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value as PersonaMode)}
              className="text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer transition-colors"
            >
              <option value="general">🌟 Universal LLM Chat</option>
              <option value="glassleaf">🛍️ Glassleaf Customer Care</option>
              <option value="puresip">☕ PureSip Customer Care</option>
              <option value="architect">🛠️ CX Architecture Expert</option>
            </select>
          </div>

          {/* Model Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showSettings
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Configure LLM Model & Temperature"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Clear Chat */}
          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Clear Chat History"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Export Chat */}
          <button
            onClick={handleExportChat}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Export Conversation to Markdown"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Model Configuration Drawer */}
      {showSettings && (
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80 text-xs flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 font-mono text-[11px]"
              >
                <option value="gemini-3.5-flash">gemini-3.5-flash (Fast &amp; High Quality • Recommended)</option>
                <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra Low Latency)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Temperature:</span>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-20 cursor-pointer accent-blue-600"
              />
              <span className="font-mono text-[11px] text-slate-600">{temperature}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Key configured server-side. Zero credential exposure.</span>
          </div>
        </div>
      )}

      {/* Active Persona Banner Notice */}
      <div className="px-5 py-2 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PERSONA_CONFIGS[persona].badgeColor}`}>
            {PERSONA_CONFIGS[persona].tag}
          </span>
          <span className="text-[11px] text-slate-600 truncate max-w-xl">
            {PERSONA_CONFIGS[persona].description}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
          {messages.length} messages
        </span>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0 bg-slate-50/20">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs shadow-2xs ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-xs'
                  : msg.error
                  ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-xs'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
              }`}
            >
              {/* Message Content */}
              <div className="leading-relaxed">
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  renderMarkdown(msg.text)
                )}
              </div>

              {/* Footer Meta / Actions */}
              <div
                className={`flex items-center justify-between gap-3 mt-2.5 pt-2 border-t text-[10px] font-mono ${
                  msg.role === 'user'
                    ? 'border-blue-500/40 text-blue-100'
                    : 'border-slate-100 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{msg.timestamp}</span>
                  {msg.latencyMs && (
                    <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px]">
                      <Zap className="w-2.5 h-2.5 text-amber-500" />
                      {msg.latencyMs}ms
                    </span>
                  )}
                  {msg.tokens?.completion && (
                    <span className="text-[9px] text-slate-500">
                      {msg.tokens.completion} tokens
                    </span>
                  )}
                </div>

                {msg.role === 'model' && !msg.error && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleSpeak(msg.id, msg.text)}
                      className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                        isSpeakingId === msg.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title={isSpeakingId === msg.id ? 'Stop audio' : 'Listen with Speech'}
                    >
                      {isSpeakingId === msg.id ? (
                        <VolumeX className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-500 font-medium ml-1">
                Gemini is thinking...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts Carousel / Pills */}
      {messages.length <= 2 && (
        <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Try a Quick Prompt (1-Click Test):
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((sp, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPersona(sp.persona);
                  handleSendMessage(sp.prompt);
                }}
                className="text-[11px] font-medium bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 px-3 py-1.5 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer text-left"
              >
                <span>{sp.title}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input Floating Box */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-end gap-2 bg-slate-50 border border-slate-300 rounded-xl p-2 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 focus-within:bg-white transition-all shadow-2xs"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message Gemini as ${PERSONA_CONFIGS[persona].name}... (Enter to send, Shift+Enter for new line)`}
            rows={1}
            className="flex-1 bg-transparent resize-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none p-1.5 max-h-40 min-h-[36px]"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-lg font-semibold text-xs flex items-center justify-center transition-all ${
              input.trim() && !isLoading
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
          <span>Active Model: <strong>{selectedModel}</strong></span>
          <span>Powered by Google Gemini Live API</span>
        </div>
      </div>
    </div>
  );
};
