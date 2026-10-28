import React, { useState, useEffect } from 'react';
import { GenerateReplyOutput } from '../services/aiGenerator';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  Send,
  Edit3,
  CheckCircle2,
  RefreshCw,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  XCircle,
  Zap,
  RotateCcw,
  Package,
  Truck,
  ShieldAlert
} from 'lucide-react';

interface AIReplyPanelProps {
  currentDraft: GenerateReplyOutput | null;
  conversationVersion: number;
  draftConversationVersion: number;
  onApproveAndSend: (approvedText: string, clientRequestId: string) => Promise<void>;
  onRegenerate: () => Promise<void>;
  onClearDraft: () => void;
  isGenerating: boolean;
}

export const AIReplyPanel: React.FC<AIReplyPanelProps> = ({
  currentDraft,
  conversationVersion,
  draftConversationVersion,
  onApproveAndSend,
  onRegenerate,
  onClearDraft,
  isGenerating
}) => {
  const [editedText, setEditedText] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [expandedSources, setExpandedSources] = useState(true);

  // Sync draft text when a new generation arrives
  useEffect(() => {
    if (currentDraft) {
      setEditedText(currentDraft.draft);
      setIsApproved(false);
    }
  }, [currentDraft]);

  if (!currentDraft) {
    return (
      <div className="ds-card p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-700 shadow-xs">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <span className="ds-eyebrow">AI CO-PILOT ASSISTANT</span>
          <h4 className="text-sm font-bold text-slate-800 mt-1">AI Assistant Ready</h4>
        </div>
        <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
          Click <span className="text-blue-700 font-bold">"Generate AI Suggestion"</span> in the timeline to retrieve brand policies, evaluate rules, and prepare an audit-grounded response.
        </p>
      </div>
    );
  }

  // Check Staleness Guard
  const isStale = conversationVersion > draftConversationVersion;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedText(e.target.value);
    // Editing invalidates prior approval per system specification FR-09
    if (isApproved) {
      setIsApproved(false);
    }
  };

  const handleApprove = () => {
    if (!editedText.trim() || isStale) return;
    setIsApproved(true);
  };

  const handleSend = async () => {
    if (!isApproved || !editedText.trim() || isStale || isSending) return;

    try {
      setIsSending(true);
      const clientRequestId = `send-rev-${Date.now()}`;
      await onApproveAndSend(editedText.trim(), clientRequestId);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = () => {
    switch (currentDraft.status) {
      case 'grounded':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Policy Grounded
          </span>
        );
      case 'needs_information':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Needs Info
          </span>
        );
      case 'no_relevant_knowledge':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <FileQuestion className="w-3.5 h-3.5 text-rose-600" /> No Knowledge
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <AlertTriangle className="w-3.5 h-3.5 text-purple-600" /> Conflict
          </span>
        );
    }
  };

  const getCategoryIcon = (contentSnapshot: string) => {
    const lower = contentSnapshot.toLowerCase();
    if (lower.includes('[returns]') || lower.includes('[refunds]')) {
      return <RotateCcw className="w-3.5 h-3.5 text-blue-600" />;
    }
    if (lower.includes('[damage]')) {
      return <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />;
    }
    if (lower.includes('[shipping]')) {
      return <Truck className="w-3.5 h-3.5 text-emerald-600" />;
    }
    return <Package className="w-3.5 h-3.5 text-slate-600" />;
  };

  const getPolicyTitle = (contentSnapshot: string, idx: number) => {
    const match = contentSnapshot.match(/^\[(.*?)\]\s*(.*?):/);
    if (match && match[2]) {
      return match[2].trim();
    }
    return `Policy Evidence #${idx + 1}`;
  };

  return (
    <div className="ds-card p-4 space-y-3.5">
      {/* Draft Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="ds-eyebrow">AI CO-PILOT ASSISTANT</span>
          <h3 className="text-xs font-bold text-slate-900 mt-0.5">Grounding & Proposed Reply</h3>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <button
            onClick={onClearDraft}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            title="Dismiss Draft"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Model & Latency Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-blue-700" />
          <span className="text-slate-600">Model:</span>
          <span className={currentDraft.isMockMode ? 'text-amber-800 font-bold' : 'text-slate-900 font-bold'}>
            {currentDraft.model}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-slate-500">
          <span>{currentDraft.usage.latency_ms}ms</span>
          {currentDraft.usage.total_tokens !== undefined && currentDraft.usage.total_tokens > 0 && (
            <span>{currentDraft.usage.total_tokens} tokens</span>
          )}
        </div>
      </div>

      {/* AI Service Error Banner */}
      {currentDraft.error && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 flex items-start gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">AI Service Error</p>
            <p className="text-[11px] text-rose-800 leading-snug">{currentDraft.error}</p>
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="mt-1 flex items-center gap-1.5 px-2.5 py-1 bg-rose-200/80 hover:bg-rose-300 text-rose-900 rounded text-xs font-semibold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
              Retry Generation
            </button>
          </div>
        </div>
      )}

      {/* Staleness Guard Banner */}
      {isStale && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 flex items-start gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Draft Stale: Conversation Was Updated</p>
            <p className="text-[11px] text-amber-800 leading-snug">
              A newer message was received (thread v{conversationVersion} vs draft v{draftConversationVersion}). Sending is blocked per safety protocol.
            </p>
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="mt-1 flex items-center gap-1.5 px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-900 rounded text-xs font-semibold transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate Draft
            </button>
          </div>
        </div>
      )}

      {/* Actionable Warnings */}
      {currentDraft.warnings.length > 0 && (
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Agent Policy Warnings</span>
          </div>
          <ul className="text-[11px] text-amber-900 space-y-0.5 list-disc list-inside">
            {currentDraft.warnings.map((w, idx) => (
              <li key={idx} className="leading-relaxed">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Information Requirements */}
      {currentDraft.missingInformation.length > 0 && (
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
            <HelpCircle className="w-3.5 h-3.5 text-blue-700" />
            <span>Missing Information Required</span>
          </div>
          <ul className="text-[11px] text-blue-900 space-y-0.5 list-disc list-inside">
            {currentDraft.missingInformation.map((m, idx) => (
              <li key={idx} className="leading-relaxed">
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Editable Draft Area */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1 font-semibold text-slate-800">
            <Edit3 className="w-3.5 h-3.5 text-blue-700" />
            Agent Editable Draft:
          </span>
          <button
            type="button"
            onClick={() => {
              setEditedText(currentDraft.draft);
              setIsApproved(false);
            }}
            className="text-[10px] text-blue-700 hover:text-blue-900 font-semibold transition-colors"
          >
            Reset
          </button>
        </div>

        <textarea
          rows={5}
          value={editedText}
          onChange={handleTextChange}
          disabled={isStale}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{editedText.length} characters</span>
          {isApproved ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Approved for Dispatch
            </span>
          ) : (
            <span className="text-slate-500 font-medium">Pending Human Approval</span>
          )}
        </div>
      </div>

      {/* Retrieved Grounding Policy Cards (Datastraw Service Card Style) */}
      {currentDraft.sources.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setExpandedSources(!expandedSources)}
            className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-700" />
              Retrieved Policy Evidence ({currentDraft.sources.length})
            </span>
            {expandedSources ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSources && (
            <div className="p-2.5 space-y-2 border-t border-slate-200 bg-slate-50/30">
              {currentDraft.sources.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1.5 border-l-4 border-l-blue-600"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      {getCategoryIcon(s.contentSnapshot)}
                      <span className="truncate max-w-[180px]">{getPolicyTitle(s.contentSnapshot, idx)}</span>
                    </div>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                      v{s.policyVersion}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans line-clamp-4">
                    {s.contentSnapshot}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Hierarchy Controls */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isGenerating}
          className="ds-btn-secondary text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          Regenerate
        </button>

        <div className="flex items-center gap-2">
          {!isApproved ? (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isStale || !editedText.trim()}
              className="ds-btn-primary flex items-center gap-1.5 text-xs disabled:opacity-40"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Approve Draft
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={isStale || !editedText.trim() || isSending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              {isSending ? 'Sending...' : 'Send Approved Reply'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
