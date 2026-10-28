import React, { useState } from 'react';
import { CurrentUser, DEMO_USERS } from '../services/store';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UserCheck,
  Bot,
  Shield,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: CurrentUser) => void;
  onContinueAsCustomer?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onContinueAsCustomer
}) => {
  const [selectedRole, setSelectedRole] = useState<'agent' | 'admin' | 'singleBrand'>('agent');
  const [email, setEmail] = useState<string>(DEMO_USERS.agent.email);
  const [password, setPassword] = useState<string>('datastraw2026!');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preset role selection
  const handleSelectRole = (role: 'agent' | 'admin' | 'singleBrand') => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'admin') {
      setEmail(DEMO_USERS.admin.email);
    } else if (role === 'singleBrand') {
      setEmail(DEMO_USERS.singleBrandAgent.email);
    } else {
      setEmail(DEMO_USERS.agent.email);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your work email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    // Realistic micro-delay to feel authentic & smooth
    setTimeout(() => {
      let matchedUser: CurrentUser = DEMO_USERS.agent;
      if (cleanEmail.includes('admin') || selectedRole === 'admin') {
        matchedUser = DEMO_USERS.admin;
      } else if (cleanEmail.includes('shein') || cleanEmail.includes('single') || selectedRole === 'singleBrand') {
        matchedUser = DEMO_USERS.singleBrandAgent;
      } else if (cleanEmail.includes('agent') || selectedRole === 'agent') {
        matchedUser = DEMO_USERS.agent;
      } else {
        // Fallback for custom entered email
        matchedUser = {
          id: `custom-user-${Date.now()}`,
          email: cleanEmail,
          name: cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ' (Agent)'
        };
      }

      setIsLoading(false);
      onLogin(matchedUser);
    }, 350);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-slate-50/60 min-h-full">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto text-white shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider">
              <span>Datastraw</span>
              <span className="text-slate-300">/</span>
              <span>CX Reply Assistant</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Sign In to Workstation
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your credentials or choose a pre-filled demo role to continue.
            </p>
          </div>
        </div>

        {/* Quick Demo Persona Pre-fill Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
            Select Pre-filled Role (1-Click)
          </label>
          <div className="grid grid-cols-1 gap-2">
            {/* 1. Support Agent */}
            <button
              type="button"
              onClick={() => handleSelectRole('agent')}
              className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedRole === 'agent'
                  ? 'bg-blue-50/90 border-blue-500 shadow-2xs ring-1 ring-blue-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedRole === 'agent' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Bot className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">Alex Mercer</div>
                  <div className="text-[10px] text-slate-500 truncate">Multi-Brand Support Agent</div>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Agent
              </span>
            </button>

            {/* 2. Brand Administrator */}
            <button
              type="button"
              onClick={() => handleSelectRole('admin')}
              className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedRole === 'admin'
                  ? 'bg-emerald-50/90 border-emerald-500 shadow-2xs ring-1 ring-emerald-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedRole === 'admin' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">Sarah Connor</div>
                  <div className="text-[10px] text-slate-500 truncate">Brand Admin (KB CRUD Access)</div>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Admin
              </span>
            </button>

            {/* 3. Restricted Agent */}
            <button
              type="button"
              onClick={() => handleSelectRole('singleBrand')}
              className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedRole === 'singleBrand'
                  ? 'bg-amber-50/90 border-amber-500 shadow-2xs ring-1 ring-amber-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedRole === 'singleBrand' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Shield className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">Riley Vance</div>
                  <div className="text-[10px] text-slate-500 truncate">Shein Designs Only (RLS Test)</div>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Isolated
              </span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 absolute">
            Account Credentials
          </span>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Interactive Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Work Email</span>
              <span className="text-[10px] text-slate-400 font-normal">Pre-filled</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-mono"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <span className="text-[10px] text-slate-400">Pre-filled demo</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>Remember my session on refresh</span>
            </label>
          </div>

          {/* Submit Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs hover:shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In to Workstation</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Customer Portal Direct Access Link */}
        {onContinueAsCustomer && (
          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-[11px] text-slate-500">
              Need customer support without signing in?{' '}
              <button
                type="button"
                onClick={onContinueAsCustomer}
                className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2 cursor-pointer"
              >
                Open Customer Portal directly
              </button>
            </p>
          </div>
        )}

        {/* Security & Tenancy Footer Notice */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium text-center">
          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>Protected by Row-Level Security (RLS) &amp; Zero Token Exposure</span>
        </div>
      </div>
    </div>
  );
};
