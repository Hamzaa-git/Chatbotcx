import React, { useState, useEffect } from 'react';
import { Brand } from '../types/database';
import { dataStore } from '../services/store';
import {
  Sparkles,
  Building2,
  X,
  ArrowRight,
  ShoppingBag,
  Tag
} from 'lucide-react';
import { CURATED_TEST_CASES } from '../data/testScenarios';

interface NewInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorizedBrands: Brand[];
  onIngestQuery: (params: {
    brandId: string;
    query: string;
    customerName?: string;
    orderNumber?: string;
    autoGenerateAI: boolean;
  }) => Promise<void>;
}

export const NewInquiryModal: React.FC<NewInquiryModalProps> = ({
  isOpen,
  onClose,
  authorizedBrands,
  onIngestQuery
}) => {
  const [queryText, setQueryText] = useState('');
  const [customerName, setCustomerName] = useState('Sarah Jenkins');
  const [orderNumber, setOrderNumber] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualBrandOverride, setIsManualBrandOverride] = useState(false);

  // Run live company auto-detection as user types
  const detectionResult = React.useMemo(() => {
    return dataStore.detectBrandFromQuery(queryText);
  }, [queryText]);

  // Sync detected brand when query changes unless manually overridden
  useEffect(() => {
    if (!isManualBrandOverride && detectionResult.brand) {
      setSelectedBrandId(detectionResult.brand.id);
    } else if (!selectedBrandId && authorizedBrands.length > 0) {
      setSelectedBrandId(authorizedBrands[0].id);
    }
  }, [detectionResult, isManualBrandOverride, authorizedBrands, selectedBrandId]);

  // Auto-extract order number from query
  useEffect(() => {
    const match = queryText.match(/#(SD-\d+|WL-\d+|GL-\d+|PS-\d+)/i);
    if (match && !orderNumber) {
      setOrderNumber(match[1].toUpperCase());
    }
  }, [queryText, orderNumber]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim() || !selectedBrandId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onIngestQuery({
        brandId: selectedBrandId,
        query: queryText.trim(),
        customerName: customerName.trim(),
        orderNumber: orderNumber.trim() || undefined,
        autoGenerateAI: true
      });
      onClose();
      setQueryText('');
      setOrderNumber('');
      setIsManualBrandOverride(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBrand = authorizedBrands.find((b) => b.id === selectedBrandId) || detectionResult.brand;

  const loadPresetQuery = (preset: { query: string; name: string; order?: string }) => {
    setQueryText(preset.query);
    setCustomerName(preset.name);
    setOrderNumber(preset.order || '');
    setIsManualBrandOverride(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="ds-eyebrow">LIVE QUERY INGESTION</span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              Enter Customer Inquiry (Company Auto-Detection)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Test Inquiries */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              Pre-Configured Test Cases (Click to load):
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {CURATED_TEST_CASES.length} scenarios
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs max-h-32 overflow-y-auto pr-1">
            {CURATED_TEST_CASES.map((tc) => (
              <button
                key={tc.id}
                type="button"
                onClick={() =>
                  loadPresetQuery({
                    query: tc.query,
                    name: tc.customerName,
                    order: tc.orderNumber
                  })
                }
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors border text-left cursor-pointer ${
                  tc.brandName === 'Shein Designs'
                    ? 'bg-rose-50/70 hover:bg-rose-100/80 text-rose-800 border-rose-200'
                    : 'bg-amber-50/70 hover:bg-amber-100/80 text-amber-800 border-amber-200'
                }`}
                title={`[${tc.badge}] ${tc.description}`}
              >
                <span className="font-bold">{tc.orderNumber ? `#${tc.orderNumber}: ` : ''}</span>
                <span>{tc.title}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Query Text Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Message Query <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              autoFocus
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Paste or type customer query (e.g. 'The dress from Shein Designs is a different colour...', 'I want to return my Watford leather bag...')"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:bg-white resize-none leading-relaxed"
            />
          </div>

          {/* Automatic Company Detection Output Card */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="ds-eyebrow flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-700" />
                AUTOMATIC COMPANY DETECTION
              </span>
              {detectionResult.confidence > 0 && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    detectionResult.confidence >= 80
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {detectionResult.confidence}% Confidence
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-xs font-bold text-slate-900">
                  {selectedBrand ? selectedBrand.name : 'Analyzing query...'}
                </span>
                {isManualBrandOverride && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                    Manual Selection
                  </span>
                )}
              </div>

              {/* Company selector override dropdown */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-[11px]">Route to:</span>
                <select
                  value={selectedBrandId}
                  onChange={(e) => {
                    setSelectedBrandId(e.target.value);
                    setIsManualBrandOverride(true);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  {authorizedBrands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {detectionResult.reason && (
              <p className="text-[11px] text-slate-500 font-mono">
                {detectionResult.reason}
              </p>
            )}
          </div>

          {/* Customer Metadata (Name & Order) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                <span>Order Number (Optional)</span>
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. SD-1001 or WL-2001"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>Live AI generation enabled (Autonomous Policy Engine)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="ds-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!queryText.trim() || !selectedBrandId || isSubmitting}
                className="ds-btn-primary flex items-center gap-1.5 text-xs disabled:opacity-40"
              >
                {isSubmitting ? (
                  <span>Ingesting Ticket...</span>
                ) : (
                  <>
                    <span>Route & Generate AI Reply</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
