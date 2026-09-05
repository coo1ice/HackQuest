import React from 'react';
import type { StateCrisisData } from '../data/stateData';
import { Truck, ExternalLink, ChevronRight } from 'lucide-react';

interface CommandPanelProps {
  state: StateCrisisData;
  onOpenNode: (state: StateCrisisData) => void;
  onDrilldownState?: (stateId: string) => void;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({ state, onOpenNode, onDrilldownState }) => {
  const isCritical = state.status === 'Critical Stockout' || state.statusCategory === 'critical';
  const isAdequate = state.status === 'Adequate Reserve' || state.statusCategory === 'warning';

  const statusBadgeStyle = isCritical
    ? 'bg-red-100 text-red-800 border-red-300'
    : isAdequate
    ? 'bg-sky-100 text-sky-800 border-sky-300'
    : 'bg-slate-100 text-slate-800 border-slate-300';

  const statusTextStyle = isCritical
    ? 'text-error'
    : isAdequate
    ? 'text-secondary'
    : 'text-slate-700';

  const statusDotStyle = isCritical
    ? 'bg-error'
    : isAdequate
    ? 'bg-secondary'
    : 'bg-slate-500';

  return (
    <div
      id="gis-command-panel"
      className="absolute bottom-4 left-4 z-30 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-[420px] bg-white border border-slate-300 shadow-lg p-4 transition-all duration-300 rounded-none"
    >
      {/* Header with State Name and Status Text */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${statusDotStyle}`}></span>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {state.commandName || `${state.name} State Command`}
          </h2>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${statusBadgeStyle}`}
        >
          {state.statusBadge || (isCritical ? 'Critical Deficit' : isAdequate ? 'Adequate Reserve' : 'Normal Buffer')}
        </span>
      </div>

      {/* Narrative Summary with Telemetry */}
      <p className="text-xs text-slate-600 leading-relaxed my-2.5">
        <strong className="text-slate-900 font-semibold tabular-nums">
          {state.phcsReporting.toLocaleString()} PHCs reporting
        </strong>{' '}
        • {state.summary || `Live surveillance telemetry synchronized. ${state.riskDistricts} critical units reporting immediate deficits.`}
      </p>

      {/* Metrics Grid: PHCs Reporting, ICU Occupancy, Stock Runrate */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs py-1">
        <div className="bg-slate-50 border border-slate-200 p-2">
          <span className="text-[10px] text-slate-500 block uppercase font-medium">PHCs Reporting</span>
          <span className="text-xs font-bold text-slate-900 tabular-nums font-mono">
            {state.phcsReporting.toLocaleString()} / {state.totalPhcs.toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-2">
          <span className="text-[10px] text-slate-500 block uppercase font-medium">Bed Occupancy</span>
          <span className={`text-xs font-bold tabular-nums font-mono ${statusTextStyle}`}>
            {state.icuOccupancy || `${state.icuOccupancyPercent}%`}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-2 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-500 block uppercase font-medium">Stock Health</span>
          <span className={`text-xs font-bold tabular-nums font-mono ${statusTextStyle}`}>
            {state.stockHealth || `${state.stockHealthPercent}%`}
          </span>
        </div>
      </div>

      {/* Logistics Dispatch & Actions Strip */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium truncate max-w-[170px] sm:max-w-[200px]">
          <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{state.logisticsStatus || 'Corridor Standby'}</span>
        </div>

        <div className="flex items-center gap-2">
          {onDrilldownState && (
            <button
              type="button"
              onClick={() => onDrilldownState(state.id)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-1.5 text-xs font-semibold tracking-wide transition-colors flex items-center gap-1 cursor-pointer"
              title="Drill-down into district telemetry"
            >
              <span>Drill-down</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </button>
          )}

          <button
            type="button"
            id="open-node-btn"
            onClick={() => onOpenNode(state)}
            className="shrink-0 bg-black text-white hover:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Open node</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
