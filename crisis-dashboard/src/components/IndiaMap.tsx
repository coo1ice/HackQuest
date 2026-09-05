import React, { useState } from 'react';
import { STATE_DATASET } from '../data/stateData';
import { INDIA_MAP_FEATURES } from '../data/indiaMapPaths';
import { Radio, Truck, Layers, Eye, EyeOff, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface IndiaMapProps {
  selectedStateId: string;
  onSelectState: (stateId: string) => void;
  hoveredStateId: string | null;
  onHoverState: (stateId: string | null) => void;
}

export const IndiaMap: React.FC<IndiaMapProps> = ({
  selectedStateId,
  onSelectState,
  hoveredStateId,
  onHoverState,
}) => {
  const [showLabels, setShowLabels] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [showBeacons, setShowBeacons] = useState(true);

  const isStateSelected = (id: string) => selectedStateId === id;
  const isStateHovered = (id: string) => hoveredStateId === id;

  const getPathClasses = (id: string) => {
    const selected = isStateSelected(id);
    const hovered = isStateHovered(id);
    const data = STATE_DATASET[id];
    const isCritical = data?.status === 'Critical Stockout';
    const isAdequate = data?.status === 'Adequate Reserve';

    let classes = 'cursor-pointer transition-all duration-150 outline-none ';

    if (selected) {
      classes += 'stroke-slate-900 stroke-[2.8] filter drop-shadow-lg brightness-110 z-20 ';
    } else if (hovered) {
      classes += 'stroke-white stroke-[2.2] brightness-125 z-10 ';
    } else {
      classes += 'stroke-white/90 stroke-[0.85] hover:stroke-white hover:stroke-[1.8] ';
    }

    if (isCritical) {
      classes += 'fill-error hover:fill-red-600 ';
    } else if (isAdequate) {
      classes += 'fill-secondary hover:fill-sky-700 ';
    } else {
      classes += 'fill-slate-300 hover:fill-slate-400 ';
    }

    return classes;
  };

  const hoveredStateData = hoveredStateId ? STATE_DATASET[hoveredStateId] : null;

  return (
    <div className="relative w-full h-full flex items-center justify-center p-2 select-none overflow-hidden">
      {/* Tactical Grid Background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="gisGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2,2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gisGrid)" />
      </svg>

      {/* Top Map HUD Controls & Status Badges */}
      <div className="absolute top-3 left-3 z-30 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded border border-slate-200 shadow-sm text-[11px] font-semibold text-slate-700">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>SimpleMaps Vector Engine</span>
          <span className="text-[10px] text-slate-400 font-mono">1000×1000</span>
        </div>

        <div className="hidden sm:flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-1 rounded border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${
              showLabels ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {showLabels ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Labels
          </button>
          <button
            type="button"
            onClick={() => setShowCorridors(!showCorridors)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${
              showCorridors ? 'bg-secondary text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-3 h-3" />
            Corridors
          </button>
          <button
            type="button"
            onClick={() => setShowBeacons(!showBeacons)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${
              showBeacons ? 'bg-error text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Radio className="w-3 h-3" />
            Alert Pings
          </button>
        </div>
      </div>

      {/* Top-Right Triage Legend */}
      <div className="absolute top-3 right-3 z-30 hidden md:flex flex-col gap-1.5 bg-white/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200 shadow-sm pointer-events-auto text-[11px]">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
          Triage Tiers (36 States &amp; UTs)
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-error flex-shrink-0" />
          <span className="font-semibold text-slate-800">Critical Deficit (&lt;48h)</span>
          <span className="text-[10px] font-mono text-error font-bold ml-auto">4</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
          <span className="font-semibold text-slate-800">Adequate Reserve (&gt;14d)</span>
          <span className="text-[10px] font-mono text-secondary font-bold ml-auto">8</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-sm bg-slate-300 shadow-sm flex-shrink-0" />
          <span className="font-medium text-slate-600">Balanced Buffer (7-14d)</span>
          <span className="text-[10px] font-mono text-slate-500 font-bold ml-auto">24</span>
        </div>
      </div>

      {/* Hover Information Floating HUD Card */}
      {hoveredStateData && (
        <div className="absolute bottom-4 right-4 z-40 bg-slate-900/95 text-white p-3 rounded-lg border border-slate-700/80 shadow-2xl backdrop-blur-md max-w-xs pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1.5 mb-2">
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                {hoveredStateData.name}
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">
                  {hoveredStateData.id}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">{hoveredStateData.commandName}</div>
            </div>
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase ${
                hoveredStateData.statusCategory === 'critical'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : hoveredStateData.statusCategory === 'normal'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {hoveredStateData.statusBadge}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
            <div className="bg-slate-800/80 p-1.5 rounded">
              <span className="text-[10px] text-slate-400 block">Stock Health</span>
              <span className="font-bold text-white tabular-nums">{hoveredStateData.stockHealth}</span>
            </div>
            <div className="bg-slate-800/80 p-1.5 rounded">
              <span className="text-[10px] text-slate-400 block">ICU Load</span>
              <span className="font-bold text-white tabular-nums">{hoveredStateData.icuOccupancyPercent}%</span>
            </div>
          </div>

          {hoveredStateData.logisticsStatus && (
            <div className="text-[10px] text-slate-300 flex items-center gap-1.5 pt-1 border-t border-slate-800">
              <Truck className="w-3 h-3 text-secondary flex-shrink-0" />
              <span className="truncate">{hoveredStateData.logisticsStatus}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Indian Standard Map SVG (Official SimpleMaps Geographic Projection) */}
      <svg
        className="w-full max-w-[620px] max-h-[700px] h-auto drop-shadow-md select-none relative z-10"
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle glow filter for critical alert nodes */}
          <filter id="alertGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Linear gradient for interstate express corridor 1 (MH -> BR) */}
          <linearGradient id="mhBrGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#006399" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ba1a1a" stopOpacity="0.95" />
          </linearGradient>

          {/* Linear gradient for interstate express corridor 2 (TN -> OD) */}
          <linearGradient id="tnOdGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#006399" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ba1a1a" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Layer of all 36 Indian States & Union Territories */}
        <g id="features" strokeLinejoin="round" strokeLinecap="round">
          {INDIA_MAP_FEATURES.map((feature) => {
            const data = STATE_DATASET[feature.id];
            const isCritical = data?.status === 'Critical Stockout';

            return (
              <path
                key={feature.id}
                id={feature.id}
                d={feature.d}
                className={getPathClasses(feature.id)}
                filter={isCritical ? 'url(#alertGlow)' : undefined}
                onClick={() => onSelectState(feature.id)}
                onMouseEnter={() => onHoverState(feature.id)}
                onMouseLeave={() => onHoverState(null)}
              >
                <title>{`${feature.name} (${feature.id}) - ${data?.status || 'Active'}`}</title>
              </path>
            );
          })}
        </g>

        {/* Critical Alarm Pulsing Beacons */}
        {showBeacons && (
          <g id="critical-beacons" pointerEvents="none">
            {INDIA_MAP_FEATURES.filter((f) => STATE_DATASET[f.id]?.status === 'Critical Stockout').map((f) => (
              <g key={`beacon-${f.id}`}>
                <circle
                  cx={f.center.x}
                  cy={f.center.y}
                  r="14"
                  className="fill-error/30 animate-ping"
                />
                <circle
                  cx={f.center.x}
                  cy={f.center.y}
                  r="7"
                  className="fill-error/60 animate-pulse"
                />
                <circle
                  cx={f.center.x}
                  cy={f.center.y}
                  r="3.5"
                  className="fill-white stroke-error stroke-[1.5]"
                />
              </g>
            ))}
          </g>
        )}

        {/* State Labels Layer */}
        {showLabels && (
          <g id="state-labels" pointerEvents="none">
            {INDIA_MAP_FEATURES.map((feature) => {
              const data = STATE_DATASET[feature.id];
              const isSelected = isStateSelected(feature.id);
              const isCritical = data?.status === 'Critical Stockout';
              const isAdequate = data?.status === 'Adequate Reserve';

              // Hide very small labels if not selected or critical
              if (!feature.label) return null;

              let textColorClass = 'fill-slate-700 font-semibold';
              let textSizeClass = 'text-[10px]';

              if (isCritical) {
                textColorClass = 'fill-white font-extrabold tracking-wider filter drop-shadow-md';
                textSizeClass = 'text-[12px]';
              } else if (isAdequate) {
                textColorClass = 'fill-white font-bold filter drop-shadow-sm';
                textSizeClass = 'text-[11px]';
              } else if (isSelected) {
                textColorClass = 'fill-slate-900 font-extrabold underline';
                textSizeClass = 'text-[11px]';
              }

              return (
                <text
                  key={`label-${feature.id}`}
                  x={feature.center.x}
                  y={feature.center.y}
                  className={`${textSizeClass} ${textColorClass} pointer-events-none tabular-nums transition-opacity duration-150 select-none`}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {feature.label}
                </text>
              );
            })}
          </g>
        )}

        {/* Dynamic Interstate Emergency Supply Corridors */}
        {showCorridors && (
          <g id="logistics-corridors" pointerEvents="none">
            {/* Corridor 1: Maharashtra (Surplus Hub) -> Bihar (Critical Deficit) */}
            <path
              d="M 335 605 Q 460 500 590 410"
              fill="none"
              stroke="url(#mhBrGradient)"
              strokeWidth="3.2"
              strokeDasharray="8,6"
              className="animate-pulse drop-shadow"
            />
            {/* Convoy waypoint 1 */}
            <circle cx="465" cy="505" r="8" className="fill-secondary/50 animate-ping" />
            <circle cx="465" cy="505" r="5" className="fill-secondary stroke-white stroke-2 shadow" />
            <rect
              x="425"
              y="518"
              width="80"
              height="16"
              rx="3"
              className="fill-slate-900/90 stroke-slate-700 stroke-1"
            />
            <text x="465" y="529" className="text-[8px] fill-white font-bold" textAnchor="middle">
              MH ➔ BR (2h 40m)
            </text>

            {/* Corridor 2: Tamil Nadu (Surplus Hub) -> Odisha (Critical Deficit) */}
            <path
              d="M 380 835 Q 480 710 545 580"
              fill="none"
              stroke="url(#tnOdGradient)"
              strokeWidth="3.2"
              strokeDasharray="8,6"
              className="animate-pulse drop-shadow"
            />
            {/* Convoy waypoint 2 */}
            <circle cx="475" cy="700" r="8" className="fill-secondary/50 animate-ping" />
            <circle cx="475" cy="700" r="5" className="fill-secondary stroke-white stroke-2 shadow" />
            <rect
              x="435"
              y="713"
              width="80"
              height="16"
              rx="3"
              className="fill-slate-900/90 stroke-slate-700 stroke-1"
            />
            <text x="475" y="724" className="text-[8px] fill-white font-bold" textAnchor="middle">
              TN ➔ OD (Transit)
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
