import React from 'react';
import { Order } from '../types/database';
import {
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface OrderContextCardProps {
  order: Order | null;
  brandSlug: string;
}

export const OrderContextCard: React.FC<OrderContextCardProps> = ({ order, brandSlug }) => {
  if (!order) {
    return (
      <div className="p-4 ds-card text-center">
        <Package className="w-6 h-6 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-600 font-semibold">No order linked to this conversation</p>
        <span className="text-[10px] text-slate-400">General pre-sale or customer inquiry</span>
      </div>
    );
  }

  // Calculate elapsed days from delivery date
  const refundWindowDays = brandSlug === 'shein-designs' || brandSlug === 'glassleaf' ? 7 : 30;
  let elapsedDays: number | null = null;
  let isWindowExceeded = false;

  if (order.delivered_at) {
    const deliveryMs = new Date(order.delivered_at).getTime();
    elapsedDays = Math.floor(Math.max(0, Date.now() - deliveryMs) / (1000 * 60 * 60 * 24));
    isWindowExceeded = elapsedDays > refundWindowDays;
  }

  return (
    <div className="ds-card p-3 space-y-2.5">
      {/* Order Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs">
            <Package className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="ds-eyebrow text-[9px]">ORDER REFERENCE</span>
            <h3 className="text-xs font-bold text-slate-900 font-mono">{order.order_number}</h3>
          </div>
        </div>

        <span
          className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
            order.status === 'delivered'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {order.status}
        </span>
      </div>

      {/* Order Delivery Facts & Policy Constraints */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-1.5 px-2 rounded-md border border-slate-100">
          <span className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="w-3 h-3 text-slate-400" />
            Delivery:
          </span>
          <span className="font-mono font-bold text-slate-800">
            {order.delivered_at
              ? `${new Date(order.delivered_at).toLocaleDateString()} (${elapsedDays}d ago)`
              : 'Pending Courier Dispatch'}
          </span>
        </div>

        {/* Policy Timeline Facts */}
        {order.delivered_at ? (
          <div
            className={`p-2 rounded-md border flex items-start gap-1.5 text-[11px] ${
              isWindowExceeded
                ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            {isWindowExceeded ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className="font-bold text-[11px]">
                {isWindowExceeded
                  ? `Return Window Exceeded (${elapsedDays}d > ${refundWindowDays}d)`
                  : `Within Return Window (${elapsedDays}d / ${refundWindowDays}d)`}
              </p>
              <p className="text-[10px] opacity-80 leading-snug">
                {isWindowExceeded
                  ? `Standard limit is ${refundWindowDays} days.`
                  : `General return limit: ${refundWindowDays} days.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2 rounded-md border border-amber-200 bg-amber-50/80 text-amber-900 flex items-start gap-1.5 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[11px]">Delivery Date Unconfirmed</p>
              <p className="text-[10px] opacity-85 mt-0.5 leading-snug">
                Delivery confirmation pending from courier. Verify status before assessing eligibility.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Order Items List */}
      <div className="space-y-1 pt-1.5 border-t border-slate-100">
        <span className="ds-eyebrow text-[9px]">ORDERED ITEMS</span>
        {order.items_json.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 px-2 rounded-md border border-slate-100">
            <div className="min-w-0 pr-2">
              <p className="font-semibold text-slate-800 truncate">{item.name}</p>
              <span className="text-[9px] font-mono text-slate-400">
                Qty: {item.quantity}
              </span>
            </div>
            <span className="font-mono text-slate-800 font-bold shrink-0">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}

        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 font-medium">
          <span>Total:</span>
          <span className="text-slate-900 font-mono font-bold text-xs">
            ${order.total_amount.toFixed(2)} {order.currency}
          </span>
        </div>
      </div>
    </div>
  );
};
