import React from 'react';
import { Brand } from '../types/database';
import { CurrentUser, DEMO_USERS } from '../services/store';
import {
  Building2,
  LogOut,
  UserCheck,
  ShieldCheck,
  User,
  Headphones,
  Columns2,
  BookOpen,
  Layers
} from 'lucide-react';

export type ActiveView = 'customer' | 'agent' | 'split' | 'kb' | 'audit' | 'architecture';

interface HeaderProps {
  currentUser: CurrentUser | null;
  onSelectUser: (user: CurrentUser | null) => void;
  brands: Brand[];
  selectedBrandId: string;
  onSelectBrand: (brandId: string) => void;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  isAdmin: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSelectUser,
  brands,
  selectedBrandId,
  onSelectBrand,
  activeView,
  onSelectView,
  isAdmin
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Datastraw Wordmark & Brand Identity */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  Datastraw
                </span>
                <span className="text-slate-300 font-light text-base">/</span>
                <span className="font-bold text-sm tracking-tight text-blue-700">
                  CX Reply Assistant
                </span>
              </div>
            </div>

            {/* Brand Selector Dropdown */}
            {currentUser && brands.length > 0 && (
              <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <label htmlFor="brand-selector" className="sr-only">Select Brand</label>
                <select
                  id="brand-selector"
                  value={selectedBrandId}
                  onChange={(e) => onSelectBrand(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors cursor-pointer"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Primary View Switcher: Customer Portal (1st) vs Support Agent (2nd) vs Side-by-Side (3rd) */}
          {currentUser && (
            <div className="flex items-center gap-2">
              {/* Core Portals Segmented Control */}
              <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => onSelectView('customer')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeView === 'customer'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Customer Portal (Primary Customer View)"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Customer Portal</span>
                </button>

                <button
                  onClick={() => onSelectView('agent')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeView === 'agent'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Support Agent Portal (AI Copilot Advisor & Drafts)"
                >
                  <Headphones className="w-3.5 h-3.5 text-slate-500" />
                  <span>Support Agent</span>
                </button>

                <button
                  onClick={() => onSelectView('split')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeView === 'split'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Side-by-Side Dual View (Customer on Left, Agent on Right)"
                >
                  <Columns2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Side-by-Side</span>
                </button>
              </div>

              {/* Secondary Administration Area (Policies & Audit Logs) */}
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <button
                  onClick={() => onSelectView('kb')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeView === 'kb'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title="Knowledge Base Policies"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Policies</span>
                  {isAdmin && (
                    <span className="text-[9px] font-mono bg-blue-50 text-blue-700 px-1 py-0.2 rounded font-semibold border border-blue-200">
                      Admin
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onSelectView('audit')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeView === 'audit'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title="Audit Logs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Audit Logs</span>
                </button>

                <button
                  onClick={() => onSelectView('architecture')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    activeView === 'architecture'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title="System Architecture (Part 2 Production Scale)"
                >
                  <Layers className={`w-3.5 h-3.5 ${activeView === 'architecture' ? 'text-white' : 'text-blue-600'}`} />
                  <span>Architecture</span>
                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                    activeView === 'architecture'
                      ? 'bg-blue-700 text-blue-100'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    Part 2
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Right Action Controls: Reviewer Persona & Status */}
          <div className="flex items-center gap-2.5">
            {/* Live Status Badge */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Support Engine Online</span>
            </div>

            {/* Persona Switcher / Sign Out */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <label htmlFor="user-selector" className="sr-only">Switch User Persona</label>
                  <select
                    id="user-selector"
                    value={
                      currentUser.id === DEMO_USERS.admin.id
                        ? 'admin'
                        : currentUser.id === DEMO_USERS.singleBrandAgent.id
                        ? 'singleBrand'
                        : 'agent'
                    }
                    onChange={(e) => {
                      if (e.target.value === 'admin') onSelectUser(DEMO_USERS.admin);
                      else if (e.target.value === 'singleBrand') onSelectUser(DEMO_USERS.singleBrandAgent);
                      else onSelectUser(DEMO_USERS.agent);
                    }}
                    className="bg-transparent text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="agent">Alex Mercer (Support Agent)</option>
                    <option value="admin">Sarah Connor (Admin)</option>
                    <option value="singleBrand">Riley Vance (Shein Designs Only)</option>
                  </select>
                </div>

                <button
                  onClick={() => onSelectUser(null)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors text-xs font-semibold cursor-pointer"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onSelectUser(DEMO_USERS.agent)}
                className="ds-btn-primary flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
