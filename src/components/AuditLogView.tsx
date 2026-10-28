import React from 'react';
import { AIGeneration, GenerationSource, ReplyReview } from '../types/database';
import {
  History,
  ShieldCheck,
  Zap,
  Clock,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AuditItem extends AIGeneration {
  sources: GenerationSource[];
  review: ReplyReview | null;
}

interface AuditLogViewProps {
  auditLogs: AuditItem[];
  brandName: string;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLogs, brandName }) => {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="ds-eyebrow">AUDIT & COMPLIANCE</span>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-xl font-bold text-slate-900">{brandName} AI Audit & Compliance Logs</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              Immutable Records
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Every AI generation, retrieved policy snapshot, human review, and dispatched message is persistently tracked with timestamps and model metadata.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-700 bg-white px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-xs self-start sm:self-auto">
          <History className="w-4 h-4 text-blue-700" />
          <span className="font-semibold">Records: {auditLogs.length}</span>
        </div>
      </div>

      {auditLogs.length === 0 ? (
        <div className="ds-card p-12 text-center space-y-2">
          <History className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No AI Generations Logged Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Generate an AI suggestion in the workspace to see its complete grounding audit trail, retrieved sources, and review lifecycle recorded here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="ds-card p-5 space-y-4 border-l-4 border-l-blue-600"
            >
              {/* Record Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800">{log.id}</span>
                  <span className="text-slate-300">•</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      log.status === 'grounded'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : log.status === 'needs_information'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Zap className="w-3 h-3 text-blue-600" /> {log.model}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Two Column Output & Review */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Raw AI Draft */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span className="flex items-center gap-1 text-blue-700">
                      <FileText className="w-3 h-3" /> Original AI Draft
                    </span>
                    <span className="font-mono text-slate-400">v{log.prompt_version}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                    {log.original_response}
                  </p>
                </div>

                {/* Human Approved Final Message */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Human Agent Review & Dispatch
                    </span>
                    {log.review?.approved_at && (
                      <span className="font-mono text-slate-400">
                        {new Date(log.review.approved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {log.review ? (
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap font-medium">
                        {log.review.edited_response}
                      </p>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] font-mono text-slate-500">
                        <span>Agent ID: {log.review.agent_id.substring(0, 8)}...</span>
                        {log.review.final_message_id && (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Dispatched
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                      Pending Human Agent Review
                    </div>
                  )}
                </div>
              </div>

              {/* Retrieved Sources Snapshots */}
              {log.sources.length > 0 && (
                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono">
                    <BookOpen className="w-3 h-3 text-blue-600" />
                    Audited Knowledge Sources ({log.sources.length} Snapshots Preserved)
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {log.sources.map((s) => (
                      <div key={s.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 font-semibold">
                          <span>Policy ID: {s.policy_id || 'unlinked'}</span>
                          <span>v{s.policy_version}</span>
                        </div>
                        <p className="text-slate-700 font-sans leading-snug line-clamp-2">
                          {s.content_snapshot}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
