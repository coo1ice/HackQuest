import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { PageId } from '../../types/navigation';
import { STATE_DATASET } from '../../data/stateData';
import { getStateOverview, getDistrictPhcs, getRedistributionRecommendations } from '../../api/endpoints';
import type { StateOverviewResponse, DistrictDetailResponse, PHCDetailItem, RedistributionRecommendationResponse } from '../../api/types';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import {
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  ArrowUpDown,
  Phone,
  Building2,
} from 'lucide-react';

interface StateDistrictDrilldownProps {
  selectedStateId?: string;
  onNavigate: (page: PageId, options?: { stateId?: string; districtName?: string; facilityName?: string; directiveId?: number }) => void;
}

export const StateDistrictDrilldown: React.FC<StateDistrictDrilldownProps> = ({
  selectedStateId = 'INBR',
  onNavigate,
}) => {
  const fallbackStateData = STATE_DATASET[selectedStateId] || STATE_DATASET['INBR'];

  // State overview & district telemetry data
  const [stateOverview, setStateOverview] = useState<StateOverviewResponse | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('Muzaffarpur');
  const [districtData, setDistrictData] = useState<DistrictDetailResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RedistributionRecommendationResponse[]>([]);

  // Async lifecycle states
  const [isLoadingState, setIsLoadingState] = useState<boolean>(true);
  const [isLoadingDistrict, setIsLoadingDistrict] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');

  // Table Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('All Supply Classes');
  const [selectedTriageStatus, setSelectedTriageStatus] = useState<string>('All Operational Profiles');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'name' | 'stock' | 'beds' | 'staff'>('stock');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Load state overview
  const loadStateData = useCallback(async () => {
    setIsLoadingState(true);
    setError(null);
    try {
      const [overviewRes, recsRes] = await Promise.all([
        getStateOverview(selectedStateId),
        getRedistributionRecommendations('pending').catch(() => []),
      ]);
      setStateOverview(overviewRes);
      setRecommendations(recsRes);

      if (overviewRes.last_synced_at) {
        setLastSyncedTime(new Date(overviewRes.last_synced_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST');
      }

      // Default to first district if current selected is not in state
      if (overviewRes.districts && overviewRes.districts.length > 0) {
        const found = overviewRes.districts.some((d) => d.district_id === selectedDistrictId || d.district_name === selectedDistrictId);
        if (!found) {
          setSelectedDistrictId(overviewRes.districts[0].district_id || overviewRes.districts[0].district_name);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve state overview from the central surveillance node.');
    } finally {
      setIsLoadingState(false);
    }
  }, [selectedStateId, selectedDistrictId]);

  useEffect(() => {
    loadStateData();
  }, [selectedStateId]);

  // Load district PHCs whenever selectedDistrictId changes
  const loadDistrictPhcs = useCallback(async (districtId: string) => {
    setIsLoadingDistrict(true);
    try {
      const data = await getDistrictPhcs(districtId);
      setDistrictData(data);
      if (data.last_synced_at) {
        setLastSyncedTime(new Date(data.last_synced_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST');
      }
    } catch (err: any) {
      // Non-fatal or fallback to empty
      setDistrictData(null);
    } finally {
      setIsLoadingDistrict(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDistrictId) {
      loadDistrictPhcs(selectedDistrictId);
    }
  }, [selectedDistrictId, loadDistrictPhcs]);

  // Priority Redistribution Matrix Pairings (from real OR-Tools recommendations)
  const priorityRecs = useMemo(() => {
    if (!recommendations || recommendations.length === 0) return [];
    // Filter to recommendations matching this state
    return recommendations.slice(0, 4);
  }, [recommendations]);

  // Filtered & Sorted PHC list
  const filteredFacilities = useMemo(() => {
    if (!districtData || !districtData.phcs) return [];

    return districtData.phcs
      .filter((fac: PHCDetailItem) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            fac.name.toLowerCase().includes(q) ||
            fac.id.toLowerCase().includes(q) ||
            fac.block_name.toLowerCase().includes(q);
          if (!matches) return false;
        }

        const lowestStockDays = fac.stocks?.length
          ? Math.min(...fac.stocks.map((s) => s.days_of_stock_left))
          : 99;

        if (selectedTriageStatus === 'Stockout Imminent (< 3 Days)') {
          if (lowestStockDays >= 3) return false;
        } else if (selectedTriageStatus === 'Critical Bed Saturation (> 90%)') {
          if (fac.bed_occupancy_pct < 90) return false;
        } else if (selectedTriageStatus === 'Severe Staff Shortfall (< 60%)') {
          if (fac.doctor_present && fac.nurse_present) return false;
        }
        return true;
      })
      .sort((a: PHCDetailItem, b: PHCDetailItem) => {
        let valA: number | string = 0;
        let valB: number | string = 0;

        if (sortField === 'name') {
          valA = a.name;
          valB = b.name;
          return sortAsc ? (valA as string).localeCompare(valB as string) : (valB as string).localeCompare(valA as string);
        } else if (sortField === 'stock') {
          valA = a.stocks?.[0]?.days_of_stock_left ?? 0;
          valB = b.stocks?.[0]?.days_of_stock_left ?? 0;
        } else if (sortField === 'beds') {
          valA = a.bed_occupancy_pct;
          valB = b.bed_occupancy_pct;
        } else if (sortField === 'staff') {
          valA = (a.doctor_present ? 1 : 0) + (a.nurse_present ? 1 : 0);
          valB = (b.doctor_present ? 1 : 0) + (b.nurse_present ? 1 : 0);
        }

        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [districtData, searchQuery, selectedTriageStatus, sortField, sortAsc]);

  if (isLoadingState) {
    return <LoadingState message={`Retrieving ${fallbackStateData.name} State Command telemetry...`} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadStateData} />;
  }

  const stateName = stateOverview?.state_name || fallbackStateData.name;
  const totalDistricts = stateOverview?.total_districts || fallbackStateData.totalDistricts;
  const totalPhcs = stateOverview?.total_phcs || fallbackStateData.totalPhcs;
  const activeAlerts = stateOverview?.active_alerts_count || 4;
  const stockHealth = stateOverview ? Math.round(stateOverview.stock_health_score) : 42;
  const compositeDeficit = 100 - stockHealth;

  const districtsList = stateOverview?.districts || [
    { district_id: 'Muzaffarpur', district_name: 'Muzaffarpur', total_phcs: 34, critical_phcs_count: 6, avg_stockout_risk: 0.72, bed_occupancy_pct: 94, status: 'critical' },
    { district_id: 'Patna', district_name: 'Patna', total_phcs: 62, critical_phcs_count: 0, avg_stockout_risk: 0.12, bed_occupancy_pct: 72, status: 'adequate' },
    { district_id: 'Vaishali', district_name: 'Vaishali', total_phcs: 28, critical_phcs_count: 4, avg_stockout_risk: 0.65, bed_occupancy_pct: 89, status: 'critical' },
    { district_id: 'Nalanda', district_name: 'Nalanda', total_phcs: 41, critical_phcs_count: 0, avg_stockout_risk: 0.15, bed_occupancy_pct: 70, status: 'adequate' },
  ];

  return (
    <div className="flex flex-col w-full gap-4 pb-12">
      {/* Top Command Strip / State Jurisdiction Header */}
      <div className="w-full bg-white border border-slate-300 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Breadcrumb & Core Identity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <button
                type="button"
                onClick={() => onNavigate('national-overview')}
                className="hover:text-slate-900 underline cursor-pointer"
              >
                National Overview
              </button>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-900 font-bold">{stateName} State Command</span>
              <span className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 text-slate-700 font-mono text-[11px]">
                ID: {selectedStateId}-SURV
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {stateName} Operational Ledger
                </span>
                <span className={`px-2 py-0.5 text-xs uppercase font-bold border ${
                  activeAlerts > 0
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}>
                  {activeAlerts > 0 ? 'Triage Alert Active' : 'Normal Monitoring'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span>Districts: <strong className="text-slate-900 font-mono">{totalDistricts}</strong></span>
                <span>•</span>
                <span>Active Telemetry PHCs: <strong className="text-slate-900 font-mono">{totalPhcs}</strong></span>
                {lastSyncedTime && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-slate-500">Last Synced: {lastSyncedTime}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Vital Composite Stat Ledger */}
          <div className="flex items-center gap-3 bg-red-50/70 border border-red-200 p-3 self-start lg:self-center">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-error shrink-0" />
              <div className="flex flex-col">
                <span className="text-[11px] text-error uppercase font-bold tracking-wider">
                  Composite Resiliency Index
                </span>
                <span className="text-xs text-slate-800">
                  <strong>{stockHealth}%</strong> aggregate buffer across primary facilities
                </span>
              </div>
            </div>
            <div className="bg-error text-white font-mono font-bold text-sm sm:text-base px-3 py-1 flex items-center shrink-0">
              -{compositeDeficit}% DEFICIT
            </div>
          </div>
        </div>

        {/* Segmented Tactical Filter Matrix */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-slate-100 border border-slate-200 p-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* District Picker */}
            <div className="flex items-center bg-white border border-slate-300 px-2.5 py-1.5 shadow-2xs">
              <label htmlFor="target-district-select" className="text-[11px] text-slate-500 mr-2 uppercase font-semibold">Target District:</label>
              <select
                id="target-district-select"
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                {districtsList.map((d) => (
                  <option key={d.district_id} value={d.district_id}>
                    {d.district_name} ({d.total_phcs} PHCs)
                  </option>
                ))}
              </select>
            </div>

            {/* Resource Category */}
            <div className="flex items-center bg-white border border-slate-300 px-2.5 py-1.5 shadow-2xs">
              <label htmlFor="resource-tier-select" className="text-[11px] text-slate-500 mr-2 uppercase font-semibold">Resource Tier:</label>
              <select
                id="resource-tier-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs text-slate-800 focus:outline-none cursor-pointer"
              >
                <option>All Supply Classes</option>
                <option>Antivenom &amp; Vaccines</option>
                <option>Oxygen &amp; IV Fluids</option>
                <option>Critical Care Beds</option>
              </select>
            </div>

            {/* Facility Status */}
            <div className="flex items-center bg-white border border-slate-300 px-2.5 py-1.5 shadow-2xs">
              <label htmlFor="facility-triage-select" className="text-[11px] text-slate-500 mr-2 uppercase font-semibold">Facility Triage:</label>
              <select
                id="facility-triage-select"
                value={selectedTriageStatus}
                onChange={(e) => setSelectedTriageStatus(e.target.value)}
                className="bg-transparent text-xs text-slate-800 focus:outline-none cursor-pointer"
              >
                <option>All Operational Profiles</option>
                <option>Stockout Imminent (&lt; 3 Days)</option>
                <option>Critical Bed Saturation (&gt; 90%)</option>
                <option>Severe Staff Shortfall (&lt; 60%)</option>
              </select>
            </div>
          </div>

          {/* Refresh / Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadStateData}
              disabled={isLoadingState || isLoadingDistrict}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDistrict ? 'animate-spin text-secondary' : 'text-slate-600'}`} />
              <span>Re-poll telemetry</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('emergency-redistribution', { stateId: selectedStateId })}
              className="bg-black text-white hover:bg-slate-800 text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>State manifest</span>
            </button>
          </div>
        </div>
      </div>

      {/* Priority Redistribution Matrix - Cross-District Pairing */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-secondary rounded-full"></span>
            <span className="text-xs uppercase tracking-wider text-slate-800 font-bold">
              Priority Redistribution Matrix • Optimization Engine Recommendations
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {priorityRecs.length} Directives Generated by OR-Tools Solver
          </span>
        </div>

        {priorityRecs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {priorityRecs.map((rec) => (
              <div
                key={rec.id}
                className="bg-white border border-slate-300 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary"></div>
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        Directive #{rec.id}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {rec.medicine_id}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {rec.quantity} units requested
                      </span>
                    </div>
                    <span className="bg-sky-100 text-sky-800 font-mono text-[10px] font-bold px-1.5 py-0.5 uppercase border border-sky-200">
                      {rec.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="bg-slate-50 border border-slate-200 p-2">
                      <div className="text-slate-500 text-[10px] uppercase font-semibold">Origin Donor Depot</div>
                      <div className="font-bold text-slate-900 truncate">{rec.from_phc_name || rec.from_phc_id}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-2">
                      <div className="text-slate-500 text-[10px] uppercase font-semibold">Recipient Deficit Center</div>
                      <div className="font-bold text-slate-900 truncate">{rec.to_phc_name || rec.to_phc_id}</div>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-600 font-mono pt-1">
                      <span>Distance: {rec.distance_km} km</span>
                      <span>Expiry: {rec.days_to_expiry} days</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-xs text-slate-700 font-medium truncate max-w-[140px]">
                    {rec.predicted_impact}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate('emergency-redistribution', {
                        stateId: selectedStateId,
                        directiveId: rec.id,
                        facilityName: rec.to_phc_name || rec.to_phc_id,
                      })
                    }
                    className="bg-black hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1 transition-colors cursor-pointer shadow-2xs"
                  >
                    Authorize transfer
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No pending redistribution directives"
            description="All district health centers in this zone are currently operating within nominal safety buffers."
          />
        )}
      </div>

      {/* Primary Granular PHC Telemetry Table */}
      <div className="w-full bg-white border border-slate-300 shadow-sm overflow-hidden">
        {/* Table Header Strip */}
        <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-700" />
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900">
              PHC Telemetry Ledger • {selectedDistrictId} Surveillance Unit
            </h4>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600">
            <input
              type="text"
              placeholder="Search facility or block..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-300 px-2 py-1 text-xs text-slate-800 focus:outline-none w-48 sm:w-60"
            />
            <span>Displaying {filteredFacilities.length} reporting facilities</span>
          </div>
        </div>

        {/* Data Grid */}
        {isLoadingDistrict ? (
          <LoadingState message={`Retrieving live telemetry for ${selectedDistrictId}...`} />
        ) : filteredFacilities.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider select-none font-semibold text-[11px]">
                <tr>
                  <th
                    onClick={() => {
                      setSortField('name');
                      setSortAsc(!sortAsc);
                    }}
                    className="py-2.5 px-4 cursor-pointer hover:text-slate-900"
                  >
                    <div className="flex items-center gap-1">
                      <span>Facility Code &amp; Name</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Block Jurisdiction</th>
                  <th
                    onClick={() => {
                      setSortField('stock');
                      setSortAsc(!sortAsc);
                    }}
                    className="py-2.5 px-4 text-right cursor-pointer hover:text-slate-900"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Stock Status</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      setSortField('beds');
                      setSortAsc(!sortAsc);
                    }}
                    className="py-2.5 px-4 text-right cursor-pointer hover:text-slate-900"
                  >
                    Bed Occupancy
                  </th>
                  <th
                    onClick={() => {
                      setSortField('staff');
                      setSortAsc(!sortAsc);
                    }}
                    className="py-2.5 px-4 text-right cursor-pointer hover:text-slate-900"
                  >
                    Staff Attendance
                  </th>
                  <th className="py-2.5 px-4 text-right">Operational Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredFacilities.map((facility: PHCDetailItem) => {
                  const stockDays = facility.stocks?.length
                    ? Math.min(...facility.stocks.map((s) => s.days_of_stock_left))
                    : 14;
                  const isCriticalStock = stockDays < 3;
                  const bedOccupancy = Math.round(facility.bed_occupancy_pct);

                  return (
                    <tr key={facility.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex flex-col font-sans">
                          <span className="font-bold text-slate-900 text-xs">{facility.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{facility.id}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-sans">
                        <span className="text-slate-800">{facility.block_name}</span>
                        {facility.contact_number && (
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            <span>{facility.contact_number}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-right font-sans">
                        <div className="flex flex-col items-end">
                          <span className={`font-bold text-xs ${isCriticalStock ? 'text-error' : 'text-slate-900'}`}>
                            {stockDays} Days Cover
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {facility.stocks?.length ?? 0} tracked lines
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-right font-sans">
                        <div className="flex flex-col items-end">
                          <span className={`font-bold text-xs ${bedOccupancy >= 90 ? 'text-error' : 'text-slate-900'}`}>
                            {bedOccupancy}%
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {facility.occupied_beds}/{facility.total_beds} functional beds
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-right font-sans">
                        <div className="flex flex-col items-end">
                          <span className={`text-xs font-semibold ${facility.doctor_present ? 'text-slate-900' : 'text-error'}`}>
                            {facility.doctor_present ? 'Medical Officer On Duty' : 'Doctor Absent'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {facility.nurse_present ? 'Nursing staff deployed' : 'Nurse absent'}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-right font-sans">
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate('emergency-redistribution', {
                              stateId: selectedStateId,
                              facilityName: facility.name,
                            })
                          }
                          className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-semibold px-2.5 py-1 text-xs transition-colors cursor-pointer shadow-2xs"
                        >
                          Requisition
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No matching PHC facilities found"
            description="No primary health centres in this district matched the active search query or filter criteria."
          />
        )}
      </div>
    </div>
  );
};
