import React, { useState } from 'react';
import type { PageId } from '../../types/navigation';
import {
  Gavel,
  CheckCircle2,
  AlertTriangle,
  Truck,
  ShieldCheck,
  SlidersHorizontal,
  X,
  Navigation,
  Check,
  RefreshCw,
} from 'lucide-react';

interface EmergencyRedistributionProps {
  onNavigate: (page: PageId, options?: { stateId?: string; shipmentId?: string }) => void;
  targetFacilityName?: string;
}

export const EmergencyRedistribution: React.FC<EmergencyRedistributionProps> = ({
  onNavigate,
  targetFacilityName = 'Kanti PHC (Muzaffarpur)',
}) => {
  const [attested, setAttested] = useState<boolean>(false);
  const [vialQty, setVialQty] = useState<number>(80);
  const [showQtyDrawer, setShowQtyDrawer] = useState<boolean>(false);
  const [showRejectDrawer, setShowRejectDrawer] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('1');

  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [signTimestamp, setSignTimestamp] = useState<string>('');

  const handleAdjustQty = (delta: number) => {
    setVialQty((prev) => Math.max(10, Math.min(160, prev + delta)));
  };

  const handleExecuteApproval = () => {
    if (!attested) return;
    setIsBroadcasting(true);
    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST';
      setSignTimestamp(timeStr);
      setIsBroadcasting(false);
      setShowSuccessModal(true);
    }, 900);
  };

  return (
    <div className="flex flex-col w-full gap-4 pb-12">
      {/* Mission Command Notification Ticker */}
      <div className="w-full bg-slate-900 text-white py-2 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse"></span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-sky-200">
            National Triage Directive Active
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-xs text-slate-300 font-mono">
            Incident Code: <strong className="text-white">BIH-FLOOD-2024-V3</strong>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-300 font-mono">
          <span>Enforcement Node: DL-NIC-OPS-09</span>
          <span className="bg-black text-white px-2 py-0.5 uppercase tracking-wider text-[10px] font-bold border border-slate-700">
            Statutory Power: NDMA Sec 38
          </span>
        </div>
      </div>

      {/* Header Block: Legal Authority & Directive Identification */}
      <div className="w-full bg-white border border-slate-300 p-4 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Priority 1 • Immediate Reallocation
              </span>
              <span className="text-xs text-slate-500 font-mono">Requisition Ref: REG-REQ-2024-8831</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Transfer Directive #EMERG-REDIST-2024-0892
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              Issued under the statutory authority of the{' '}
              <strong className="text-slate-900">National Disaster Management Act, 2005</strong> (Health Resources Annexure IV).
              Execution is binding upon both sending and receiving medical administrations.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 flex flex-col gap-1.5 lg:w-80 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 uppercase text-[10px] font-semibold">Target Supply:</span>
              <span className="font-mono font-bold text-secondary">Polyvalent Snake Antivenom</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 uppercase text-[10px] font-semibold">Formulation:</span>
              <span className="font-mono text-slate-800">Liquid 10ml Vial</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
              <span className="text-error uppercase text-[10px] font-bold">Recommended Transfer:</span>
              <span className="font-mono font-bold text-base text-error">{vialQty} Vials</span>
            </div>
          </div>
        </div>
      </div>

      {/* Centerpiece Corridor Visualizer: Origin to Destination */}
      <div className="bg-white border border-slate-300 p-4 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-secondary" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Tactical Transit Corridor Telemetry
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">GPS Cold-Chain Route Verified via NH-22</span>
        </div>

        {/* Linear Route Ribbon */}
        <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
          {/* Origin Summary Chip */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold font-mono text-lg shrink-0">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Donor Depot</span>
              <span className="text-sm font-bold text-slate-900">Patna Civil Warehouse</span>
              <span className="text-xs text-slate-500">District: Patna (HQ)</span>
            </div>
          </div>

          {/* Animated Transit Vector */}
          <div className="flex-1 w-full flex flex-col items-center gap-1 px-4">
            <div className="flex items-center justify-between w-full text-xs font-mono text-slate-600 mb-1">
              <span className="text-secondary font-bold">Route: via NH-22 Bypass</span>
              <span className="bg-slate-200 px-2 py-0.5 text-slate-900 font-bold text-[11px]">
                EST. 1h 20m • 64 KM
              </span>
              <span className="text-secondary font-bold">Temp Range: +2°C to +8°C</span>
            </div>

            <div className="w-full relative h-3 bg-slate-200 flex items-center">
              <div className="h-full bg-secondary w-full"></div>
              <div className="absolute left-1/2 -translate-x-1/2 w-6 h-6 bg-secondary text-white rounded-full flex items-center justify-center shadow-md">
                <Navigation className="w-3.5 h-3.5 transform rotate-45" />
              </div>
            </div>

            <div className="flex items-center justify-between w-full text-[11px] text-slate-500 mt-1">
              <span>Disaster Relief Escort: Dedicated Squad 4</span>
              <span className="text-error font-medium">Clear Corridor: High Water Warning Active</span>
            </div>
          </div>

          {/* Deficit Summary Chip */}
          <div className="flex items-center gap-3 w-full md:w-auto md:text-right flex-row-reverse md:flex-row">
            <div className="flex flex-col">
              <span className="text-[10px] text-error uppercase font-bold">Recipient Point</span>
              <span className="text-sm font-bold text-slate-900">{targetFacilityName}</span>
              <span className="text-xs text-slate-500">District: Muzaffarpur</span>
            </div>
            <div className="w-10 h-10 bg-error text-white flex items-center justify-center font-bold font-mono text-lg shrink-0">
              B
            </div>
          </div>
        </div>

        {/* Side-By-Side Facility Operational Diagnostic Ledgers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          {/* SURPLUS / DONOR FACILITY PROFILE */}
          <div className="bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="bg-black text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  Donor Facility (Surplus Tier)
                </span>
                <span className="font-mono text-xs text-secondary font-semibold">NIC-ID: PAT-99201-CENTRAL</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Patna Civil Warehouse &amp; Medical Depot</h4>
                <p className="text-xs text-slate-500">State Central Logistics Depot, Gulzarbagh, Patna</p>
              </div>
            </div>

            {/* Diagnostic Metrics */}
            <div className="grid grid-cols-2 gap-2 bg-white border border-slate-200 p-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Current On-Hand Holding</span>
                <span className="font-mono text-lg font-bold text-slate-900">
                  340 <span className="text-xs font-normal text-slate-500">vials</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Avg. Monthly Burn Rate</span>
                <span className="font-mono text-lg font-bold text-slate-900">
                  35 <span className="text-xs font-normal text-slate-500">vials/mo</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Post-Transfer Remaining</span>
                <span className="font-mono text-lg font-bold text-secondary">
                  {340 - vialQty} <span className="text-xs font-normal text-slate-500">vials</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Residual Safety Run-rate</span>
                <span className="font-mono text-lg font-bold text-secondary">
                  {Math.round(((340 - vialQty) / 35) * 30)} <span className="text-xs font-normal text-slate-500">Days Cover</span>
                </span>
              </div>
            </div>

            {/* Batch Ledger */}
            <div className="bg-slate-100 border border-slate-200 p-2.5 flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase text-[10px]">Consignment Lot:</span>
                <span className="font-mono font-bold text-slate-900">Batch #AV-2023-88</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase text-[10px]">Lot Expiry:</span>
                <span className="font-mono text-slate-800">14 Nov 2025 (410 days remaining)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase text-[10px]">Cold Storage:</span>
                <span className="font-mono text-slate-800">Vault #4 • Chamber B (Continuous Sensor Log)</span>
              </div>
            </div>

            {/* Counterpart Profile */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">Dr. S. K. Verma</span>
                <span className="text-[11px] text-slate-500">Chief Medical Officer, Patna Depot</span>
              </div>
              <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 uppercase">
                Contacted &amp; Standby
              </span>
            </div>
          </div>

          {/* DEFICIT / RECIPIENT FACILITY PROFILE */}
          <div className="bg-red-50/50 border border-red-200 p-4 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="bg-error text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  Deficit Facility (Critical Triage)
                </span>
                <span className="font-mono text-xs text-error font-semibold">NIC-ID: MUZ-44102-RURAL</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{targetFacilityName}</h4>
                <p className="text-xs text-slate-500">Block Health Unit, Muzaffarpur Flood Zone 2</p>
              </div>
            </div>

            {/* Critical Diagnostic Metrics */}
            <div className="grid grid-cols-2 gap-2 bg-white border border-red-200 p-3">
              <div>
                <span className="text-[10px] text-error uppercase block font-semibold">Active Inventory Remaining</span>
                <span className="font-mono text-lg font-bold text-error">
                  04 <span className="text-xs font-normal text-slate-500">vials left</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-error uppercase block font-semibold">Predicted Zero-Stockout</span>
                <span className="font-mono text-lg font-bold text-error">
                  14 <span className="text-xs font-normal text-slate-500">Hours (Est. 04:30)</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Observed Clinical Load</span>
                <span className="font-mono text-lg font-bold text-slate-900">
                  03 <span className="text-xs font-normal text-slate-500">Active Admissions</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Projected 24h Demand</span>
                <span className="font-mono text-lg font-bold text-slate-900">
                  6–10 <span className="text-xs font-normal text-slate-500">vials/day</span>
                </span>
              </div>
            </div>

            {/* Active Crisis Assessment */}
            <div className="bg-white border border-red-200 p-2.5 flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase text-[10px]">Clinical Urgency:</span>
                <span className="font-mono font-bold text-error">Neurotoxic Envenomation (Bungarus caeruleus)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase text-[10px]">Requisition Filed:</span>
                <span className="font-mono text-slate-800">Today, 14:12 IST (17 mins elapsed)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase text-[10px]">Regional Cold Link:</span>
                <span className="font-mono text-secondary font-semibold">ILR Active (Generator Backup Verified)</span>
              </div>
            </div>

            {/* Counterpart Profile */}
            <div className="flex items-center justify-between pt-1 border-t border-red-200">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">Dr. Meenakshi Sundaram</span>
                <span className="text-[11px] text-slate-500">Medical Officer in Charge (MOIC), Kanti PHC</span>
              </div>
              <span className="bg-red-100 text-red-800 border border-red-200 text-[10px] font-bold px-2 py-0.5 uppercase">
                Awaiting Allocation
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Algorithmic Match Reasoning Matrix (Transparent Optimization Ledger) */}
      <div className="bg-white border border-slate-300 p-4 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Optimization Engine Matching Rationale</h3>
            <p className="text-xs text-slate-500">
              NHRM Algorithmic Dispatch Model v4.2 • Deterministic Evaluation across 14 Regional Nodes
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-secondary" />
            <span>Zero Regional Depletion Violation Confirmed</span>
          </div>
        </div>

        {/* Comparative Matrix Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
                <th className="py-2.5 px-3">Evaluation Vector</th>
                <th className="py-2.5 px-3">Patna Depot (Selected)</th>
                <th className="py-2.5 px-3">Darbhanga CHC (Evaluated)</th>
                <th className="py-2.5 px-3">Begusarai Depot (Evaluated)</th>
                <th className="py-2.5 px-3">Algorithmic Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr className="bg-white">
                <td className="py-2 px-3 font-sans font-medium text-slate-900">Transit Distance &amp; Time</td>
                <td className="py-2 px-3 font-bold text-secondary">64 km (1h 20m)</td>
                <td className="py-2 px-3 text-slate-500">82 km (2h 10m)</td>
                <td className="py-2 px-3 text-slate-500">110 km (3h 25m)</td>
                <td className="py-2 px-3 font-sans text-slate-700">
                  <span className="text-secondary font-bold">Fastest highway routing</span> via non-submerged NH-22
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td className="py-2 px-3 font-sans font-medium text-slate-900">Donor Surplus Integrity</td>
                <td className="py-2 px-3 font-bold text-slate-900">0.0% Deficit Risk</td>
                <td className="py-2 px-3 text-error font-bold">Severe Residual Strain</td>
                <td className="py-2 px-3 text-slate-600">Nominal Strain (18% draw)</td>
                <td className="py-2 px-3 font-sans text-slate-700">Patna maintains 7.4 months reserve post-dispatch</td>
              </tr>
              <tr className="bg-white">
                <td className="py-2 px-3 font-sans font-medium text-slate-900">Available Unit Batch Expiry</td>
                <td className="py-2 px-3 font-bold text-slate-900">410 Days (Nov 2025)</td>
                <td className="py-2 px-3 text-slate-500">88 Days (Critical short shelf)</td>
                <td className="py-2 px-3 text-slate-500">610 Days (Over-reserved tier)</td>
                <td className="py-2 px-3 font-sans text-slate-700">Meets optimal therapeutic utility window</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="py-2 px-3 font-sans font-medium text-slate-900">Net Reallocation Impact</td>
                <td className="py-2 px-3 font-bold text-secondary">{vialQty} Vials Full Fill</td>
                <td className="py-2 px-3 text-slate-500">20 Vials (Deficit remains)</td>
                <td className="py-2 px-3 text-slate-500">80 Vials (Full Fill)</td>
                <td className="py-2 px-3 font-sans text-slate-700">Secures 12 days continuous cover for Kanti PHC</td>
              </tr>
              <tr className="bg-white">
                <td className="py-2 px-3 font-sans font-medium text-slate-900">Recommendation Verdict</td>
                <td className="py-2 px-3 font-sans">
                  <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 uppercase">
                    Optimal Pair
                  </span>
                </td>
                <td className="py-2 px-3 font-sans">
                  <span className="text-error text-[10px] font-bold uppercase">Rejected (Capacity)</span>
                </td>
                <td className="py-2 px-3 font-sans">
                  <span className="text-error text-[10px] font-bold uppercase">Rejected (Latency)</span>
                </td>
                <td className="py-2 px-3 font-sans text-secondary font-bold">Candidate match selected by primary pass</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* The Legal Sign-Off Command Terminal */}
      <div className="bg-white border border-slate-300 p-4 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Central Authorization Desk
              </span>
              <h3 className="text-base font-bold text-slate-900">Legal Endorsement &amp; Allocation Execution</h3>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-2.5 flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-sans">Authorizing Official</span>
              <span className="font-bold text-slate-900">Dr. R. V. Ramanathan, IAS</span>
              <span className="text-[10px] text-slate-500 block font-sans">Joint Secretary • Central Officer</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-sans">Encrypted Token</span>
              <span className="font-bold text-secondary">MOHFW-AUTH-88219-SEC</span>
              <span className="text-[10px] text-slate-500 block font-sans">Digital Signature Pre-Validated</span>
            </div>
          </div>
        </div>

        {/* Statutory Declaration Affirmation Checkbox */}
        <div className="bg-slate-50 border border-slate-200 p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <input
              id="statutory-attest"
              type="checkbox"
              checked={attested}
              onChange={(e) => setAttested(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-black cursor-pointer shrink-0"
            />
            <label htmlFor="statutory-attest" className="text-xs text-slate-800 leading-relaxed cursor-pointer select-none">
              <strong>Statutory Officer Declaration:</strong> I hereby certify that the surplus assessment for Patna Civil Depot has been verified against live sub-district surveillance logs. I verify that donor buffer stock exceeds mandatory regional reserve thresholds (72 days remaining vs 45 days statutory minimum), and authorize immediate dispatch under police escort to Kanti PHC.
            </label>
          </div>

          {/* Quantity Adjuster Drawer */}
          {showQtyDrawer && (
            <div className="bg-white border border-slate-300 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-secondary" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Modify Allocation Unit Count</div>
                  <div className="text-[11px] text-slate-500">Recommended default: 80 vials. Altering requires recorded justification.</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAdjustQty(-10)}
                  className="w-8 h-8 bg-slate-100 border border-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  -10
                </button>
                <input
                  type="number"
                  value={vialQty}
                  onChange={(e) => setVialQty(Number(e.target.value))}
                  className="w-20 h-8 text-center font-mono font-bold text-sm bg-slate-50 border border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => handleAdjustQty(10)}
                  className="w-8 h-8 bg-slate-100 border border-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  +10
                </button>
                <span className="text-xs text-slate-500 uppercase font-semibold ml-1">Vials</span>
              </div>
            </div>
          )}

          {/* Rejection Reason Drawer */}
          {showRejectDrawer && (
            <div className="bg-red-50 border border-red-200 p-3 flex flex-col gap-2 animate-fade-in">
              <div className="flex items-center gap-2 text-red-900 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-error" />
                <span>Mandatory Rejection Filing</span>
              </div>
              <p className="text-xs text-slate-700">State the formal objection code to abort the algorithmic reallocation directive:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <label className="flex items-center gap-2 p-2 bg-white border border-red-200 cursor-pointer">
                  <input
                    type="radio"
                    name="reject-reason"
                    value="1"
                    checked={rejectReason === '1'}
                    onChange={() => setRejectReason('1')}
                    className="accent-error"
                  />
                  <span>Donor buffer insufficient</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white border border-red-200 cursor-pointer">
                  <input
                    type="radio"
                    name="reject-reason"
                    value="2"
                    checked={rejectReason === '2'}
                    onChange={() => setRejectReason('2')}
                    className="accent-error"
                  />
                  <span>Alternative route preferred</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white border border-red-200 cursor-pointer">
                  <input
                    type="radio"
                    name="reject-reason"
                    value="3"
                    checked={rejectReason === '3'}
                    onChange={() => setRejectReason('3')}
                    className="accent-error"
                  />
                  <span>Requisition retracted by PHC</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectDrawer(false)}
                  className="px-3 py-1 bg-white border border-slate-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Directive formally rejected. Alert broadcast to National Surveillance Center.');
                    setShowRejectDrawer(false);
                  }}
                  className="px-3 py-1 bg-error text-white text-xs font-bold uppercase cursor-pointer"
                >
                  Confirm Rejection &amp; Alert Field
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Button Terminal */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setShowQtyDrawer(!showQtyDrawer)}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Modify Transfer Quantity</span>
            </button>
            <button
              type="button"
              onClick={() => setShowRejectDrawer(!showRejectDrawer)}
              className="bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-300 text-slate-800 text-xs font-semibold px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject Directive</span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            {isBroadcasting && (
              <div className="text-secondary text-xs font-semibold flex items-center gap-1.5 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-secondary" />
                <span>Broadcasting transit dispatch via NIC...</span>
              </div>
            )}

            <button
              type="button"
              disabled={!attested || isBroadcasting}
              onClick={handleExecuteApproval}
              className="w-full lg:w-auto px-6 py-2.5 bg-black text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Approve Transfer &amp; Issue Transit Order</span>
            </button>
          </div>
        </div>

        {/* Audit & Telemetry Footer */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5 font-sans">
            <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
            <span>Generated automatically by NHRM Allocation Engine v4.2 based on IoT telemetry and live bed admissions.</span>
          </div>
          <div className="flex items-center gap-3">
            <span>LATENCY: 42ms</span>
            <span>•</span>
            <span>NODE: BIH-SEC-CENTRAL</span>
          </div>
        </div>
      </div>

      {/* Operational Confirmation Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center shrink-0">
                <Check className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-[10px] text-secondary uppercase font-bold tracking-wider">
                  Transit Order Broadcast Successful
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Directive #EMERG-REDIST-2024-0892 Enacted
                </h3>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Transit Manifest Number:</span>
                <span className="font-mono font-bold text-slate-900">MNF-2024-PAT-KNT-091</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Cold-Chain Vehicle:</span>
                <span className="font-mono font-bold text-slate-900">BR-01-GA-9104 (Driver: R. Mandal)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Authorizing Timestamp:</span>
                <span className="font-mono text-slate-900">{signTimestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient ETA:</span>
                <span className="font-mono font-bold text-secondary">16:15 IST (Today)</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              SMS and NIC satellite dispatches have been transmitted to CMO Patna and MOIC Kanti PHC. Bihar Highway Patrol notified for priority green corridor clearance.
            </p>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  onNavigate('inter-district-transfer-tracking', { shipmentId: 'TR-2024-9041' });
                }}
                className="px-4 py-2 bg-secondary hover:bg-sky-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Track Active Transfer in Real-Time &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  onNavigate('national-overview');
                }}
                className="px-4 py-2 bg-black text-white hover:bg-slate-800 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Return to National Overview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
