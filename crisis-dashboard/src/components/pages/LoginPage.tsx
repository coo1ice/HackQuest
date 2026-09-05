import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Shield, CheckCircle2 } from 'lucide-react';
import type { PageId } from '../../types/navigation';

interface LoginPageProps {
  onLoginSuccess: (targetPage?: PageId) => void;
}

const PRESET_ACCOUNTS = [
  {
    username: 'admin',
    roleLabel: 'National Allocation Admin',
    scope: 'All India (Central Command)',
  },
  {
    username: 'bihar_officer',
    roleLabel: 'State Surveillance Officer',
    scope: 'Bihar State Command',
  },
  {
    username: 'muz_officer',
    roleLabel: 'District Health Officer',
    scope: 'Muzaffarpur District',
  },
  {
    username: 'phc_nurse',
    roleLabel: 'Frontline PHC Staff',
    scope: 'Kanti PHC (BR-MUZ-01)',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('password123');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!username.trim() || !password.trim()) {
      setLocalError('Please enter both official username and password.');
      return;
    }

    try {
      await login(username.trim(), password.trim());
      onLoginSuccess('national-overview');
    } catch (err: any) {
      setLocalError(err?.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleSelectPreset = (uname: string) => {
    setUsername(uname);
    setPassword('password123');
    setLocalError(null);
    clearError();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white border border-slate-300 p-6 sm:p-8 shadow-sm">
        {/* Institutional Identification Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-base">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              National Health Resource Management
            </h1>
            <p className="text-xs text-slate-500">
              Ministry of Health and Family Welfare, Government of India
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="my-4 bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 leading-relaxed">
          Access restricted to authorized state, district, and primary health centre officers. All activities are logged to an immutable audit ledger under national disaster management directives.
        </div>

        {/* Error Notification */}
        {(localError || error) && (
          <div className="mb-4 bg-red-50 border border-red-200 p-3 text-xs text-red-900 font-medium">
            {localError || error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-xs font-bold text-slate-800">
              Official Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or bihar_officer"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:border-slate-800 transition-colors font-mono"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-bold text-slate-800">
                Access Password
              </label>
              <span className="text-[11px] text-slate-500 font-mono">Default: password123</span>
            </div>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:border-slate-800 transition-colors font-mono"
                required
              />
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full py-2.5 bg-black hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-xs flex items-center justify-center gap-2"
          >
            {isLoading ? 'Verifying Credentials...' : 'Sign in to Command Terminal'}
          </button>
        </form>

        {/* Quick Role Selection for Verification */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="text-xs font-bold text-slate-800 mb-2">
            Select verified officer account for review:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_ACCOUNTS.map((acc) => {
              const isSelected = username === acc.username;
              return (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleSelectPreset(acc.username)}
                  className={`p-2.5 text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 border-slate-900 ring-1 ring-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 font-mono">{acc.username}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-slate-900" />}
                  </div>
                  <div className="text-[11px] text-slate-700 font-medium mt-0.5">{acc.roleLabel}</div>
                  <div className="text-[10px] text-slate-500">{acc.scope}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
