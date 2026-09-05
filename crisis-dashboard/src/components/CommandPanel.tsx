import React from 'react';
import type { StateCrisisData } from '../data/stateData';
import { Truck, ExternalLink, ChevronRight } from 'lucide-react';

interface CommandPanelProps {
  state: StateCrisisData;
  onOpenNode: (state: StateCrisisData) => void;
  onDrilldownState?: (stateId: string) => void;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({ state, onOpenNode, onDrilldownState }) => {
  const isCritical = state.status === 'Critical Stockout';
  const isAdequate = state.status === 'Adequate Reserve';

  // Status text and pill styling matching the map colors
  const statusBadgeStyle = isCritical
    ? 'bg-error-container text-error border-error/30'
    : isAdequate
    ? 'bg-secondary-fixed text-secondary-fixed-variant border-secondary/30'
    : 'bg-surface-container text-on-surface-variant border-outline-variant';

  const statusTextStyle = isCritical
    ? 'text-error'
    : isAdequate
    ? 'text-secondary'
    : 'text-slate-600';

  const statusDotStyle = isCritical
    ? 'bg-error animate-ping'
    : isAdequate
    ? 'bg-secondary'
    : 'bg-slate-500';

  return (
    <div
      id="gis-command-panel"
      className="absolute bottom-4 left-4 z-30 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-[420px] bg-white border border-slate-300 shadow-xl p-4 transition-all duration-300 rounded-none backdrop-blur-sm bg-white/95"
    >
      {/* Header with State Name and Status Text matching map */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${statusDotStyle}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isCritical ? 'bg-error' : isAdequate ? 'bg-secondary' : 'bg-slate-600'}`}></span>
          </span>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {state.commandName}
          </h2>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${statusBadgeStyle}`}
        >
          {state.statusBadge}
        </span>
      </div>

      {/* Narrative Summary with Telemetry */}
      <p className="text-xs text-slate-600 leading-relaxed my-2.5">
        <strong className="text-slate-900 font-semibold tabular-nums">
          {state.phcsReporting.toLocaleString()} PHCs reporting
        </strong>{' '}
        • {state.summary}
      </p>

      {/* Metrics Grid: PHCs Reporting, ICU Occupancy, Stock Runrate */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs py-1">
        <div className="bg-slate-50 border border-slate-200/80 p-2">
          <span className="text-[10px] text-slate-500 block uppercase font-medium">PHCs Reporting</span>
          <span className="text-xs font-bold text-slate-900 tabular-nums">
            {state.phcsReporting.toLocaleString()} / {state.totalPhcs.toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-2">
          <span className="text-[10px] text-slate-500 block uppercase font-medium">ICU Occupancy</span>
          <span className={`text-xs font-bold tabular-nums ${statusTextStyle}`}>
            {state.icuOccupancy}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-2 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-500 block uppercase font-medium">Reserve Runrate</span>
          <span className={`text-xs font-bold tabular-nums ${statusTextStyle}`}>
            {state.avgReserveRunrate}
          </span>
        </div>
      </div>

      {/* Logistics Dispatch & Actions Strip */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] text-secondary font-medium truncate max-w-[170px] sm:max-w-[200px]">
          <Truck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{state.logisticsStatus}</span>
        </div>

        <div className="flex items-center gap-2">
          {onDrilldownState && (
            <button
              onClick={() => onDrilldownState(state.id)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-1.5 text-xs font-semibold tracking-wide transition-colors flex items-center gap-1 cursor-pointer"
              title="Drill-down into district telemetry"
            >
              <span>Drill-down</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}

          {/* Black "Open Node" button */}
          <button
            id="open-node-btn"
            onClick={() => onOpenNode(state)}
            className="shrink-0 bg-black text-white hover:bg-slate-800 active:bg-slate-950 px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-colors flex items-center gap-1.5 rounded-none shadow-sm cursor-pointer"
          >
            <span>Open Node</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
