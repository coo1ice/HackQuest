import React, { useState } from 'react';
import type { PageId } from '../../types/navigation';
import {
  Truck,
  Radio,
  PlusCircle,
  Satellite,
  Check,
  Thermometer,
  ShieldCheck,
  ArrowRight,
  Phone,
  BatteryCharging,
} from 'lucide-react';

interface ResourceTransferTrackingProps {
  onNavigate: (page: PageId, options?: { stateId?: string; districtName?: string }) => void;
  highlightedShipmentId?: string;
}

interface ShipmentRecord {
  id: string;
  cargo: string;
  category: 'critical' | 'routine' | 'completed';
  priorityBadge: string;
  priorityClass: string;
  origin: string;
  destination: string;
  distance: string;
  vehicle: string;
  driver: string;
  phone: string;
  stage: 1 | 2 | 3 | 4;
  stageText: string;
  eta: string;
  temp: string;
  statusPill: string;
  statusClass: string;
}

const SHIPMENTS: ShipmentRecord[] = [
  {
    id: 'TR-2024-9041',
    cargo: '80 Vials Antivenom (ASV)',
    category: 'critical',
    priorityBadge: 'Emergency Class 1',
    priorityClass: 'bg-red-100 text-red-800 border-red-200',
    origin: 'Patna Central Depot',
    destination: 'Kanti PHC (Muzaffarpur)',
    distance: '64 km via NH-22',
    vehicle: 'Refrig Van BR-01-GB-4421',
    driver: 'Rakesh Kumar',
    phone: '+91 98350 44921',
    stage: 3,
    stageText: 'En Route (NH-22 Bypass)',
    eta: '42 mins (15:55 IST)',
    temp: '+3.4°C',
    statusPill: 'LIVE TRANSIT',
    statusClass: 'bg-sky-100 text-secondary border-sky-300 font-bold',
  },
  {
    id: 'TR-2024-9042',
    cargo: '45 D-Type O₂ Cylinders (46.7L)',
    category: 'critical',
    priorityBadge: 'Emergency Class 1',
    priorityClass: 'bg-red-100 text-red-800 border-red-200',
    origin: 'Guwahati Oxygen Grid Hub',
    destination: 'Majuli River Island CHC',
    distance: '185 km + River Crossing',
    vehicle: 'Barge MV-Lohit / AS-01-P-902',
    driver: 'Bhupen Kalita',
    phone: '+91 94350 11094',
    stage: 3,
    stageText: 'River Crossing Segment',
    eta: '1h 15m (16:30 IST)',
    temp: 'Ambient (Pressurized)',
    statusPill: 'RIVER BARGE TRANSIT',
    statusClass: 'bg-sky-100 text-secondary border-sky-300 font-bold',
  },
  {
    id: 'TR-2024-9038',
    cargo: '5,000 Ceftriaxone 1g Ampoules',
    category: 'critical',
    priorityBadge: 'High Priority',
    priorityClass: 'bg-amber-100 text-amber-800 border-amber-200',
    origin: 'Cuttack Central Medical Depot',
    destination: 'Balasore District Hospital',
    distance: '140 km via NH-16',
    vehicle: 'Medical Transit OD-02-C-8812',
    driver: 'Pradeep Nayak',
    phone: '+91 94370 29381',
    stage: 3,
    stageText: 'Highway Police Escort',
    eta: '2h 05m (17:20 IST)',
    temp: '+18.2°C',
    statusPill: 'LIVE TRANSIT',
    statusClass: 'bg-sky-100 text-secondary border-sky-300 font-bold',
  },
  {
    id: 'TR-2024-9040',
    cargo: '12,000 IV Fluids 0.9% NaCl 500ml',
    category: 'routine',
    priorityBadge: 'Routine Rebalance',
    priorityClass: 'bg-slate-100 text-slate-700 border-slate-300',
    origin: 'Ranchi State Buffer Warehouse',
    destination: 'Gaya District Medical Depot',
    distance: '210 km via NH-20',
    vehicle: 'Heavy Hauler JH-01-RT-201',
    driver: 'Sanjay Oraon',
    phone: '+91 94311 88720',
    stage: 3,
    stageText: 'Interstate Transit',
    eta: '3h 40m (18:55 IST)',
    temp: 'Ambient',
    statusPill: 'IN TRANSIT',
    statusClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  {
    id: 'TR-2024-9035',
    cargo: '200 Polyvalent Antivenom Vials',
    category: 'completed',
    priorityBadge: 'Emergency Class 1',
    priorityClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    origin: 'Jaipur Central Medical Store',
    destination: 'Jodhpur Sadar Hospital',
    distance: '330 km via NH-112',
    vehicle: 'Cold Chain Van RJ-14-EA-4122',
    driver: 'Mahesh Sharma',
    phone: '+91 98290 33412',
    stage: 4,
    stageText: 'Stock Reconciled in Cold ILR',
    eta: 'Delivered (13:40 IST)',
    temp: '+4.1°C',
    statusPill: 'COMPLETED & RECONCILED',
    statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
  },
];

export const ResourceTransferTracking: React.FC<ResourceTransferTrackingProps> = ({
  onNavigate,
  highlightedShipmentId = 'TR-2024-9041',
}) => {
  const [pipelineFilter, setPipelineFilter] = useState<'all' | 'critical' | 'routine' | 'completed'>('all');
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord>(
    SHIPMENTS.find((s) => s.id === highlightedShipmentId) || SHIPMENTS[0]
  );

  const filteredShipments = SHIPMENTS.filter((s) => {
    if (pipelineFilter === 'all') return true;
    return s.category === pipelineFilter;
  });

  return (
    <div className="flex flex-col w-full gap-4 pb-12">
      {/* Pipeline Overview Header Strip */}
      <div className="bg-white border border-slate-300 p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-secondary font-bold">
              National Logistics Dispatch Console
            </span>
            <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-slate-700 font-mono text-[10px]">
              SYS-PIPELINE: ACTIVE
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            National Resource Transit &amp; Dispatch Telemetry
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-mono">
            <span><strong className="text-slate-900">38</strong> Shipments Active</span>
            <span>•</span>
            <span><strong className="text-slate-900">14</strong> Awaiting Approval</span>
            <span>•</span>
            <span><strong className="text-slate-900">19</strong> Dispatched Today</span>
            <span>•</span>
            <span className="text-secondary font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <strong>0</strong> Cold-Chain Excursions
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="inline-flex bg-slate-100 border border-slate-200 p-1 text-xs">
            <button
              onClick={() => setPipelineFilter('all')}
              className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                pipelineFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Active (38)
            </button>
            <button
              onClick={() => setPipelineFilter('critical')}
              className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                pipelineFilter === 'critical' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Critical Supplies (12)
            </button>
            <button
              onClick={() => setPipelineFilter('routine')}
              className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                pipelineFilter === 'routine' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Routine (26)
            </button>
            <button
              onClick={() => setPipelineFilter('completed')}
              className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                pipelineFilter === 'completed' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed (45)
            </button>
          </div>

          <button
            onClick={() => onNavigate('emergency-redistribution')}
            className="bg-black hover:bg-slate-800 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Initiate Rapid Transfer</span>
          </button>
        </div>
      </div>

      {/* Featured Active Transfer Live Stepper Strip */}
      <div className="bg-white border border-slate-300 p-4 sm:p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 gap-3 bg-slate-50 border border-slate-200 p-3">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-secondary shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {selectedShipment.id}: {selectedShipment.cargo}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.2 uppercase border ${selectedShipment.priorityClass}`}>
                  {selectedShipment.priorityBadge}
                </span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="font-semibold text-slate-800">{selectedShipment.origin}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="font-semibold text-slate-800">{selectedShipment.destination}</span>
                <span>• Distance: {selectedShipment.distance}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block">Estimated Touchdown</span>
              <span className="font-mono text-base font-bold text-secondary">{selectedShipment.eta}</span>
            </div>
            <button
              onClick={() => alert('GPS Ping refreshed via NIC transport telemetry gateway.')}
              className="bg-white hover:bg-slate-100 border border-slate-300 p-2 text-slate-700 cursor-pointer"
              title="Refresh Live GPS Ping"
            >
              <Satellite className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4-Stage Stepper Component */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Stage 1 */}
          <div className="bg-slate-50 border border-slate-200 p-3 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center font-mono text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono text-[10px] text-slate-500">STAGE 01</span>
            </div>
            <div className="text-xs font-bold text-slate-900 mt-1">Recommended</div>
            <div className="text-[11px] text-secondary font-medium">Completed: 14:28 IST</div>
            <div className="text-[11px] text-slate-500 leading-snug">
              Automated neural inventory match against acute stockout alert.
            </div>
          </div>

          {/* Stage 2 */}
          <div className="bg-slate-50 border border-slate-200 p-3 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center font-mono text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono text-[10px] text-slate-500">STAGE 02</span>
            </div>
            <div className="text-xs font-bold text-slate-900 mt-1">Approved</div>
            <div className="text-[11px] text-secondary font-medium">Completed: 14:35 IST</div>
            <div className="text-[11px] text-slate-500 leading-snug">
              Sanctioned by Dr. R. V. Ramanathan, IAS (Central Command).
            </div>
          </div>

          {/* Stage 3 */}
          <div className="bg-sky-50 border-2 border-secondary p-3 flex flex-col gap-1 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center font-mono text-xs font-bold animate-pulse">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono text-[10px] font-bold bg-secondary text-white px-1.5 py-0.2">
                LIVE TRANSIT
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 mt-1">Dispatched</div>
            <div className="text-[11px] text-secondary font-bold">Transit initiated: 14:48 IST</div>
            <div className="text-[11px] text-slate-700 leading-snug">
              {selectedShipment.vehicle} en route with verified highway escort.
            </div>
          </div>

          {/* Stage 4 */}
          <div className="bg-slate-50 border border-slate-200 p-3 flex flex-col gap-1 opacity-70">
            <div className="flex items-center justify-between">
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-mono text-xs font-bold">
                4
              </div>
              <span className="font-mono text-[10px] text-slate-500">STAGE 04</span>
            </div>
            <div className="text-xs font-bold text-slate-900 mt-1">Received &amp; Reconciled</div>
            <div className="text-[11px] text-slate-500">Pending Arrival</div>
            <div className="text-[11px] text-slate-500 leading-snug">
              Cold storage receiving bay on-call &amp; inventory pre-cleared.
            </div>
          </div>
        </div>

        {/* Live Telemetry Mini-Panel for Featured Transfer */}
        <div className="bg-slate-50 border border-slate-200 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-700 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-secondary animate-pulse" />
              Continuous Telemetry Stream • {selectedShipment.vehicle}
            </span>
            <span className="text-[11px] font-mono text-slate-500">GPS Refresh: 12s ago</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white border border-slate-200 p-2.5">
              <span className="text-[10px] text-slate-500 uppercase block">Driver in Charge</span>
              <span className="font-bold text-slate-900 truncate block">{selectedShipment.driver}</span>
              <span className="font-mono text-[11px] text-secondary flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" />
                {selectedShipment.phone}
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-2.5">
              <span className="text-[10px] text-slate-500 uppercase block">Live Speed / Corridor</span>
              <span className="font-mono text-base font-bold text-slate-900">52 km/h</span>
              <span className="text-[10px] text-slate-500 block">NH-22 Green Bypass</span>
            </div>

            <div className="bg-white border border-slate-200 p-2.5">
              <span className="text-[10px] text-slate-500 uppercase block">Compartment Temp</span>
              <span className="font-mono text-base font-bold text-secondary flex items-center gap-1">
                <Thermometer className="w-4 h-4 text-secondary" />
                {selectedShipment.temp}
              </span>
              <span className="text-[10px] text-slate-500 block">Target: +2°C to +8°C</span>
            </div>

            <div className="bg-white border border-slate-200 p-2.5">
              <span className="text-[10px] text-slate-500 uppercase block">Vehicle Systems</span>
              <span className="font-mono text-base font-bold text-emerald-700 flex items-center gap-1">
                <BatteryCharging className="w-4 h-4 text-emerald-600" />
                94% Nominal
              </span>
              <span className="text-[10px] text-slate-500 block">Genset Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Shipments Registry Table */}
      <div className="w-full bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-700" />
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900">
              National Dispatch Pipeline Ledger ({filteredShipments.length} Records)
            </h4>
          </div>
          <span className="text-xs text-slate-500">Click any row to display live transit telemetry</span>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-semibold select-none">
              <tr>
                <th className="py-2.5 px-4">Shipment ID &amp; Cargo</th>
                <th className="py-2.5 px-3">Corridor Routing</th>
                <th className="py-2.5 px-3">Vehicle &amp; Operator</th>
                <th className="py-2.5 px-3">Cold Chain</th>
                <th className="py-2.5 px-3">Status Milestone</th>
                <th className="py-2.5 px-3 text-right">ETA</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredShipments.map((s) => {
                const isSelected = selectedShipment.id === s.id;
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedShipment(s)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-sky-50/80 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col font-sans">
                        <span className="font-bold text-slate-900 text-xs">{s.id}</span>
                        <span className="text-[11px] text-slate-600">{s.cargo}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-sans">
                      <div className="flex flex-col text-xs">
                        <span className="text-slate-800">{s.origin}</span>
                        <span className="text-slate-500 text-[11px] flex items-center gap-1">
                          &rarr; {s.destination}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-sans">
                      <div className="flex flex-col text-xs">
                        <span className="text-slate-900 font-medium">{s.vehicle}</span>
                        <span className="text-[11px] text-slate-500">{s.driver}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="font-bold text-secondary">{s.temp}</span>
                    </td>

                    <td className="py-2.5 px-3 font-sans">
                      <span className={`text-[10px] px-2 py-0.5 border ${s.statusClass}`}>
                        {s.statusPill}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {s.eta}
                    </td>

                    <td className="py-2.5 px-4 text-right font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShipment(s);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-[11px] font-semibold px-2 py-1 transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
