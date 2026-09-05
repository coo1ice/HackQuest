import React, { useState } from 'react';
import { ShieldAlert, Gavel, LogIn, AlertTriangle, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { PageId } from '../../types/navigation';

interface RestrictedScreenProps {
  screenTitle: string;
  requiredRole?: string;
  onNavigate: (page: PageId) => void;
}

export const RestrictedScreen: React.FC<RestrictedScreenProps> = ({
  screenTitle,
  requiredRole = 'District Health Officer, State Surveillance Officer, or National Admin',
  onNavigate,
}) => {
  const { user, enableEmergencyOverride } = useAuth();
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState(
    'Impending stockout crisis requiring immediate inter-district asset requisition.'
  );

  const handleConfirmOverride = () => {
    enableEmergencyOverride(overrideReason);
    setShowOverrideModal(false);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-12 px-4 animate-fade-in">
      <div className="max-w-2xl w-full bg-white border border-slate-300 shadow-md p-6 sm:p-8">
        {/* Security Clearance Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-800 bg-amber-100 px-1.5 py-0.5 border border-amber-200">
                RESTRICTED OPERATIONAL ZONE
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                PROT-SEC-42B
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Access Restricted — {screenTitle}
            </h2>
          </div>
        </div>

        {/* Status Explanation */}
        <div className="my-5 text-xs text-slate-700 leading-relaxed space-y-3">
          <p>
            Under the <strong>National Health Resource Protocol</strong> and statutory supply-chain governance, operational decisions on this console require verified official credentials.
          </p>

          <div className="bg-slate-50 border border-slate-200 p-3 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Active Terminal Session:</span>
              <span className="font-bold text-slate-900">
                {user ? `${user.username} (${user.role})` : 'Unauthenticated Session (Read-Only)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Required Clearance:</span>
              <span className="font-semibold text-slate-800">{requiredRole}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jurisdiction Restriction:</span>
              <span className="text-slate-700">Allocation Directive Mutex Locked</span>
            </div>
          </div>

          <p className="text-slate-600">
            If you are a field officer facing an impending critical stockout or disaster response surge, you may invoke the <strong>Statutory Emergency Override</strong> to temporarily unlock operational authority.
          </p>
        </div>

        {/* Dual Actions */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          {!user && (
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-600" />
              <span>Sign in with Official Credentials</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowOverrideModal(true)}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <Gavel className="w-3.5 h-3.5" />
            <span>Invoke Statutory Emergency Override</span>
          </button>
        </div>
      </div>

      {/* Override Attestation Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-300 w-full max-w-lg shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  NDMA Statutory Emergency Declaration
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 text-xs text-slate-700 space-y-3">
              <p className="leading-relaxed">
                By invoking this override, you attest under <strong>Section 38 of the Disaster Management Act</strong> that a health emergency or imminent PHC stockout necessitates immediate operational intervention without standard role clearance.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Justification / Incident Reference:
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-900">
                All override actions are logged to the immutable national audit ledger with timestamp and client fingerprint.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOverride}
                className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm and Grant Emergency Override</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
