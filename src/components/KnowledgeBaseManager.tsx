import React, { useState } from 'react';
import { KBEntry, KBCategory, PolicyRules } from '../types/database';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  ShieldAlert,
  Save,
  X,
  Search,
  AlertTriangle,
  RotateCcw,
  Package,
  Truck
} from 'lucide-react';

interface KnowledgeBaseManagerProps {
  policies: KBEntry[];
  brandName: string;
  brandId: string;
  isAdmin: boolean;
  onCreatePolicy: (data: {
    title: string;
    category: KBCategory;
    content: string;
    rules_json?: PolicyRules;
  }) => void;
  onUpdatePolicy: (
    policyId: string,
    updates: {
      title?: string;
      category?: KBCategory;
      content?: string;
      rules_json?: PolicyRules;
      active?: boolean;
    }
  ) => void;
  onDeletePolicy: (policyId: string) => void;
}

export const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({
  policies,
  brandName,
  brandId: _brandId,
  isAdmin,
  onCreatePolicy,
  onUpdatePolicy,
  onDeletePolicy
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingPolicy, setEditingPolicy] = useState<KBEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<KBEntry | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<KBCategory>('returns');
  const [content, setContent] = useState('');
  const [windowDays, setWindowDays] = useState<string>('7');
  const [reportHours, setReportHours] = useState<string>('48');
  const [requiresPhotos, setRequiresPhotos] = useState<boolean>(true);

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Categories' },
    { id: 'returns', label: 'Returns' },
    { id: 'refunds', label: 'Refunds' },
    { id: 'damage', label: 'Damage' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'cancellation', label: 'Cancellation' }
  ];

  const filtered = policies.filter((p) => {
    const matchesCategory = selectedCategory === 'all' ? true : p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  const openCreateModal = () => {
    setTitle('');
    setCategory('returns');
    setContent('');
    setWindowDays('7');
    setReportHours('48');
    setRequiresPhotos(true);
    setEditingPolicy(null);
    setIsCreating(true);
  };

  const openEditModal = (policy: KBEntry) => {
    setEditingPolicy(policy);
    setTitle(policy.title);
    setCategory(policy.category);
    setContent(policy.content);
    setWindowDays(policy.rules_json?.window_days !== undefined ? String(policy.rules_json.window_days) : '7');
    setReportHours(policy.rules_json?.report_hours !== undefined ? String(policy.rules_json.report_hours) : '48');
    setRequiresPhotos(policy.rules_json?.requires_photos ?? true);
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const rules: PolicyRules = {
      requires_photos: requiresPhotos
    };

    if (category === 'returns' || category === 'refunds') {
      rules.window_days = Number(windowDays) || 7;
    }
    if (category === 'damage') {
      rules.report_hours = Number(reportHours) || 48;
      rules.requires_photos = requiresPhotos;
      rules.requires_order_ref = true;
    }

    if (editingPolicy) {
      onUpdatePolicy(editingPolicy.id, {
        title: title.trim(),
        category,
        content: content.trim(),
        rules_json: rules
      });
    } else {
      onCreatePolicy({
        title: title.trim(),
        category,
        content: content.trim(),
        rules_json: rules
      });
    }

    setIsCreating(false);
    setEditingPolicy(null);
  };

  const handleConfirmDelete = () => {
    if (policyToDelete) {
      onDeletePolicy(policyToDelete.id);
      setPolicyToDelete(null);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'returns':
      case 'refunds':
        return <RotateCcw className="w-3.5 h-3.5 text-blue-600" />;
      case 'damage':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />;
      case 'shipping':
        return <Truck className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Package className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
      {/* KB Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="ds-eyebrow">KNOWLEDGE MANAGEMENT</span>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-xl font-bold text-slate-900">{brandName} Knowledge Base</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              Tenant Isolated
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Ground truth policies evaluated by deterministic rules and retrieved into AI reply prompts.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={openCreateModal}
            className="ds-btn-primary flex items-center gap-2 self-start sm:self-auto text-xs"
          >
            <Plus className="w-4 h-4" />
            Add Policy Entry
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Read-Only: Admin role required to create or edit policies.</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === c.id
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter policies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
      </div>

      {/* Policy Cards Grid (Datastraw Service Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((policy) => (
          <div
            key={policy.id}
            className={`p-5 ds-card border-l-4 border-l-blue-600 space-y-3 transition-all ${
              policy.active ? 'hover:border-slate-300' : 'opacity-60 bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    {getCategoryIcon(policy.category)}
                    {policy.category}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                    v{policy.version}
                  </span>
                  {!policy.active && (
                    <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                      Deactivated
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-2">{policy.title}</h3>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(policy)}
                    className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Edit Policy (Increments Version)"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPolicyToDelete(policy)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Delete Policy (Confirms Title & Brand)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">{policy.content}</p>

            {/* Structured Rules Summary */}
            {policy.rules_json && Object.keys(policy.rules_json).length > 0 && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 space-y-1">
                <span className="ds-eyebrow">VALIDATED RULES:</span>
                <div className="flex flex-wrap gap-2 text-slate-700 pt-0.5">
                  {policy.rules_json.window_days !== undefined && (
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                      window: {policy.rules_json.window_days} days
                    </span>
                  )}
                  {policy.rules_json.report_hours !== undefined && (
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                      report limit: {policy.rules_json.report_hours}h
                    </span>
                  )}
                  {policy.rules_json.requires_photos && (
                    <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-bold">
                      photos required
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create / Edit Policy Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-700" />
                {editingPolicy ? `Edit Policy (Increments to v${editingPolicy.version + 1})` : `New Policy for ${brandName}`}
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 7-Day Return Policy"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as KBCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:bg-white"
                >
                  <option value="returns">Returns</option>
                  <option value="refunds">Refunds</option>
                  <option value="damage">Damage</option>
                  <option value="shipping">Shipping</option>
                  <option value="cancellation">Cancellation</option>
                </select>
              </div>

              {/* Numeric Rules Inputs */}
              {(category === 'returns' || category === 'refunds') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Refund Window (Days from Delivery)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={windowDays}
                    onChange={(e) => setWindowDays(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:bg-white font-mono"
                  />
                </div>
              )}

              {category === 'damage' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Report Limit (Hours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="720"
                      value={reportHours}
                      onChange={(e) => setReportHours(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:bg-white font-mono"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={requiresPhotos}
                        onChange={(e) => setRequiresPhotos(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                      <span>Require Photo Evidence</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Content</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Full text of the brand policy..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:bg-white resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="ds-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ds-btn-primary flex items-center gap-1.5 text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  {editingPolicy ? 'Save Updates' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deletion Confirmation Dialog with Title & Brand */}
      {policyToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">Confirm Policy Deletion</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-slate-800">"{policyToDelete.title}"</span> for brand <span className="font-bold text-blue-700">{brandName}</span>?
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                This policy will be deactivated. Existing conversation audit snapshots referencing version v{policyToDelete.version} remain preserved for compliance.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPolicyToDelete(null)}
                className="ds-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
