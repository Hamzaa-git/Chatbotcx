import React from 'react';
import { User, Bot, Headphones, ArrowRight } from 'lucide-react';

interface FlowBannerProps {
  currentStage?: 'customer' | 'ai' | 'agent';
}

export const FlowBanner: React.FC<FlowBannerProps> = ({ currentStage: _currentStage = 'ai' }) => {
  return (
    <div className="w-full space-y-4 mb-4">
      {/* Top Feature Pill Badges */}
      <div className="flex items-center justify-center gap-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Agentic AI</span>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Pro CX Teams</span>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span>Live Support</span>
        </div>
      </div>

      {/* Visual Workflow Flow Diagram Card */}
      <div className="cx-card p-6 relative overflow-hidden bg-white/95">
        {/* Subtle dot pattern inside card */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }}
        />

        <div className="relative z-10 flex items-center justify-around max-w-2xl mx-auto">
          {/* Node 1: Customer */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-center text-slate-600 shadow-sm transition-transform hover:scale-105">
              <User className="w-7 h-7 text-slate-700" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 font-mono">
              CUSTOMER
            </span>
          </div>

          {/* Dotted Arrow 1 */}
          <div className="flex items-center gap-1 text-blue-500 font-mono font-bold select-none">
            <span className="tracking-tighter text-blue-400">------</span>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </div>

          {/* Node 2: AI Triage / Copilot */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-blue-600 shadow-md shadow-blue-500/10 transition-transform hover:scale-105 ring-4 ring-blue-100/50">
              <Bot className="w-7 h-7 text-blue-600" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
              AI TRIAGE
            </span>
          </div>

          {/* Dotted Arrow 2 */}
          <div className="flex items-center gap-1 text-blue-500 font-mono font-bold select-none">
            <span className="tracking-tighter text-blue-400">------</span>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </div>

          {/* Node 3: Human Agent */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 border-2 border-purple-200 flex items-center justify-center text-purple-600 shadow-sm transition-transform hover:scale-105">
              <Headphones className="w-7 h-7 text-purple-600" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 font-mono">
              AGENT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
