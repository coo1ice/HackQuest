import React from 'react';
import { Hospital, AlertTriangle, Bed, Truck } from 'lucide-react';
import type { PageId } from '../types/navigation';

interface KpiLedgerProps {
  onNavigate?: (page: PageId) => void;
}

export const KpiLedger: React.FC<KpiLedgerProps> = ({ onNavigate }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {/* KPI 1: Monitored PHCs */}
      <div
        onClick={() => onNavigate?.('state-district-drill-down')}
        className="bg-white border border-slate-300 p-3 flex flex-col justify-between shadow-xs hover:border-slate-500 cursor-pointer transition-colors group"
        title="Click to view granular State & District facility ledger"
      >
        <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold tracking-wide uppercase">
          <span className="group-hover:text-slate-900 transition-colors">MONITORED PHCs / CHCs</span>
          <Hospital className="w-4 h-4 text-slate-400 group-hover:text-secondary transition-colors" />
        </div>
        <div className="my-1.5 flex items-baseline gap-2">
          <span className="text-xl font-bold text-slate-900 tabular-nums">31,482</span>
          <span className="text-xs text-slate-500">Active nodes</span>
        </div>
        <div className="w-full bg-slate-100 h-1 overflow-hidden">
          <div className="bg-secondary h-full" style={{ width: '98.4%' }}></div>
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[11px] text-slate-500">
          <span>Sub-centers: 1,56,204</span>
          <span className="text-secondary font-semibold">98.4% nominal &rarr;</span>
        </div>
      </div>

      {/* KPI 2: States in Critical Deficit */}
      <div
        onClick={() => onNavigate?.('urgent-alert-feed')}
        className="bg-red-50/80 border border-red-200 p-3 flex flex-col justify-between shadow-xs hover:border-error cursor-pointer transition-colors group"
        title="Click to view Urgent Alert Feed"
      >
        <div className="flex items-center justify-between text-red-800 text-[11px] font-bold tracking-wide uppercase">
          <span>STATES IN CRITICAL DEFICIT</span>
          <AlertTriangle className="w-4 h-4 text-error" />
        </div>
        <div className="my-1.5 flex items-baseline gap-2">
          <span className="text-xl font-bold text-error tabular-nums">4</span>
          <span className="text-xs text-red-700 font-semibold">&lt; 3 days life-saving stock</span>
        </div>
        <div className="w-full bg-red-200 h-1 overflow-hidden">
          <div className="bg-error h-full" style={{ width: '100%' }}></div>
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[11px] text-red-800 font-medium">
          <span>BR, AS, OD, SK</span>
          <span className="text-error font-bold uppercase group-hover:underline">Emergency Triage &rarr;</span>
        </div>
      </div>

      {/* KPI 3: National Bed Occupancy */}
      <div className="bg-white border border-slate-300 p-3 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold tracking-wide uppercase">
          <span>NATL. BED OCCUPANCY</span>
          <Bed className="w-4 h-4 text-slate-400" />
        </div>
        <div className="my-1.5 flex items-baseline gap-2">
          <span className="text-xl font-bold text-slate-900 tabular-nums">76.4%</span>
          <span className="text-xs text-slate-500">Total functional</span>
        </div>
        <div className="flex gap-0.5 h-1 w-full bg-slate-100 overflow-hidden">
          <div className="bg-slate-700 h-full" style={{ width: '71%' }}></div>
          <div className="bg-secondary h-full" style={{ width: '13%' }}></div>
          <div className="bg-error h-full" style={{ width: '16%' }}></div>
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[11px] text-slate-500">
          <span>Gen: 71%</span>
          <span>O₂: 84%</span>
          <span className="text-error font-semibold">ICU: 89%</span>
        </div>
      </div>

      {/* KPI 4: Logistics Transfers */}
      <div
        onClick={() => onNavigate?.('inter-district-transfer-tracking')}
        className="bg-white border border-slate-300 p-3 flex flex-col justify-between shadow-xs hover:border-secondary cursor-pointer transition-colors group"
        title="Click to view Live Logistics & Inter-District Transfer Tracking"
      >
        <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold tracking-wide uppercase">
          <span className="group-hover:text-slate-900 transition-colors">LOGISTICS TRANSFERS</span>
          <Truck className="w-4 h-4 text-slate-400 group-hover:text-secondary transition-colors" />
        </div>
        <div className="my-1.5 flex items-baseline gap-2">
          <span className="text-xl font-bold text-slate-900 tabular-nums">38</span>
          <span className="text-xs text-secondary font-medium">In Transit</span>
          <span className="text-xs text-slate-400">/ 14 Pending</span>
        </div>
        <div className="w-full bg-slate-100 h-1 overflow-hidden">
          <div className="bg-secondary h-full" style={{ width: '73%' }}></div>
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[11px] text-slate-500">
          <span>Mean ETA: 6.2 hrs</span>
          <span className="text-secondary font-semibold group-hover:underline">Corridor Open &rarr;</span>
        </div>
      </div>
    </div>
  );
};
