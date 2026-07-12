import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../initialData';
import { ShieldCheck, Truck, Lock, Mail, ChevronRight, User as UserIcon, LogIn, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and security passcode.');
      return;
    }

    // Match simulated user
    const matchedUser = INITIAL_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    
    if (matchedUser) {
      onLogin(matchedUser);
    } else {
      setError('Access Denied. Unknown corporate credentials or unauthorized access node.');
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    const matchedUser = INITIAL_USERS.find(u => u.role === role);
    if (matchedUser) {
      onLogin(matchedUser);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans" id="login-container">
      
      {/* Background graphic elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-75" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl border border-slate-200 shadow-2xl relative overflow-hidden" id="login-card">
        
        {/* Left column: Branding and context */}
        <div className="md:col-span-5 bg-slate-900 text-white p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 to-slate-900 opacity-90" />
          
          <div className="relative space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white font-mono">TransitOps</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Smart Transport Operations Platform</h2>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Digitizing vehicle registries, operator compliance, cargo dispatch scheduling, and corporate fleet cost analysis.
            </p>
          </div>

          <div className="relative space-y-3 pt-8 md:pt-0">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active System Status</h4>
            <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Operations Gateway online</span>
            </div>
          </div>
        </div>

        {/* Right column: Form and role switchers */}
        <div className="md:col-span-7 p-8 flex flex-col justify-center space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Access Gateway Sign-In</h1>
            <p className="text-xs text-slate-500 font-semibold">Enter your corporate credentials to access TransitOps modules.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3.5 rounded-xl flex items-start gap-2 animate-shake" id="login-error">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address
              </label>
              <input 
                type="email" 
                placeholder="e.g. manager@transitops.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Security Passcode
              </label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Station</span>
            </button>
          </form>

          {/* Demarcation */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-150"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Evaluate Corporate Roles</span>
            <div className="flex-grow border-t border-slate-150"></div>
          </div>

          {/* Role Grid switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" id="quick-logins">
            {INITIAL_USERS.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleQuickLogin(user.role)}
                className="p-3 text-left bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center justify-between transition-all group cursor-pointer"
                id={`quick-login-${user.role.toLowerCase().replace(' ', '-')}`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1 group-hover:text-blue-700 transition-colors">
                    <UserIcon className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                    {user.role}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium truncate w-40">{user.email}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
