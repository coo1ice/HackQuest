import React, { useState, useEffect } from 'react';
import type { PageId } from '../../types/navigation';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  RefreshCw,
  Send,
  BellRing,
  Check,
  Truck,
} from 'lucide-react';

interface UrgentAlertFeedProps {
  onNavigate: (page: PageId, options?: { stateId?: string; districtName?: string; facilityName?: string }) => void;
}

interface AlertItem {
  id: string;
  facilityCode: string;
  facilityName: string;
  facilityTier: string;
  district: string;
  state: string;
  stateId: string;
  zone: 'eastern' | 'northern' | 'northeastern' | 'western' | 'southern';
  category: 'medicines' | 'oxygen' | 'beds' | 'staff';
  severity: 'critical' | 'warning' | 'staff';
  title: string;
  badgeTag: string;
  timeRemaining: string;
  depletionNote: string;
  bufferText: string;
  bufferSub: string;
  clinicalLoad: string;
  clinicalSub: string;
  telemetrySource: string;
  telemetrySub: string;
  recommendationTitle: string;
  recommendationText: string;
  donorBufferText: string;
  timestampText: string;
  acknowledged?: boolean;
}

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'ALT-BR-01',
    facilityCode: 'BR-MUZ-012',
    facilityName: 'Kanti PHC',
    facilityTier: 'Primary Health Centre',
    district: 'Muzaffarpur',
    state: 'Bihar',
    stateId: 'INBR',
    zone: 'eastern',
    category: 'medicines',
    severity: 'critical',
    title: 'Snake Venom Antivenom (ASVS 10ml vials)',
    badgeTag: 'Cold Chain (2°C - 8°C)',
    timeRemaining: 'T - 14h 00m',
    depletionNote: 'Zero stock projected at 04:30 IST',
    bufferText: '4 vials remaining',
    bufferSub: 'Avg. 24h burn: 6 vials/day',
    clinicalLoad: 'Monsoon Surge: +3 bites today',
    clinicalSub: 'Cluster: Flood-affected agrarian zone',
    telemetrySource: 'IoT RFID Cabinet Active',
    telemetrySub: 'Last sensor ping: 6 mins ago',
    recommendationTitle: 'Automated Logistics Recommendation',
    recommendationText: 'Redistribution match ready: 40 vials available from Patna Medical College (64 km away • Est. transit 1h 45m via NH-22).',
    donorBufferText: '142 vials (Sufficient: 19 days)',
    timestampText: '14:28 IST (6 mins ago)',
  },
  {
    id: 'ALT-AS-02',
    facilityCode: 'AS-MAJ-002',
    facilityName: 'Majuli River Island CHC',
    facilityTier: 'Community Health Centre',
    district: 'Majuli',
    state: 'Assam',
    stateId: 'INAS',
    zone: 'northeastern',
    category: 'oxygen',
    severity: 'critical',
    title: 'Liquid Medical Oxygen (Cylinder Type D - 46.7L)',
    badgeTag: 'High-Pressure Gas',
    timeRemaining: 'T - 22h 00m',
    depletionNote: 'Critical threshold: 12:30 IST tomorrow',
    bufferText: '6 cylinders manifold remaining',
    bufferSub: 'Manifold pressure: 4.2 bar (Deficit)',
    clinicalLoad: '14 Acute Respiratory Distress Cases',
    clinicalSub: 'Flood relief camp secondary clinic',
    telemetrySource: 'Digital Manifold Transducer',
    telemetrySub: 'Continuous telemetry ping active',
    recommendationTitle: 'Automated Inter-District Vessel Match',
    recommendationText: 'River barge air-cushion transport from Jorhat Medical College (22 km river crossing • Est. transit 2h 10m).',
    donorBufferText: '54 cylinders ready at Jorhat',
    timestampText: '14:15 IST (19 mins ago)',
  },
  {
    id: 'ALT-OD-03',
    facilityCode: 'OD-BAL-001',
    facilityName: 'Balasore District Hospital',
    facilityTier: 'District Hospital',
    district: 'Balasore',
    state: 'Odisha',
    stateId: 'INOR',
    zone: 'eastern',
    category: 'medicines',
    severity: 'critical',
    title: 'Broad-spectrum Cephalosporins & Tetanus Toxoid',
    badgeTag: 'Surgical Emergency',
    timeRemaining: 'T - 31h 30m',
    depletionNote: 'Stockout anticipated: 21:00 IST tomorrow',
    bufferText: '180 ampoules remaining',
    bufferSub: 'Daily consumption: 85 ampoules/day',
    clinicalLoad: 'Cyclone Aftermath Trauma Spikes',
    clinicalSub: '18 coastal evacuation centres linked',
    telemetrySource: 'Barcode Automated Dispensary',
    telemetrySub: 'Synced 11m ago via NIC gateway',
    recommendationTitle: 'Green Corridor Road Dispatch',
    recommendationText: 'Dispatch from Cuttack Central Medical Depot (140 km via NH-16 • Police escort transit 2h 45m).',
    donorBufferText: '820 ampoules available at Cuttack',
    timestampText: '14:02 IST (32 mins ago)',
  },
  {
    id: 'ALT-BR-04',
    facilityCode: 'BR-DAR-005',
    facilityName: 'Darbhanga Medical College & Hospital',
    facilityTier: 'Tertiary Medical College',
    district: 'Darbhanga',
    state: 'Bihar',
    stateId: 'INBR',
    zone: 'eastern',
    category: 'beds',
    severity: 'warning',
    title: 'Pediatric Intensive Care Isolation Beds (PICU)',
    badgeTag: 'Critical Care Infrastructure',
    timeRemaining: 'T - 08h 30m',
    depletionNote: 'Full bed saturation imminent',
    bufferText: '1 PICU bed open (49/50 occupied)',
    bufferSub: 'Saturation index: 98%',
    clinicalLoad: 'Acute Encephalitis Syndrome (AES)',
    clinicalSub: 'Seasonal vector transmission peak',
    telemetrySource: 'Central HMIS Bed Ledger',
    telemetrySub: 'Real-time census telemetry',
    recommendationTitle: 'Regional Patient Triage Diversion',
    recommendationText: 'Divert non-ventilated admissions to Samastipur Sadar Hospital; transfer acute ventilator cases to AIIMS Patna.',
    donorBufferText: '12 open beds at AIIMS Patna',
    timestampText: '13:50 IST (44 mins ago)',
  },
];

