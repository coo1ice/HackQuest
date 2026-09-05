import React, { useState, useMemo } from 'react';
import type { PageId } from '../../types/navigation';
import { STATE_DATASET } from '../../data/stateData';
import {
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  Truck,
  Send,
  Eye,
  X,
  ArrowUpDown,
  Phone,
  Building2,
} from 'lucide-react';

interface StateDistrictDrilldownProps {
  selectedStateId?: string;
  onNavigate: (page: PageId, options?: { stateId?: string; districtName?: string; facilityName?: string }) => void;
}

interface PhcFacility {
  code: string;
  name: string;
  tier: 'PHC' | 'CHC' | 'SDH';
  moic: string;
  phone: string;
  stockPercent: number;
  stockDays: number;
  criticalAlert: string;
  bedsOccupied: number;
  bedsTotal: number;
  icuFree: number;
  staffOnDuty: number;
  staffTotal: number;
  syncedMinutesAgo: number;
}

const PHC_FACILITIES: PhcFacility[] = [
  {
    code: '#BR-MUZ-012',
    name: 'Kanti PHC',
    tier: 'PHC',
    moic: 'Dr. Manish Ranjan',
    phone: '+91 94310 88219',
    stockPercent: 28,
    stockDays: 2.1,
    criticalAlert: 'Amoxicillin & ORS exhausted',
    bedsOccupied: 24,
    bedsTotal: 25,
    icuFree: 0,
    staffOnDuty: 3,
    staffTotal: 6,
    syncedMinutesAgo: 8,
  },
  {
    code: '#BR-MUZ-004',
    name: 'Saraiya CHC',
    tier: 'CHC',
    moic: 'Dr. Pushpa Srivastava',
    phone: '+91 94312 44102',
    stockPercent: 31,
    stockDays: 2.5,
    criticalAlert: 'Anti-Rabies & ASV Zero',
    bedsOccupied: 41,
    bedsTotal: 45,
    icuFree: 1,
    staffOnDuty: 6,
    staffTotal: 9,
    syncedMinutesAgo: 12,
  },
  {
    code: '#BR-MUZ-019',
    name: 'Motipur PHC',
    tier: 'PHC',
    moic: 'Dr. Rajeshwar Prasad',
    phone: '+91 94314 99011',
    stockPercent: 42,
    stockDays: 3.4,
    criticalAlert: 'IV Saline Normal Buffer',
    bedsOccupied: 22,
    bedsTotal: 25,
    icuFree: 0,
    staffOnDuty: 5,
    staffTotal: 6,
    syncedMinutesAgo: 15,
  },
  {
    code: '#BR-MUZ-008',
    name: 'Sakra CHC',
    tier: 'CHC',
    moic: 'Dr. Anjali Kumari',
    phone: '+91 94318 33420',
    stockPercent: 19,
    stockDays: 1.2,
    criticalAlert: 'O2 Cylinder manifold sub-nominal',
    bedsOccupied: 48,
    bedsTotal: 48,
    icuFree: 0,
    staffOnDuty: 5,
    staffTotal: 9,
    syncedMinutesAgo: 4,
  },
  {
    code: '#BR-MUZ-022',
    name: 'Kudhani PHC',
    tier: 'PHC',
    moic: 'Dr. Vikramaditya',
    phone: '+91 94316 22091',
    stockPercent: 52,
    stockDays: 4.1,
    criticalAlert: 'Adequate antibiotics buffer',
    bedsOccupied: 19,
    bedsTotal: 25,
    icuFree: 1,
    staffOnDuty: 5,
    staffTotal: 6,
    syncedMinutesAgo: 18,
  },
  {
    code: '#BR-MUZ-031',
    name: 'Sahebganj PHC',
    tier: 'PHC',
    moic: 'Dr. Neha Sinha',
    phone: '+91 94315 77103',
    stockPercent: 34,
    stockDays: 2.8,
    criticalAlert: 'Pediatric ORS & Zinc deficit',
    bedsOccupied: 23,
    bedsTotal: 25,
    icuFree: 0,
    staffOnDuty: 4,
    staffTotal: 6,
    syncedMinutesAgo: 9,
  },
];

