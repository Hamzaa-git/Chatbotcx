import React from 'react';
import { MessageSquare, Phone, Mail } from 'lucide-react';

export const ChannelSidebar: React.FC = () => {
  return (
    <div className="w-16 flex flex-col items-center py-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4 shrink-0">
      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 font-mono">
        CHANNELS
      </span>

      <div className="flex flex-col gap-3">
        {/* WhatsApp Channel */}
        <button
          type="button"
          className="w-11 h-11 rounded-2xl bg-emerald-50 border-1.5 border-emerald-200 text-emerald-600 flex items-center justify-center shadow-sm hover:scale-105 transition-all"
          title="WhatsApp Channel (Connected)"
        >
          {/* Custom WhatsApp Icon SVG */}
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.599 2.679-.702c.974.553 1.758.82 2.78.821 3.18 0 5.767-2.587 5.768-5.766.001-3.182-2.585-5.768-5.767-5.765zm0 10.362c-.895 0-1.611-.235-2.348-.672l-.168-.1-1.745.458.466-1.701-.11-.176c-.482-.767-.738-1.554-.737-2.404.001-2.424 1.972-4.396 4.398-4.396 2.424.001 4.397 1.973 4.396 4.397-.001 2.424-1.972 4.396-4.397 4.396z" />
          </svg>
        </button>

        {/* Voice / Phone Channel */}
        <button
          type="button"
          className="w-11 h-11 rounded-2xl bg-blue-50 border-1.5 border-blue-200 text-blue-600 flex items-center justify-center shadow-sm hover:scale-105 transition-all"
          title="Phone / Voice Channel"
        >
          <Phone className="w-5 h-5" />
        </button>

        {/* Live Chat Bubble (Active) */}
        <button
          type="button"
          className="w-11 h-11 rounded-2xl bg-purple-50 border-2 border-purple-400 text-purple-600 flex items-center justify-center shadow-md shadow-purple-500/15 ring-2 ring-purple-100 hover:scale-105 transition-all"
          title="Web Chat (Active Live Stream)"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Email Channel */}
        <button
          type="button"
          className="w-11 h-11 rounded-2xl bg-amber-50 border-1.5 border-amber-200 text-amber-600 flex items-center justify-center shadow-sm hover:scale-105 transition-all"
          title="Email Channel"
        >
          <Mail className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
