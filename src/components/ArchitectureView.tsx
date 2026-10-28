import React, { useState } from 'react';
import {
  Layers,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  ShieldCheck,
  Cpu,
  UserCheck,
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
const currentArchitectureImage = '/current-architecture.png';

export const ArchitectureView: React.FC = () => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              System Architecture
            </span>
            <span className="text-xs text-slate-400 font-mono">Current Implementation Diagram</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-white">
            Current System Architecture
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl">
            End-to-end operational blueprint showing customer inquiry ingestion, multi-tenant brand isolation, bounded rule evaluation, LLM drafting, and human-in-the-loop review.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="/Current_System_Architecture.pdf"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open PDF Report</span>
          </a>
          <a
            href="/current-architecture.png"
            download="current-system-architecture.png"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </a>
        </div>
      </div>

      {/* Main Diagram Showcase Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Diagram Action Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">Architecture Diagram</span>
            <span className="text-[10px] text-slate-400 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
              Draw.io Blueprint
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-600 px-2 py-1 bg-white border border-slate-200 rounded-lg">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
              title="View Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expand</span>
            </button>
          </div>
        </div>

        {/* Diagram Image Container */}
        <div className="p-6 bg-slate-50/80 flex flex-col items-center justify-start overflow-auto min-h-[580px] max-h-[820px]">
          <div
            className="transition-transform duration-200 ease-out flex justify-center w-full"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
          >
            <img
              src={currentArchitectureImage}
              alt="Current System Architecture Diagram"
              className="max-w-[460px] w-full h-auto rounded-xl shadow-lg border border-slate-200/90 bg-white my-2"
            />
          </div>
        </div>
      </div>

      {/* 4 Pipeline Stages (How the Current System Works) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stage 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-bold">Stage 1</span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">Ingestion & Routing</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Customer inquiries are ingested from Web Chat or simulation channels. Brand identity is resolved strictly from verified database records with idempotency deduplication.
          </p>
        </div>

        {/* Stage 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 font-bold">Stage 2</span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">Deterministic Rule Engine</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Evaluates return windows, delivery dates, and damage windows locally in TypeScript before calling the AI. Strict tenant filter guarantees zero cross-brand policy leakage.
          </p>
        </div>

        {/* Stage 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-purple-600 font-bold">Stage 3</span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">Guardrailed AI Drafting</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Gemini 3.5 Flash-Lite drafts policy-grounded replies enforcing JSON schemas. Customer text is quarantined as untrusted data to eliminate prompt injection risks.
          </p>
        </div>

        {/* Stage 4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 font-bold">Stage 4</span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">Human Approval & Audit</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Support agents review, edit, or approve the draft. Version-tracked dispatch prevents stale replies. Every prompt, token count, and policy source is immutably logged.
          </p>
        </div>
      </div>

      {/* Architecture Benefits & Operational Trade-offs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Why This Works */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Why the Current Architecture Works
            </h3>
          </div>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">✓</span>
              <span><strong>Zero Hallucinations:</strong> Numeric date arithmetic (e.g. 20-day vs 7-day window) executes in deterministic TypeScript, never by probabilistic LLM guess.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">✓</span>
              <span><strong>Sub-Second Latency:</strong> Lightweight model selection (Gemini 3.5 Flash-Lite) generates grounded suggestions in ~800–1,200ms.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">✓</span>
              <span><strong>Staleness Guard:</strong> Any new customer message increments conversation version, immediately invalidating old pending drafts.</span>
            </li>
          </ul>
        </div>

        {/* Operational Trade-offs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Operational Trade-offs & Limitations
            </h3>
          </div>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold mt-0.5">•</span>
              <span><strong>Keyword Categorization:</strong> Uses synonym-based category matching rather than semantic embeddings; unusual phrases require synonym map entries.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold mt-0.5">•</span>
              <span><strong>Synchronous Ingestion:</strong> Ingestion and AI generation run inline on HTTP requests; high burst traffic relies on upstream provider quotas.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold mt-0.5">•</span>
              <span><strong>Single Gateway Relay:</strong> Dispatch directly sends message without an asynchronous message broker queue.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Fullscreen Modal View */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex flex-col p-4 sm:p-6 animate-fadeIn">
          <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-t-xl border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold">Current System Architecture — Fullscreen View</span>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold cursor-pointer text-slate-200 transition-colors"
            >
              Close (ESC)
            </button>
          </div>
          <div className="flex-1 bg-slate-900/95 rounded-b-xl overflow-y-auto p-6 flex flex-col items-center justify-start">
            <img
              src={currentArchitectureImage}
              alt="Current System Architecture Fullscreen"
              className="max-w-[540px] w-full h-auto object-contain rounded-lg shadow-2xl bg-white border border-slate-700 my-4"
            />
          </div>
        </div>
      )}
    </div>
  );
};