export const StateDistrictDrilldown: React.FC<StateDistrictDrilldownProps> = ({
  selectedStateId = 'INBR',
  onNavigate,
}) => {
  const stateData = STATE_DATASET[selectedStateId] || STATE_DATASET['INBR'];

  const [selectedDistrict, setSelectedDistrict] = useState<string>('Muzaffarpur District (Selected)');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Supply Classes');
  const [selectedTriageStatus, setSelectedTriageStatus] = useState<string>('All Operational Profiles');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<string>('Re-poll Telemetry');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalTarget, setModalTarget] = useState<string>('Muzaffarpur Critical PHC Cluster');
  const [modalTitle, setModalTitle] = useState<string>('Emergency Redistribution Dispatch');

  // Sorting
  const [sortField, setSortField] = useState<'name' | 'tier' | 'stock' | 'beds' | 'staff'>('stock');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleOpenRedistributeModal = (target: string, title?: string) => {
    setModalTarget(target);
    setModalTitle(title || `Redistribution Pipeline: ${target}`);
    setModalOpen(true);
  };

  const handleSimulateSync = () => {
    setIsSyncing(true);
    setSyncStatus('Syncing...');
    setTimeout(() => {
      setSyncStatus('Telemetry Synchronized (0m ago)');
      setIsSyncing(false);
      setTimeout(() => {
        setSyncStatus('Re-poll Telemetry');
      }, 3000);
    }, 700);
  };

  const handleExecuteDispatch = () => {
    setModalOpen(false);
    // Deep-link to Emergency Redistribution page with verified context
    onNavigate('emergency-redistribution', {
      stateId: selectedStateId,
      districtName: selectedDistrict,
      facilityName: modalTarget,
    });
  };

  const filteredFacilities = useMemo(() => {
    return PHC_FACILITIES.filter((fac) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          fac.name.toLowerCase().includes(q) ||
          fac.code.toLowerCase().includes(q) ||
          fac.moic.toLowerCase().includes(q) ||
          fac.criticalAlert.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (selectedTriageStatus === 'Stockout Imminent (< 3 Days)') {
        if (fac.stockDays >= 3) return false;
      } else if (selectedTriageStatus === 'Critical Bed Saturation (> 90%)') {
        if (fac.bedsOccupied / fac.bedsTotal < 0.9) return false;
      } else if (selectedTriageStatus === 'Severe Staff Shortfall (< 60%)') {
        if (fac.staffOnDuty / fac.staffTotal >= 0.6) return false;
      }
      return true;
    }).sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;
      if (sortField === 'name') {
        valA = a.name;
        valB = b.name;
      } else if (sortField === 'tier') {
        valA = a.tier;
        valB = b.tier;
      } else if (sortField === 'stock') {
        valA = a.stockPercent;
        valB = b.stockPercent;
      } else if (sortField === 'beds') {
        valA = a.bedsOccupied / a.bedsTotal;
        valB = b.bedsOccupied / b.bedsTotal;
      } else if (sortField === 'staff') {
        valA = a.staffOnDuty / a.staffTotal;
        valB = b.staffOnDuty / b.staffTotal;
      }
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [searchQuery, selectedTriageStatus, sortField, sortAsc]);

  return (
    <div className="flex flex-col w-full gap-4 pb-12">
      {/* Top Command Strip / State Jurisdiction Header */}
      <div className="w-full bg-white border border-slate-300 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Breadcrumb & Core Identity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <button
                onClick={() => onNavigate('national-overview')}
                className="hover:text-slate-900 underline cursor-pointer"
              >
                National
              </button>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-900 font-bold">{stateData.name} State Resource Command</span>
              <span className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 text-slate-700 font-mono text-[11px]">
                ID: {stateData.id}-HQ-04
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {stateData.name} Operational Ledger
                </span>
                <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 text-xs uppercase font-bold">
                  {stateData.status === 'Critical Stockout' ? 'Triage Level 1: Red Alert' : 'Active Triage Monitoring'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span>SSO: <strong className="text-slate-900">{stateData.sso}</strong></span>
                <span>•</span>
                <span>Total Districts: <strong className="text-slate-900 font-mono">{stateData.totalDistricts}</strong></span>
                <span>•</span>
                <span>Active Telemetry PHCs: <strong className="text-slate-900 font-mono">{stateData.phcsReporting.toLocaleString()}</strong></span>
              </div>
            </div>
          </div>

          {/* Vital Composite Stat Ledger */}
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-3 self-start lg:self-center">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-error shrink-0" />
              <div className="flex flex-col">
                <span className="text-[11px] text-error uppercase font-bold tracking-wider">
                  Composite Health: Critical
                </span>
                <span className="text-xs text-slate-800">
                  <strong>{stateData.avgReserveRunrate}</strong> avg life-saving stock across 18 Eastern Districts
                </span>
              </div>
            </div>
            <div className="bg-error text-white font-mono font-bold text-sm sm:text-base px-3 py-1 flex items-center shrink-0">
              -58% DEFICIT
            </div>
          </div>
        </div>

        {/* Segmented Tactical Filter Matrix */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-slate-100 border border-slate-200 p-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* District Picker */}
            <div className="flex items-center bg-white border border-slate-300 px-2.5 py-1.5 shadow-2xs">
              <span className="text-[11px] text-slate-500 mr-2 uppercase font-semibold">Target District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option>Muzaffarpur District (Selected)</option>
                <option>Patna District</option>
                <option>Gaya District</option>
                <option>Darbhanga District</option>
                <option>Vaishali District</option>
              </select>
            </div>

            {/* Resource Category */}
            <div className="flex items-center bg-white border border-slate-300 px-2.5 py-1.5 shadow-2xs">
              <span className="text-[11px] text-slate-500 mr-2 uppercase font-semibold">Resource Tier:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs text-slate-800 focus:outline-none cursor-pointer"
              >
                <option>All Supply Classes</option>
                <option>Essential Antibiotics</option>
                <option>Antivenom &amp; Vaccines</option>
                <option>Oxygen &amp; IV Fluids</option>
                <option>Critical ICU Beds</option>
              </select>
            </div>

            {/* Facility Status */}
            <div className="flex items-center bg-white border border-slate-300 px-2.5 py-1.5 shadow-2xs">
              <span className="text-[11px] text-slate-500 mr-2 uppercase font-semibold">Facility Triage:</span>
              <select
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

          {/* Refresh / Print Audit Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateSync}
              disabled={isSyncing}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-secondary' : 'text-slate-600'}`} />
              <span>{syncStatus}</span>
            </button>
            <button
              onClick={() => onNavigate('emergency-redistribution', { stateId: selectedStateId })}
              className="bg-black text-white hover:bg-slate-800 text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Generate State Manifest</span>
            </button>
          </div>
        </div>
      </div>

      {/* Priority Redistribution Matrix - Cross-District Pairing */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-secondary rounded-full"></span>
            <span className="text-xs uppercase tracking-wider text-slate-700 font-bold">
              Priority Redistribution Matrix • Cross-District Pairing
            </span>
          </div>
          <span className="text-xs text-slate-500">4 Strategic Hubs In Target Transit Corridor</span>
        </div>

        {/* 4 District Cards: 2 Deficit vs 2 Surplus */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* Card 1: Muzaffarpur (Deficit Hub) */}
          <div className="bg-white border border-slate-300 p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-error"></div>
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-error uppercase font-extrabold tracking-wider">Critical Deficit Hub</span>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">Muzaffarpur</h3>
                  <span className="text-xs text-slate-500">34 Sub-Centres / PHCs Reporting</span>
                </div>
                <span className="bg-red-100 text-red-800 font-mono text-[10px] font-bold px-1.5 py-0.5 uppercase border border-red-200">
                  Transit Need
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Stock Resiliency Index</span>
                    <span className="font-mono font-bold text-error">36% (1.8 Days)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 overflow-hidden">
                    <div className="bg-error h-full" style={{ width: '36%' }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="bg-slate-50 border border-slate-200 p-2">
                    <div className="text-slate-500 text-[10px]">Bed Occupancy</div>
                    <div className="font-mono text-base font-bold text-error">94%</div>
                    <div className="text-[10px] text-red-600">214/228 Occupied</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2">
                    <div className="text-slate-500 text-[10px]">Staff Attendance</div>
                    <div className="font-mono text-base font-bold text-slate-900">68%</div>
                    <div className="text-[10px] text-slate-500">Critical Doctors Gap</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 flex items-center justify-between bg-red-50 border border-red-100 p-2">
              <span className="text-xs text-red-800 font-medium">Requisition Priority #1</span>
              <button
                onClick={() => handleOpenRedistributeModal('Muzaffarpur')}
                className="bg-error hover:bg-red-700 text-white text-xs font-semibold px-3 py-1 transition-colors cursor-pointer shadow-2xs"
              >
                Authorize Inbound
              </button>
            </div>
          </div>

          {/* Card 2: Vaishali (Deficit Hub) */}
          <div className="bg-white border border-slate-300 p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-error"></div>
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-error uppercase font-extrabold tracking-wider">Deficit Hub</span>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">Vaishali</h3>
                  <span className="text-xs text-slate-500">28 Sub-Centres / PHCs Reporting</span>
                </div>
                <span className="bg-red-100 text-red-800 font-mono text-[10px] font-bold px-1.5 py-0.5 uppercase border border-red-200">
                  Depleting
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Stock Resiliency Index</span>
                    <span className="font-mono font-bold text-error">44% (2.4 Days)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 overflow-hidden">
                    <div className="bg-error h-full" style={{ width: '44%' }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="bg-slate-50 border border-slate-200 p-2">
                    <div className="text-slate-500 text-[10px]">Bed Occupancy</div>
                    <div className="font-mono text-base font-bold text-error">89%</div>
                    <div className="text-[10px] text-red-600">162/182 Occupied</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2">
                    <div className="text-slate-500 text-[10px]">Staff Attendance</div>
                    <div className="font-mono text-base font-bold text-slate-900">74%</div>
                    <div className="text-[10px] text-slate-500">42 Medical Off.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 flex items-center justify-between bg-red-50 border border-red-100 p-2">
              <span className="text-xs text-red-800 font-medium">Requisition Priority #3</span>
              <button
                onClick={() => handleOpenRedistributeModal('Vaishali')}
                className="bg-black hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1 transition-colors cursor-pointer shadow-2xs"
              >
                Pair With Patna
              </button>
            </div>
          </div>

          {/* Card 3: Patna (Surplus Buffer) */}
          <div className="bg-white border border-slate-300 p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary"></div>
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-secondary uppercase font-extrabold tracking-wider">Surplus Buffer Depot</span>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">Patna</h3>
                  <span className="text-xs text-slate-500">62 Sub-Centres / PHCs Reporting</span>
                </div>
                <span className="bg-sky-100 text-sky-800 font-mono text-[10px] font-bold px-1.5 py-0.5 uppercase border border-sky-200">
                  Buffer Stable
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Stock Resiliency Index</span>
                    <span className="font-mono font-bold text-secondary">92% (14.2 Days)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 overflow-hidden">
                    <div className="bg-secondary h-full" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="bg-slate-50 border border-slate-200 p-2">
                    <div className="text-slate-500 text-[10px]">Bed Occupancy</div>
                    <div className="font-mono text-base font-bold text-slate-900">72%</div>
                    <div className="text-[10px] text-slate-500">428/594 Occupied</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2">
                    <div className="text-slate-500 text-[10px]">Staff Attendance</div>
                    <div className="font-mono text-base font-bold text-slate-900">89%</div>
                    <div className="text-[10px] text-secondary font-semibold">Ready Deploy Unit</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 flex items-center justify-between bg-slate-100 border border-slate-200 p-2">
              <span className="text-xs text-slate-800 font-medium">Excess: 4,200 IV Units</span>
              <button
                onClick={() => {
                  onNavigate('emergency-redistribution', {
                    stateId: selectedStateId,
                    districtName: 'Patna -> Muzaffarpur',
                  });
                }}
                className="bg-secondary hover:bg-sky-800 text-white text-xs font-semibold px-3 py-1 transition-colors cursor-pointer shadow-2xs"
              >
                Deploy To Deficit
              </button>
            </div>
          </div>

          {/* Card 4: Nalanda (Surplus Buffer) */}
          <div className="bg-white border border-slate-300 p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary"></div>
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-secondary uppercase font-extrabold tracking-wider">Surplus Reserve Hub</span>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">Nalanda</h3>
                  <span className="text-xs text-slate-500">41 Sub-Centres / PHCs Reporting</span>
                </div>
                <span className="bg-sky-100 text-sky-800 font-mono text-[10px] font-bold px-1.5 py-0.5 uppercase border border-sky-200">
                  Buffer Ready
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Stock Resiliency Index</span>
                    <span className="font-mono font-bold text-secondary">88% (11.0 Days)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 overflow-hidden">
                    <div className="bg-secondary h-full" style={{ width: '88%' }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="bg-slate-50 border border-slate-200 p-2">
                    <div className="text-slate-500 text-[10px]">Bed Occupancy</div>
                    <div className="font-mono text-base font-bold text-slate-900">70%</div>
                    <div className="text-[10px] text-slate-500">198/282 Occupied</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2">
                    <div className="text-slate-500 text-[10px]">Staff Attendance</div>
                    <div className="font-mono text-base font-bold text-slate-900">86%</div>
                    <div className="text-[10px] text-secondary font-semibold">Standby Response</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 flex items-center justify-between bg-slate-100 border border-slate-200 p-2">
              <span className="text-xs text-slate-800 font-medium">Excess: 300 Vials ASV</span>
              <button
                onClick={() => {
                  onNavigate('emergency-redistribution', {
                    stateId: selectedStateId,
                    districtName: 'Nalanda -> Muzaffarpur',
                  });
                }}
                className="bg-secondary hover:bg-sky-800 text-white text-xs font-semibold px-3 py-1 transition-colors cursor-pointer shadow-2xs"
              >
                Deploy To Deficit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Overview & Visual Telemetry Chart Bar */}
      <div className="bg-white border border-slate-300 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Telemetry Dial */}
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-error"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="36, 100"
                  strokeLinecap="butt"
                  strokeWidth="3.5"
                />
              </svg>
              <span className="absolute font-mono font-bold text-xs text-error">36%</span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Muzaffarpur District Primary Network Triage</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Live telemetry ping across 6 Tier-1 &amp; Tier-2 facilities. Showing immediate operational deficits.
              </div>
            </div>
          </div>

          {/* Quick Facility Metrics Mini-Ledger */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-slate-100 border border-slate-200 px-2.5 py-1">
              <span className="text-slate-500">Reporting Centers:</span>
              <span className="font-mono font-bold text-slate-900 ml-1">6 of 6 Real-time</span>
            </div>
            <div className="bg-red-100 text-red-800 border border-red-200 px-2.5 py-1 font-bold">
              Stockout Alerts: 4 Urgent
            </div>
            <div className="bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-1">
              <span className="text-slate-600">Cold Chain Status:</span>
              <span className="font-mono font-bold text-secondary ml-1">2.4°C (Normal)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Granular PHC Telemetry Table */}
      <div className="w-full bg-white border border-slate-300 shadow-sm overflow-hidden">
        {/* Table Header Strip */}
        <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-700" />
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900">
              PHC Telemetry Ledger • Muzaffarpur Surveillance Unit
            </h4>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600">
            <input
              type="text"
              placeholder="Search facility / MOIC / drug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-300 px-2 py-1 text-xs text-slate-800 focus:outline-none w-48 sm:w-60"
            />
            <span>Displaying {filteredFacilities.length} of 34 Priority Units</span>
            <span>•</span>
            <button
              onClick={() => alert('Exporting verified FHIR R4 dataset for State Nodal Center...')}
              className="text-secondary font-semibold hover:underline cursor-pointer"
            >
              Download CSV Log
            </button>
          </div>
        </div>

        {/* Data Grid */}
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
                <th
                  onClick={() => {
                    setSortField('tier');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900"
                >
                  Tier
                </th>
                <th className="py-2.5 px-3">Medical Officer In-Charge</th>
                <th
                  onClick={() => {
                    setSortField('stock');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-2.5 px-4 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Medicine Stock &amp; Runway</span>
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
                <th className="py-2.5 px-3 text-center">Telemetry Sync</th>
                <th className="py-2.5 px-4 text-right">Operational Command</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredFacilities.map((facility) => {
                const isCriticalStock = facility.stockDays < 3;
                const bedPercent = Math.round((facility.bedsOccupied / facility.bedsTotal) * 100);
                const staffPercent = Math.round((facility.staffOnDuty / facility.staffTotal) * 100);

                return (
                  <tr key={facility.code} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col font-sans">
                        <span className="font-bold text-slate-900 text-xs">{facility.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{facility.code}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 text-[10px] font-bold">
                        {facility.tier}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-sans">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-medium text-xs">{facility.moic}</span>
                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                          {facility.phone}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold text-xs ${isCriticalStock ? 'text-error' : 'text-slate-900'}`}>
                            {facility.stockPercent}%
                          </span>
                          <span className="text-slate-500 font-sans text-[11px]">({facility.stockDays}d left)</span>
                        </div>
                        <span className="text-[10px] font-sans font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 mt-0.5">
                          {facility.criticalAlert}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-bold text-xs ${bedPercent >= 90 ? 'text-error' : 'text-slate-900'}`}>
                          {bedPercent}%
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans">
                          {facility.bedsOccupied}/{facility.bedsTotal} beds • {facility.icuFree} ICU free
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-bold text-xs ${staffPercent <= 60 ? 'text-error' : 'text-slate-800'}`}>
                          {staffPercent}%
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans">
                          {facility.staffOnDuty}/{facility.staffTotal} Doctors on duty
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className="inline-flex items-center gap-1 text-secondary text-[11px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                        <span>Synced {facility.syncedMinutesAgo}m ago</span>
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenRedistributeModal(facility.name, `Point Transfer: ${facility.name}`)}
                          className="bg-error hover:bg-red-700 text-white text-[11px] font-semibold px-2.5 py-1 transition-colors shadow-2xs cursor-pointer"
                        >
                          Request Transfer
                        </button>
                        <button
                          onClick={() => alert(`Inspecting live telemetry for ${facility.name} (${facility.code})...`)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1 border border-slate-300 transition-colors cursor-pointer"
                          title="Inspect Telemetry"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Redistribution Action Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-xl w-full p-5 sm:p-6 shadow-2xl relative animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-error" />
                <h4 className="text-base font-bold text-slate-900">{modalTitle}</h4>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-600">
              <p className="leading-relaxed">
                You are preparing a prioritized emergency diversion manifest from surplus state depots into the designated critical cluster.
              </p>

              <div className="bg-slate-50 border border-slate-200 p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Source Buffer:</span>
                  <strong className="text-slate-900">Patna State Central Medical Depot (Surplus: 92%)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Jurisdiction:</span>
                  <strong className="text-error font-bold">{modalTarget}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Corridor Transit Time:</span>
                  <span className="font-mono text-slate-900">2 hr 15 min (Green Channel via NH 22)</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-800 mb-1.5">
                  Select Priority Payload:
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 bg-slate-100 p-2 cursor-pointer border border-slate-200">
                    <input defaultChecked type="checkbox" className="accent-black w-4 h-4" />
                    <span className="font-medium text-slate-900">Amoxicillin 500mg &amp; Ceftriaxone (5,000 unit ampoules)</span>
                  </label>
                  <label className="flex items-center gap-2 bg-slate-100 p-2 cursor-pointer border border-slate-200">
                    <input defaultChecked type="checkbox" className="accent-black w-4 h-4" />
                    <span className="font-medium text-slate-900">Anti-Snake Venom (ASV) &amp; Anti-Rabies (400 polyvalent vials)</span>
                  </label>
                  <label className="flex items-center gap-2 bg-slate-100 p-2 cursor-pointer border border-slate-200">
                    <input type="checkbox" className="accent-black w-4 h-4" />
                    <span className="font-medium text-slate-900">Medical Liquid Oxygen D-Type Cylinders (45 units)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-800 mb-1">
                  Authorization Nodal Officer ID:
                </label>
                <input
                  type="text"
                  readOnly
                  value="IAS-BR-MOH-2024-RAMANATHAN"
                  className="w-full bg-slate-100 border border-slate-300 px-2.5 py-1.5 font-mono text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-1.5 cursor-pointer"
              >
                Cancel Override
              </button>
              <button
                onClick={handleExecuteDispatch}
                className="bg-black hover:bg-slate-800 text-white text-xs font-semibold px-4 py-1.5 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Sign &amp; Transmit Green Corridor Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
