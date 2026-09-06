import React, { useState } from 'react';
import { STATE_DATASET } from '../data/stateData';
import { Search, ChevronRight } from 'lucide-react';
import type { StateSummaryItem } from '../api/types';
import { safeRound } from '../utils/formatters';

interface StateRegistryProps {
  selectedStateId: string | null;
  onSelectState: (stateId: string) => void;
  onDrilldownState?: (stateId: string) => void;
  apiStates?: StateSummaryItem[];
}

export const StateRegistry: React.FC<StateRegistryProps> = ({
  selectedStateId,
  onSelectState,
  onDrilldownState,
  apiStates,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'critical' | 'warning' | 'normal'>('all');
  const [sortBy, setSortBy] = useState<'urgency' | 'occupancy' | 'alphabetical'>('urgency');

  // Convert apiStates into registry items or fallback to STATE_DATASET
  const statesList = apiStates && apiStates.length > 0
    ? apiStates.map((s, idx) => {
        const stockScore = safeRound(s.stock_health_score ?? (s as any).health_score, 75);
        const bedOcc = safeRound(s.bed_occupancy_pct, 68);
        return {
          id: s.state_id,
          name: s.state_name || s.state_id,
          urgencyRank: idx + 1,
          statusCategory: s.status === 'critical' ? 'critical' : s.status === 'warning' ? 'warning' : 'normal',
          statusBadge: s.status === 'critical' ? 'CRITICAL DEFICIT' : s.status === 'warning' ? 'ADEQUATE RESERVE' : 'NORMAL BUFFER',
          stockHealth: `${stockScore}%`,
          stockHealthPercent: stockScore,
          icuOccupancyPercent: bedOcc,
          riskDistricts: safeRound(s.critical_phcs_count ?? (s as any).districts_at_risk, 0),
          totalDistricts: safeRound(s.total_districts, 4),
          totalPhcs: safeRound(s.total_phcs, 12),
        };
      })
    : Object.values(STATE_DATASET);

  // Filter & Search logic
  const filteredStates = statesList
    .filter((state) => {
      const matchesSearch =
        state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        state.id.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (filterCategory === 'all') return true;
      return state.statusCategory === filterCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'urgency') {
        return a.urgencyRank - b.urgencyRank;
      }
      if (sortBy === 'occupancy') {
        return b.icuOccupancyPercent - a.icuOccupancyPercent;
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="flex flex-col h-full bg-white border border-slate-300 p-4 shadow-xs">
      {/* Registry Title & Total Counter */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            States Ranked by Severity
          </h2>
          <span className="text-[11px] text-slate-500">
            Real-time surveillance ranking
          </span>
        </div>
        <span className="text-xs font-bold tabular-nums bg-slate-100 text-slate-700 px-2 py-0.5 border border-slate-200">
          Total: {statesList.length}
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-4 gap-1 my-3 text-[11px]">
        <button
          type="button"
          onClick={() => setFilterCategory('all')}
          className={`py-1 text-center font-semibold border transition-all cursor-pointer ${
            filterCategory === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('critical')}
          className={`py-1 text-center font-semibold border transition-all cursor-pointer ${
            filterCategory === 'critical'
              ? 'bg-error text-white border-error'
              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
          }`}
        >
          Critical
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('warning')}
          className={`py-1 text-center font-semibold border transition-all cursor-pointer ${
            filterCategory === 'warning'
              ? 'bg-secondary text-white border-secondary'
              : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
          }`}
        >
          Reserve
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('normal')}
          className={`py-1 text-center font-semibold border transition-all cursor-pointer ${
            filterCategory === 'normal'
              ? 'bg-slate-700 text-white border-slate-700'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          Buffer
        </button>
      </div>

      {/* Search Input & Sort Dropdown */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search state..."
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-800 transition-colors"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="text-xs py-1 px-2 bg-slate-50 border border-slate-200 focus:outline-none text-slate-700 font-medium cursor-pointer"
        >
          <option value="urgency">Highest Deficit</option>
          <option value="occupancy">Highest ICU Occupancy</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>

      {/* State Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[560px]">
        {filteredStates.map((state) => {
          const isSelected = state.id === selectedStateId;
          const isCritical = state.statusCategory === 'critical';
          const isWarning = state.statusCategory === 'warning';

          let cardBg = 'bg-white border-slate-200 hover:border-slate-400';
          if (isSelected) {
            cardBg = 'bg-slate-50 border-slate-900 ring-1 ring-slate-900';
          } else if (isCritical) {
            cardBg = 'bg-red-50/50 border-red-200 hover:border-red-300';
          } else if (isWarning) {
            cardBg = 'bg-sky-50/40 border-sky-200 hover:border-sky-300';
          }

          return (
            <div
              key={state.id}
              onClick={() => onSelectState(state.id)}
              className={`p-3 border transition-all cursor-pointer ${cardBg}`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {state.urgencyRank}. {state.name}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 border ${
                      isCritical
                        ? 'bg-error text-white border-error'
                        : isWarning
                        ? 'bg-secondary text-white border-secondary'
                        : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    {isCritical ? 'Critical' : isWarning ? 'Reserve' : 'Buffer'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  {onDrilldownState && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDrilldownState(state.id);
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-900 hover:text-white border border-slate-300 text-[10px] font-bold transition-colors cursor-pointer"
                      title="Open district & PHC drill-down"
                    >
                      Drill-down
                    </button>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* Card Metrics Triplet */}
              <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 block">Stock Health</span>
                  <span
                    className={`font-bold tabular-nums ${
                      isCritical ? 'text-error' : isWarning ? 'text-secondary' : 'text-slate-800'
                    }`}
                  >
                    {state.stockHealth}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Bed Occupancy</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {state.icuOccupancyPercent}%
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Critical Units</span>
                  <span
                    className={`font-bold tabular-nums ${
                      state.riskDistricts > 0 ? 'text-error' : 'text-slate-500'
                    }`}
                  >
                    {state.riskDistricts}
                  </span>
                </div>
              </div>

              {/* Stock health progress indicator */}
              <div className="w-full bg-slate-200 h-1 mt-2.5 overflow-hidden">
                <div
                  className={`h-full ${
                    isCritical ? 'bg-error' : isWarning ? 'bg-secondary' : 'bg-slate-600'
                  }`}
                  style={{ width: `${state.stockHealthPercent}%` }}
                ></div>
              </div>
            </div>
          );
        })}

        {filteredStates.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            No states found matching &quot;{searchTerm}&quot;
          </div>
        )}
      </div>
    </div>
  );
};
