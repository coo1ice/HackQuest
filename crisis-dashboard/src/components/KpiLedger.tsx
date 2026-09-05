import { Hospital, AlertTriangle, Bed, Truck } from 'lucide-react';
import type { PageId } from '../types/navigation';
import { safeNumber } from '../utils/formatters';

interface KpiLedgerProps {
  onNavigate?: (page: PageId) => void;
  data?: {
    totalPhcs: number;
    reportingPhcs?: number;
    reportingRatePct: number;
    criticalStatesCount: number;
    bedOccupancyPct: number;
    inTransitTransfersCount: number;
  };
}

export const KpiLedger: React.FC<KpiLedgerProps> = ({ onNavigate, data }) => {
  const totalPhcs = safeNumber(data?.totalPhcs, 31482);
  const reportingRate = safeNumber(data?.reportingRatePct, 99.1);
  const criticalCount = safeNumber(data?.criticalStatesCount, 5);
  const bedOccupancy = safeNumber(data?.bedOccupancyPct, 74.6);
  const inTransitCount = safeNumber(data?.inTransitTransfersCount, 6);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {/* KPI 1: Monitored PHCs */}
      <div
        onClick={() => onNavigate?.('state-district-drill-down')}
        className="bg-white border border-slate-300 p-3 flex flex-col justify-between shadow-xs hover:border-slate-500 cursor-pointer transition-colors group"
        title="View granular State & District facility ledger"
      >
        <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold tracking-wide uppercase">
          <span className="group-hover:text-slate-900 transition-colors">Monitored PHCs and CHCs</span>
          <Hospital className="w-4 h-4 text-slate-400 group-hover:text-secondary transition-colors" />
        </div>
        <div className="my-1.5 flex items-baseline gap-2">
          <span className="text-xl font-bold text-slate-900 tabular-nums">
            {totalPhcs.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500">Active nodes</span>
        </div>
        <div className="w-full bg-slate-100 h-1 overflow-hidden">
          <div className="bg-secondary h-full" style={{ width: `${Math.min(100, reportingRate)}%` }}></div>
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[11px] text-slate-500">
          <span>Reporting telemetry: {reportingRate}%</span>
          <span className="text-secondary font-semibold group-hover:underline">Open district ledger</span>
        </div>
      </div>

      {/* KPI 2: States in Critical Deficit */}
      <div
        onClick={() => onNavigate?.('urgent-alert-feed')}
        className="bg-red-50/80 border border-red-200 p-3 flex flex-col justify-between shadow-xs hover:border-error cursor-pointer transition-colors group"
        title="View Urgent Alert Feed"
      >
        <div className="flex items-center justify-between text-red-800 text-[11px] font-bold tracking-wide uppercase">
          <span>States in Critical Deficit</span>
          <AlertTriangle className="w-4 h-4 text-error" />
        </div>
        <div className="my-1.5 flex items-baseline gap-2">
          <span className="text-xl font-bold text-error tabular-nums">
            {criticalCount}
          </span>
          <span className="text-xs text-red-700 font-semibold">Under 3 days life-saving stock</span>
        </div>
        <div className="w-full bg-red-200 h-1 overflow-hidden">
          <div className="bg-error h-full" style={{ width: '100%' }}></div>
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[11px] text-red-800 font-medium">
          <span>Priority Triage</span>
          <span className="text-error font-bold uppercase group-hover:underline">View emergency alerts</span>
        </div>
      </div>

      {/* KPI 3: National Bed Occupancy */}
      <div className="bg-white border border-slate-300 p-3 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold tracking-wide uppercase">
          <span>National Bed Occupancy</span>
          <Bed className="w-4 h-4 text-slate-400" />
        </div>
        <div className="my-1.5 flex items-baseline gap-2">
          <span className="text-xl font-bold text-slate-900 tabular-nums">
            {bedOccupancy}%
          </span>
          <span className="text-xs text-slate-500">Total functional beds</span>
        </div>
        <div className="flex gap-0.5 h-1 w-full bg-slate-100 overflow-hidden">
          <div className="bg-slate-700 h-full" style={{ width: `${Math.min(100, bedOccupancy)}%` }}></div>
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[11px] text-slate-500">
          <span>Capacity utilization</span>
          <span className="text-slate-700 font-semibold">Active monitoring</span>
        </div>
      </div>

      {/* KPI 4: Logistics Transfers */}
      <div
        onClick={() => onNavigate?.('inter-district-transfer-tracking')}
        className="bg-white border border-slate-300 p-3 flex flex-col justify-between shadow-xs hover:border-secondary cursor-pointer transition-colors group"
        title="View Live Logistics & Inter-District Transfer Tracking"
      >
        <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold tracking-wide uppercase">
          <span className="group-hover:text-slate-900 transition-colors">Logistics Transfers</span>
          <Truck className="w-4 h-4 text-slate-400 group-hover:text-secondary transition-colors" />
        </div>
        <div className="my-1.5 flex items-baseline gap-2">
          <span className="text-xl font-bold text-slate-900 tabular-nums">
            {inTransitCount}
          </span>
          <span className="text-xs text-secondary font-medium">In Transit</span>
        </div>
        <div className="w-full bg-slate-100 h-1 overflow-hidden">
          <div className="bg-secondary h-full" style={{ width: '75%' }}></div>
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[11px] text-slate-500">
          <span>Inter-district routing</span>
          <span className="text-secondary font-semibold group-hover:underline">View transit tracking</span>
        </div>
      </div>
    </div>
  );
};