export const UrgentAlertFeed: React.FC<UrgentAlertFeedProps> = ({ onNavigate }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'staff'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  // Auto-refresh countdown simulation
  const [countdown, setCountdown] = useState<number>(58);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleAcknowledge = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: !a.acknowledged } : a))
    );
  };

  const handleNotifyOfficer = (facility: string) => {
    alert(`Emergency broadcast SMS & notification sent to District Surveillance Officer for ${facility}.`);
  };

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    if (zoneFilter !== 'all' && a.zone !== zoneFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col w-full gap-4 pb-12">
      {/* Top Alert Console Strip */}
      <div className="w-full bg-white border border-slate-300 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 bg-slate-50 border border-slate-200 p-3 sm:p-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-error inline-block animate-ping rounded-full"></span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-tight">
                National Real-Time Alert Feed
              </h2>
              <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                Surveillance Grid Active
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-mono">
              <span className="flex items-center gap-1 text-error font-bold">
                <AlertOctagon className="w-4 h-4 text-error" />
                47 Critical Alerts (&lt;48h)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-900 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                82 Warning Alerts (48-96h)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-secondary font-medium">
                <CheckCircle2 className="w-4 h-4 text-secondary" />
                0 Unacknowledged System Failures
              </span>
              <span className="hidden xl:inline">•</span>
              <span className="hidden xl:inline text-slate-500 font-normal">NIC Stream ID: #IN-EVT-8942-A</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center">
            <div className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-1.5 shadow-2xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
              </span>
              <span className="text-xs text-slate-800 uppercase tracking-wide">
                Auto-refresh: <strong className="font-mono">{countdown}s</strong>
              </span>
            </div>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume Feed' : 'Hold Feed'}</span>
            </button>

            <button
              onClick={() => {
                setCountdown(60);
                alert('Telemetry feed synchronized with national NIC pipeline.');
              }}
              className="bg-black hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Telemetry</span>
            </button>
          </div>
        </div>

        {/* Severity & Multi-axis Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 uppercase font-semibold mr-1">Severity:</span>
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                severityFilter === 'all'
                  ? 'bg-black text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              All (129)
            </button>
            <button
              onClick={() => setSeverityFilter('critical')}
              className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                severityFilter === 'critical'
                  ? 'bg-error text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Critical (&lt;48h Stockout)
            </button>
            <button
              onClick={() => setSeverityFilter('warning')}
              className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                severityFilter === 'warning'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Warning (48-96h)
            </button>
            <button
              onClick={() => setSeverityFilter('staff')}
              className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                severityFilter === 'staff'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Staffing Deficit (14)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 border border-slate-200 px-2 py-1 text-xs">
              <label className="text-slate-500 mr-1.5 text-[11px] uppercase font-semibold">Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-slate-900 font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Categories</option>
                <option value="medicines">Medicines &amp; Vaccines</option>
                <option value="oxygen">Medical Oxygen</option>
                <option value="beds">Beds &amp; Isolation</option>
                <option value="staff">Clinical Staff</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-100 border border-slate-200 px-2 py-1 text-xs">
              <label className="text-slate-500 mr-1.5 text-[11px] uppercase font-semibold">Zone:</label>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="bg-transparent text-slate-900 font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All India (36 States/UTs)</option>
                <option value="eastern">Eastern Zone (Bihar, Odisha, WB)</option>
                <option value="northern">Northern Zone (UP, Delhi, Punjab)</option>
                <option value="northeastern">North Eastern Zone (Assam, Mizoram)</option>
                <option value="western">Western Zone (Rajasthan, Gujarat)</option>
                <option value="southern">Southern Zone (TN, Kerala, AP)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Stream Feed Items */}
      <div className="flex flex-col gap-4">
        {filteredAlerts.map((alertItem) => {
          const isCritical = alertItem.severity === 'critical';
          const isAck = alertItem.acknowledged;

          return (
            <div
              key={alertItem.id}
              className={`bg-white border border-slate-300 shadow-sm overflow-hidden transition-all ${
                isAck ? 'opacity-40 grayscale-30' : ''
              }`}
            >
              <div className="flex flex-col lg:flex-row">
                {/* Left accent color bar */}
                <div
                  className={`w-full lg:w-2 self-stretch shrink-0 ${
                    isCritical ? 'bg-error' : alertItem.severity === 'warning' ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                ></div>

                {/* Main Card Content */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between gap-4">
                  {/* Top Header of Card */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border ${
                            isCritical
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isCritical ? 'Critical Stockout' : 'Depletion Warning'}
                        </span>
                        <span className="bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px] font-bold px-1.5 py-0.5">
                          {alertItem.facilityCode}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{alertItem.facilityTier}</span>
                        <span className="text-slate-300">•</span>
                        <button
                          onClick={() => onNavigate('state-district-drill-down', { stateId: alertItem.stateId })}
                          className="text-xs font-semibold text-slate-700 hover:text-black underline cursor-pointer"
                        >
                          {alertItem.facilityName} • {alertItem.district}, {alertItem.state}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                          {alertItem.title}
                        </h3>
                        <span className="bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-semibold px-2 py-0.5">
                          {alertItem.badgeTag}
                        </span>
                      </div>
                    </div>

                    {/* Depletion Clock Tile */}
                    <div className="flex items-center lg:flex-col lg:items-end gap-2 bg-red-50 border border-red-200 p-3 shrink-0">
                      <span className="text-[10px] text-red-800 uppercase tracking-wider font-bold">
                        Depletion Clock
                      </span>
                      <div className="font-mono text-base sm:text-lg text-error font-bold flex items-center gap-1">
                        <Clock className="w-4 h-4 text-error" />
                        <span>{alertItem.timeRemaining}</span>
                      </div>
                      <span className="text-[10px] text-red-700 font-medium">{alertItem.depletionNote}</span>
                    </div>
                  </div>

                  {/* 3-Column Diagnostic Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 p-3 text-xs">
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[10px] uppercase font-semibold">Current Buffer</span>
                      <span className="font-mono text-sm font-bold text-error mt-0.5">{alertItem.bufferText}</span>
                      <span className="text-slate-500 text-[11px]">{alertItem.bufferSub}</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[10px] uppercase font-semibold">Clinical Load Surge</span>
                      <span className="text-slate-900 font-semibold mt-0.5">{alertItem.clinicalLoad}</span>
                      <span className="text-slate-500 text-[11px]">{alertItem.clinicalSub}</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[10px] uppercase font-semibold">Telemetry Reliability</span>
                      <span className="text-secondary font-medium mt-0.5 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                        <span>{alertItem.telemetrySource}</span>
                      </span>
                      <span className="text-slate-500 text-[11px]">{alertItem.telemetrySub}</span>
                    </div>
                  </div>

                  {/* Automated Logistics Recommendation Strip */}
                  <div className="bg-sky-50/70 border border-sky-200 p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2">
                      <Truck className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold uppercase text-secondary tracking-wider">
                          {alertItem.recommendationTitle}
                        </span>
                        <p className="text-slate-800 mt-0.5 leading-relaxed">{alertItem.recommendationText}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 uppercase block">Donor Buffer Post-Dispatch:</span>
                      <span className="font-mono font-bold text-slate-900">{alertItem.donorBufferText}</span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{alertItem.timestampText}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Open Redistribution Approval Button */}
                      <button
                        onClick={() =>
                          onNavigate('emergency-redistribution', {
                            stateId: alertItem.stateId,
                            districtName: alertItem.district,
                            facilityName: alertItem.facilityName,
                          })
                        }
                        className="bg-black hover:bg-slate-800 text-white font-semibold px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Open Redistribution Approval</span>
                      </button>

                      <button
                        onClick={() => handleNotifyOfficer(alertItem.facilityName)}
                        className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-medium px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <BellRing className="w-3.5 h-3.5 text-slate-600" />
                        <span>Notify District Officer</span>
                      </button>

                      <button
                        onClick={() => handleAcknowledge(alertItem.id)}
                        className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-2.5 py-1.5 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Mark as acknowledged in shift log"
                      >
                        <Check className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isAck ? 'Acknowledged' : 'Acknowledge'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
