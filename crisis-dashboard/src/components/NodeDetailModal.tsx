import React from 'react';
import type { StateCrisisData } from '../data/stateData';
import { X, AlertOctagon, CheckCircle, Truck, Package, ShieldAlert, Send, ArrowRight } from 'lucide-react';

interface NodeDetailModalProps {
  state: StateCrisisData | null;
  onClose: () => void;
  onAuthorizeRedistribution?: (state: StateCrisisData) => void;
  onDrilldown?: (stateId: string) => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  state,
  onClose,
  onAuthorizeRedistribution,
  onDrilldown,
}) => {
  if (!state) return null;

  const isCritical = state.status === 'Critical Stockout';
  const isAdequate = state.status === 'Adequate Reserve';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-300 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                isCritical ? 'bg-error animate-pulse' : isAdequate ? 'bg-secondary' : 'bg-emerald-600'
              }`}
            ></span>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {state.commandName}
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 font-mono">
                  NODE-ID: {state.id}-HQ
                </span>
              </h2>
              <span className="text-xs text-slate-500">
                State Surveillance Officer: {state.sso} • Total Districts: {state.totalDistricts}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Alert Status Banner */}
          <div
            className={`p-3 border flex items-start gap-3 ${
              isCritical
                ? 'bg-red-50 border-red-200 text-red-900'
                : isAdequate
                ? 'bg-sky-50 border-sky-200 text-sky-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {isCritical ? (
              <AlertOctagon className="w-5 h-5 text-error shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wide">
                Operational Status: {state.statusBadge}
              </div>
              <div className="text-xs mt-1 leading-relaxed">{state.summary}</div>
            </div>
          </div>

          {/* Key Operational Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-2.5">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">PHCs Online</span>
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                {state.phcsReporting.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {Math.round((state.phcsReporting / state.totalPhcs) * 100)}% active telemetry
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">ICU Saturation</span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  isCritical ? 'text-error' : isAdequate ? 'text-secondary' : 'text-slate-900'
                }`}
              >
                {state.icuOccupancyPercent}%
              </span>
              <span className="text-[10px] text-slate-500 block">{state.icuOccupancy}</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Runrate Buffer</span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  isCritical ? 'text-error' : 'text-slate-900'
                }`}
              >
                {state.avgReserveRunrate}
              </span>
              <span className="text-[10px] text-slate-500 block">Target: 14+ Days</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Districts at Risk</span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  state.riskDistricts > 0 ? 'text-error' : 'text-slate-600'
                }`}
              >
                {state.riskDistricts} / {state.totalDistricts}
              </span>
              <span className="text-[10px] text-slate-500 block">Immediate dispatch</span>
            </div>
          </div>

          {/* Infrastructure Health */}
          <div className="bg-slate-50 border border-slate-200 p-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-500" />
              Oxygen Generation &amp; Infrastructure
            </h3>
            <div className="text-xs text-slate-700 flex justify-between items-center py-1 border-b border-slate-200">
              <span>PSA Oxygen Plants:</span>
              <span className="font-semibold">{state.oxygenPlantStatus || 'Operating Nominally'}</span>
            </div>
            <div className="text-xs text-slate-700 flex justify-between items-center py-1">
              <span>Logistics Transfer Tracking:</span>
              <span className="font-semibold text-secondary flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                {state.logisticsStatus} ({state.convoyEta || 'Nominal'})
              </span>
            </div>
          </div>

          {/* Critical Supply Shortfall Manifest */}
          {state.criticalSuppliesShortage && state.criticalSuppliesShortage.length > 0 && (
            <div className="bg-white border border-slate-200 p-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-error" />
                Critical Items Required for Urgent Dispatch
              </h3>
              <div className="space-y-1.5">
                {state.criticalSuppliesShortage.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-xs flex items-center justify-between p-2 bg-slate-50 border border-slate-100"
                  >
                    <span className="font-medium text-slate-800">• {item}</span>
                    <span className="text-[10px] font-bold text-error bg-red-50 border border-red-200 px-2 py-0.5">
                      STOCKOUT IMMINENT
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close Inspector
          </button>

          <div className="flex items-center gap-2">
            {onDrilldown && (
              <button
                onClick={() => {
                  onClose();
                  onDrilldown(state.id);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>State &amp; District Drill-down</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                if (onAuthorizeRedistribution) {
                  onAuthorizeRedistribution(state);
                }
              }}
              className="px-4 py-1.5 text-xs font-semibold bg-black text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Authorize Emergency Redistribution</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
