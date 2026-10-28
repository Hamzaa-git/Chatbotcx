import React, { useState } from 'react';
import {
  Layers,
  ShieldAlert,
  Repeat,
  Clock,
  HelpCircle,
  TrendingUp,
  DollarSign,
  Send,
  ExternalLink,
  Download,
  CheckCircle2,
  Server
} from 'lucide-react';

interface CalloutItem {
  id: number;
  title: string;
  question: string;
  icon: React.ReactNode;
  summary: string;
  details: string[];
  codeSnippet?: string;
  tag: string;
}

export const ArchitectureView: React.FC = () => {
  const [selectedCallout, setSelectedCallout] = useState<number>(1);

  const callouts: CalloutItem[] = [
    {
      id: 1,
      title: 'Tenant Isolation',
      question: 'How Brand A’s conversations & policies remain inaccessible to Brand B',
      icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
      tag: 'Security & RLS',
      summary: 'Multi-layer defense: Database engine RLS, composite foreign keys, and vector DB payload isolation.',
      details: [
        'PostgreSQL Row-Level Security (RLS) restricts queries to WHERE brand_id = current_setting("app.current_brand_id").',
        'Composite foreign keys FOREIGN KEY (order_id, brand_id) prevent conversations from referencing cross-brand orders.',
        'Qdrant Vector DB enforces hard payload filtering on brand_id before similarity scoring.',
        'Brand Context Resolver resolves tenant identity strictly from trusted database records, never from client input.'
      ],
      codeSnippet: `CREATE POLICY brand_isolation_policy ON conversations\nFOR ALL TO authenticated\nUSING (brand_id = NULLIF(current_setting('app.current_brand_id', true), '')::uuid);`
    },
    {
      id: 2,
      title: 'Webhook Deduplication',
      question: 'What happens when a webhook arrives twice (e.g. WhatsApp/Shopify retry)',
      icon: <Repeat className="w-5 h-5 text-amber-500" />,
      tag: 'Idempotency',
      summary: 'Edge Redis SET-NX fast path + PostgreSQL database unique constraint durable path.',
      details: [
        'Edge API Gateway extracts natural event ID and computes sha256(provider + channel + event_id).',
        'Atomic Redis command SET webhook:{key} "1" EX 86400 NX acknowledges duplicates with HTTP 200 within 50ms.',
        'Postgres messages table enforces UNIQUE(conversation_id, client_request_id) with ON CONFLICT DO NOTHING.'
      ],
      codeSnippet: `-- Durable Database Ingestion Guard\nCONSTRAINT uq_messages_conversation_req \nUNIQUE (conversation_id, client_request_id);`
    },
    {
      id: 3,
      title: 'LLM & API Timeouts',
      question: 'What happens when an external API or LLM times out',
      icon: <Clock className="w-5 h-5 text-blue-500" />,
      tag: 'Circuit Breaker',
      summary: 'Tiered 8-second timeout, circuit breaker tripping after 5 failures, and multi-model fallback cascade.',
      details: [
        'Primary live gateway targets Google Gemini 1.5 Flash with sub-second inference.',
        'If Gemini fails or times out (>8s), the orchestrator falls back to OpenRouter (Meta Llama-3.3-70B).',
        'If third-party networks fail completely, the offline deterministic rule engine provides grounded draft suggestions.',
        'Agent UI clearly badges fallback status while preserving full ability to edit or write manual responses.'
      ]
    },
    {
      id: 4,
      title: 'Missing Evidence',
      question: 'How the system handles missing policy evidence or unreliable AI output',
      icon: <HelpCircle className="w-5 h-5 text-purple-500" />,
      tag: 'Groundedness',
      summary: 'Citation verification strips hallucinated policy IDs; missing info triggers needs_information status.',
      details: [
        'Safety & Citation Validator inspects generated draft: any policy ID not in the retrieved set is stripped.',
        'If return requires proof (e.g., photo of damaged goods) or order reference is missing, status becomes needs_information.',
        'Circular Loop Killer detects repeated customer disputes (>2 turns) and respectfully concludes the conversation.'
      ]
    },
    {
      id: 5,
      title: 'Scaling from 20 to 500 Brands',
      question: 'What is likely to break first when scaling to 500 brands and 5,000 agents',
      icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
      tag: 'Connection Management',
      summary: 'PostgreSQL connection exhaustion is the first bottleneck, resolved via Supavisor / PgBouncer.',
      details: [
        '5,000 concurrent agents opening WebSockets/REST will crash PostgreSQL max_connections (typically 200–500).',
        'Supavisor / PgBouncer in transaction pooling mode multiplexes 5,000 agent sessions over ~100 direct DB connections.',
        'Noisy-neighbor queue starvation mitigated by partitioning Kafka/SQS by brand_id using DWRR scheduling.'
      ]
    },
    {
      id: 6,
      title: 'Controlling AI Costs',
      question: 'How AI costs are controlled without sacrificing response quality (5x Spend Surge)',
      icon: <DollarSign className="w-5 h-5 text-yellow-500" />,
      tag: 'Cost Optimization',
      summary: 'Bounded context window (~600 tokens) and deterministic rule pre-execution reduce token burn by 75–85%.',
      details: [
        'Diagnosed 5x cost spike: uncompressed multi-turn history causes quadratic O(N²) prompt token explosion.',
        'Engine bounds conversational history strictly to the last 3 customer turns (~250 tokens).',
        'Deterministic date rules (e.g. 20-day delivery > 7-day window) run locally in TypeScript before calling the LLM.',
        'JSON output contract forbids verbose chain-of-thought tokens, slashing output costs.'
      ]
    },
    {
      id: 7,
      title: 'Delivery Recovery',
      question: 'How a processed message is recovered if sending the final response fails',
      icon: <Send className="w-5 h-5 text-indigo-500" />,
      tag: 'Transactional Outbox',
      summary: 'Atomic commit of agent message and outbox event with exponential backoff relay workers.',
      details: [
        'Agent approval executes an atomic transaction: inserts message, updates ticket, and inserts outbox_events row.',
        'Asynchronous relay workers poll outbox_events using SELECT ... FOR UPDATE SKIP LOCKED.',
        'Dispatches to WhatsApp API with exponential backoff and full jitter (1s, 2s, 4s, 8s, 16s).',
        'Dead-Letter Queue (DLQ) alerts agents upon 5 failed attempts; zero customer messages are silently lost.'
      ]
    }
  ];

  const currentCallout = callouts.find((c) => c.id === selectedCallout) || callouts[0];

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Part 2 Architecture
            </span>
            <span className="text-xs text-slate-400 font-mono">Datastraw Tech Lead Assessment</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-white">
            Production-Scale Architecture (500 Brands • 5,000 Agents)
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Multi-channel ingestion (WhatsApp / Web / Email), Qdrant vector retrieval, PostgreSQL Row-Level Security, Supavisor connection pooling, and Transactional Outbox delivery.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="/system-architecture/index.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Interactive Viewer</span>
          </a>
          <a
            href="/system-architecture/cx-reply-assistant-production-architecture.drawio"
            download="cx-reply-assistant-production-architecture.drawio"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .drawio</span>
          </a>
        </div>
      </div>

      {/* Target Scale Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant Scale</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">500 Brands</div>
          <div className="text-xs text-slate-500 mt-0.5">Isolated via Postgres RLS & Qdrant</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agent Concurrency</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">5,000 Agents</div>
          <div className="text-xs text-slate-500 mt-0.5">Multiplexed via Supavisor pooler</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost Optimization</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">-75% to -85%</div>
          <div className="text-xs text-slate-500 mt-0.5">Bounded context (~600 tokens max)</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Human-In-The-Loop</div>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">100% Approval</div>
          <div className="text-xs text-slate-500 mt-0.5">Zero unvetted replies sent</div>
        </div>
      </div>

      {/* 7 Required Design Decisions (Interactive Callout Inspector) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Required Design Decisions (Callouts [1] to [7])
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any callout below to review the technical decision, trade-offs, and architecture implementation.
            </p>
          </div>
        </div>

        {/* Callout Selection Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {callouts.map((c) => {
            const isSelected = c.id === selectedCallout;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCallout(c.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="mb-1">{c.icon}</div>
                <div className="text-[11px] font-bold">[{c.id}] {c.title}</div>
                <div className="text-[9px] text-slate-500 truncate w-full">{c.tag}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Callout Detail Drawer */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-blue-600 text-white px-2 py-0.5 rounded">
                  Callout [{currentCallout.id}]
                </span>
                <span className="text-sm font-bold text-slate-900">{currentCallout.title}</span>
                <span className="text-xs text-slate-500 font-medium">({currentCallout.tag})</span>
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-1 italic">
                "{currentCallout.question}"
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-800 font-medium bg-white p-3 rounded border border-slate-200">
            {currentCallout.summary}
          </p>

          <ul className="space-y-1.5">
            {currentCallout.details.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          {currentCallout.codeSnippet && (
            <div className="mt-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Implementation Blueprint
              </div>
              <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono overflow-x-auto">
                {currentCallout.codeSnippet}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* 6 Layers Architecture Summary Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-600" />
          The 6 Architectural Layers: Prototype vs. Scaled Production
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                <th className="py-2.5 px-3">Layer</th>
                <th className="py-2.5 px-3">Component Focus</th>
                <th className="py-2.5 px-3">Implemented Prototype</th>
                <th className="py-2.5 px-3">Proposed Production Scale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900">1. Experience & Channel</td>
                <td className="py-2.5 px-3">Customer & Agent Entry</td>
                <td className="py-2.5 px-3 text-blue-700 font-mono">React 19 / CustomerPortal / AgentPortal</td>
                <td className="py-2.5 px-3 font-mono text-slate-800">Meta WhatsApp Cloud API + Shopify Webhooks</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900">2. API & Application</td>
                <td className="py-2.5 px-3">Gateway, Auth, Orchestrator</td>
                <td className="py-2.5 px-3 text-blue-700 font-mono">Vercel API / Node Proxy (server.cjs)</td>
                <td className="py-2.5 px-3 font-mono text-slate-800">Kong Gateway + Supabase Edge Functions</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900">3. Background Processing</td>
                <td className="py-2.5 px-3">Async Queues & Deduplication</td>
                <td className="py-2.5 px-3 text-slate-400 italic">Synchronous client pings</td>
                <td className="py-2.5 px-3 font-mono text-slate-800">Redis SET-NX + Kafka (Brand Partitioned) + DLQ</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900">4. Knowledge & AI</td>
                <td className="py-2.5 px-3">Retrieval, Prompt, LLM Gateway</td>
                <td className="py-2.5 px-3 text-blue-700 font-mono">Deterministic SQL/Synonyms + Gemini 1.5</td>
                <td className="py-2.5 px-3 font-mono text-slate-800">Qdrant Vector DB + Gemini 1.5 + OpenRouter</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900">5. Data Layer</td>
                <td className="py-2.5 px-3">PostgreSQL RLS & Pooling</td>
                <td className="py-2.5 px-3 text-blue-700 font-mono">Postgres (10 tables, 001_initial_schema.sql)</td>
                <td className="py-2.5 px-3 font-mono text-slate-800">Postgres Primary + Supavisor Pooler + Read Replicas</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900">6. Security & Observability</td>
                <td className="py-2.5 px-3">Tenant Isolation & Cost Telemetry</td>
                <td className="py-2.5 px-3 text-blue-700 font-mono">Postgres RLS + Token usage logging</td>
                <td className="py-2.5 px-3 font-mono text-slate-800">OpenTelemetry Tracing + Datadog / Grafana Spikes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
