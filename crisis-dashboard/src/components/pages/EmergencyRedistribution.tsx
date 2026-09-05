import React, { useState, useEffect, useCallback } from 'react';
import type { PageId } from '../../types/navigation';
import {
  getRedistributionRecommendations,
  getRedistributionDetail,
  approveRedistribution,
  rejectRedistribution,
} from '../../api/endpoints';
import type { RedistributionRecommendationResponse, TransferResponse } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import {
  Gavel,
  AlertTriangle,
  Truck,
  ShieldCheck,
  X,
  Navigation,
  Check,
  RefreshCw,
} from 'lucide-react';

interface EmergencyRedistributionProps {
  onNavigate: (page: PageId, options?: { stateId?: string; shipmentId?: string; transferId?: number }) => void;
  targetFacilityName?: string;
  directiveId?: number;
}

export const EmergencyRedistribution: React.FC<EmergencyRedistributionProps> = ({
  onNavigate,
  targetFacilityName,
  directiveId,
}) => {
  const { user } = useAuth();

  const [recommendation, setRecommendation] = useState<RedistributionRecommendationResponse | null>(null);
  const [recommendationsList, setRecommendationsList] = useState<RedistributionRecommendationResponse[]>([]);
  const [attested, setAttested] = useState<boolean>(false);
  const [showRejectDrawer, setShowRejectDrawer] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('Donor buffer needed for localized spike');

  // Async states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Success modal
  const [approvedTransfer, setApprovedTransfer] = useState<TransferResponse | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [signTimestamp, setSignTimestamp] = useState<string>('');

  const loadRecommendation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (directiveId) {
        const rec = await getRedistributionDetail(directiveId);
        setRecommendation(rec);
        setRecommendationsList([rec]);
      } else {
        const effectiveStateId = user?.role === 'state_officer' ? user.scope_id : undefined;
        const list = await getRedistributionRecommendations('pending', effectiveStateId);
        if (list && list.length > 0) {
          setRecommendationsList(list);
          setRecommendation((prev) => (prev && list.some((r) => r.id === prev.id) ? prev : list[0]));
        } else {
          // If no pending, fetch all recommendations for this state jurisdiction
          const allList = await getRedistributionRecommendations(undefined, effectiveStateId);
          setRecommendationsList(allList);
          if (allList && allList.length > 0) {
            setRecommendation((prev) => (prev && allList.some((r) => r.id === prev.id) ? prev : allList[0]));
          } else {
            setRecommendation(null);
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve allocation directive details from the optimization server.');
    } finally {
      setIsLoading(false);
    }
  }, [directiveId, user?.role, user?.scope_id]);

  useEffect(() => {
    loadRecommendation();
  }, [loadRecommendation]);

  const handleExecuteApproval = async () => {
    if (!attested || !recommendation) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const transferRes = await approveRedistribution(recommendation.id);
      setApprovedTransfer(transferRes);
      const now = new Date();
      setSignTimestamp(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST');
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to approve transfer directive. Please check authorization permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteReject = async () => {
    if (!recommendation) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await rejectRedistribution(recommendation.id, rejectReason);
      setShowRejectDrawer(false);
      // Reload next recommendation
      loadRecommendation();
    } catch (err: any) {
      setError(err?.message || 'Failed to record rejection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Retrieving redistribution directive and optimization matrix..." />;
  }

  if (error && !recommendation) {
    return <ErrorState message={error} onRetry={loadRecommendation} />;
  }

  if (!recommendation) {
    return (
      <EmptyState
        title="No pending redistribution directives"
        description="The mathematical optimization engine currently reports zero critical deficits requiring cross-district inter-facility reallocations."
        actionText="Return to National Overview"
        onAction={() => onNavigate('national-overview')}
      />
    );
  }

  const officerName = user?.username ? `${user.username} (${user.role})` : 'Dr. R. V. Ramanathan, IAS (Central Allocation Officer)';
  const donorFacility = recommendation.from_phc_name || recommendation.from_phc_id;
  const recipientFacility = targetFacilityName || recommendation.to_phc_name || recommendation.to_phc_id;

  return (
    <div className="flex flex-col w-full gap-4 pb-12">
      {/* Mission Command Notification Ticker */}
      <div className="w-full bg-slate-900 text-white py-2 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse"></span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-sky-200">
            {user?.role === 'state_officer' ? `${user.scope_id} State Allocation Command` : 'National Emergency Rebalancing Command'}
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-xs text-slate-300 font-mono">
            Directive Ref: <strong className="text-white">DIR-{recommendation.id}</strong>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-300 font-mono">
          <span>Status: {recommendation.status.toUpperCase()}</span>
          <span className="bg-black text-white px-2 py-0.5 uppercase tracking-wider text-[10px] font-bold border border-slate-700">
            Statutory Power: NDMA Sec 38
          </span>
        </div>
      </div>

      {/* Jurisdiction & Active Directives Selector Toolbar */}
      {recommendationsList.length > 1 && (
        <div className="w-full bg-white border border-slate-300 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {user?.role === 'state_officer'
                ? `${user.scope_id} State Allocation Queue`
                : 'National Allocation Directive Queue'}
            </span>
            <span className="bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] px-2 py-0.5">
              {recommendationsList.length} DIRECTIVES
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium mr-1">Select Directive:</span>
            {recommendationsList.map((rec) => {
              const isSelected = recommendation.id === rec.id;
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setRecommendation(rec)}
                  className={`px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-black text-white border-black font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  #{rec.id}: {rec.medicine_id} ({rec.quantity}U)
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <ErrorState message={error} />}

      {/* Header Block: Legal Authority & Directive Identification */}
      <div className="w-full bg-white border border-slate-300 p-4 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Priority 1 • Immediate Reallocation
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Generated: {new Date(recommendation.created_at).toLocaleString('en-IN')}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Transfer Directive #{recommendation.id} • {recommendation.medicine_id}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              Issued under the statutory authority of the{' '}
              <strong className="text-slate-900">National Disaster Management Act, 2005</strong>.
              Execution is legally binding upon both sending and receiving medical administrations.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 flex flex-col gap-1.5 lg:w-80 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 uppercase text-[10px] font-semibold">Supply Requisition:</span>
              <span className="font-mono font-bold text-secondary">{recommendation.medicine_id}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 uppercase text-[10px] font-semibold">Transit Distance:</span>
              <span className="font-mono text-slate-800">{recommendation.distance_km} km</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
              <span className="text-error uppercase text-[10px] font-bold">Recommended Quantity:</span>
              <span className="font-mono font-bold text-base text-error">{recommendation.quantity} Units</span>
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
          <span className="text-xs text-slate-500 font-mono">Highway Transit Route Verified</span>
        </div>

        {/* Linear Route Ribbon */}
        <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
          {/* Origin Summary */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold font-mono text-lg shrink-0">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Donor Depot</span>
              <span className="text-sm font-bold text-slate-900">{donorFacility}</span>
              <span className="text-xs text-slate-500 font-mono">{recommendation.from_phc_id}</span>
            </div>
          </div>

          {/* Route Ribbon */}
          <div className="flex-1 w-full flex flex-col items-center gap-1 px-4">
            <div className="flex items-center justify-between w-full text-xs font-mono text-slate-600 mb-1">
              <span className="text-secondary font-bold">Express Transit Route</span>
              <span className="bg-slate-200 px-2 py-0.5 text-slate-900 font-bold text-[11px]">
                {recommendation.distance_km} KM
              </span>
              <span className="text-secondary font-bold">Cold Chain (+2°C to +8°C)</span>
            </div>

            <div className="w-full relative h-3 bg-slate-200 flex items-center">
              <div className="h-full bg-secondary w-full"></div>
              <div className="absolute left-1/2 -translate-x-1/2 w-6 h-6 bg-secondary text-white rounded-full flex items-center justify-center shadow-md">
                <Navigation className="w-3.5 h-3.5 transform rotate-45" />
              </div>
            </div>

            <div className="flex items-center justify-between w-full text-[11px] text-slate-500 mt-1">
              <span>Lot Expiry: {recommendation.days_to_expiry} days remaining</span>
              <span className="text-slate-700 font-medium">Impact: {recommendation.predicted_impact}</span>
            </div>
          </div>

          {/* Deficit Recipient */}
          <div className="flex items-center gap-3 w-full md:w-auto md:text-right flex-row-reverse md:flex-row">
            <div className="flex flex-col">
              <span className="text-[10px] text-error uppercase font-bold">Recipient Center</span>
              <span className="text-sm font-bold text-slate-900">{recipientFacility}</span>
              <span className="text-xs text-slate-500 font-mono">{recommendation.to_phc_id}</span>
            </div>
            <div className="w-10 h-10 bg-error text-white flex items-center justify-center font-bold font-mono text-lg shrink-0">
              B
            </div>
          </div>
        </div>

        {/* Facility Diagnostics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          {/* Donor Profile */}
          <div className="bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="bg-black text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  Donor Center (Surplus Hub)
                </span>
                <span className="font-mono text-xs text-slate-600">{recommendation.from_phc_id}</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 mt-1">{donorFacility}</h4>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-white border border-slate-200 p-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Allocated Surplus</span>
                <span className="font-mono text-base font-bold text-slate-900">{recommendation.quantity} units</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Shelf-Life Window</span>
                <span className="font-mono text-base font-bold text-secondary">{recommendation.days_to_expiry} days</span>
              </div>
            </div>
          </div>

          {/* Recipient Profile */}
          <div className="bg-red-50/50 border border-red-200 p-4 flex flex-col justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="bg-error text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  Recipient Center (Deficit Hub)
                </span>
                <span className="font-mono text-xs text-error font-semibold">{recommendation.to_phc_id}</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 mt-1">{recipientFacility}</h4>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-white border border-red-200 p-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Projected Benefit</span>
                <span className="font-mono text-base font-bold text-error">Stockout Averted</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Optimization Verdict</span>
                <span className="font-mono text-base font-bold text-slate-900">Optimal Match</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Algorithmic Match Reasoning Matrix */}
      <div className="bg-white border border-slate-300 p-4 sm:p-6 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Optimization Engine Matching Reasoning
          </h3>
          <div className="flex items-center gap-1.5 text-slate-600 text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-secondary" />
            <span>Google OR-Tools CP-SAT Solved</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 leading-relaxed font-sans">
          <strong>Decision Criterion:</strong> {recommendation.predicted_impact}. The solver matched {donorFacility} with {recipientFacility} based on minimum road transit distance ({recommendation.distance_km} km) while ensuring the donor retains sufficient mandatory safety stock.
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
                Statutory Authorization Desk
              </span>
              <h3 className="text-base font-bold text-slate-900">Official Endorsement &amp; Allocation Execution</h3>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-2.5 flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-sans">Authorizing Official</span>
              <span className="font-bold text-slate-900">{officerName}</span>
            </div>
          </div>
        </div>

        {/* Checkbox Declaration */}
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
              <strong>Statutory Officer Declaration:</strong> I hereby certify that the surplus assessment for {donorFacility} has been verified against live surveillance telemetry, and authorize the emergency transfer of {recommendation.quantity} units to {recipientFacility} under NDMA Section 38 authority.
            </label>
          </div>

          {/* Rejection Drawer */}
          {showRejectDrawer && (
            <div className="bg-red-50 border border-red-200 p-3 flex flex-col gap-2 mt-2">
              <div className="text-xs font-bold text-red-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-error" />
                <span>Record Reason for Rejection</span>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="State officer justification for rejecting directive..."
                className="w-full p-2 bg-white border border-red-300 text-xs text-slate-900 focus:outline-none"
                rows={2}
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectDrawer(false)}
                  className="px-3 py-1 bg-white border border-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleExecuteReject}
                  className="px-3 py-1 bg-error text-white text-xs font-bold uppercase cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Button Terminal */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setShowRejectDrawer(!showRejectDrawer)}
            className="w-full lg:w-auto bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-300 text-slate-800 text-xs font-semibold px-4 py-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reject directive</span>
          </button>

          <button
            type="button"
            disabled={!attested || isSubmitting || recommendation.status === 'approved'}
            onClick={handleExecuteApproval}
            className="w-full lg:w-auto px-6 py-2.5 bg-black text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Broadcasting Order via NIC...</span>
              </>
            ) : recommendation.status === 'approved' ? (
              <span>Directive Already Approved</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Approve transfer and issue order</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Operational Confirmation Modal */}
      {showSuccessModal && approvedTransfer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center shrink-0">
                <Check className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-[10px] text-secondary uppercase font-bold tracking-wider">
                  Transfer Order Successfully Issued
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Transfer #{approvedTransfer.id} Enacted
                </h3>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 flex flex-col gap-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Transfer ID:</span>
                <span className="font-bold text-slate-900">#{approvedTransfer.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Initial Lifecycle Status:</span>
                <span className="font-bold text-secondary uppercase">{approvedTransfer.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Sign-Off Timestamp:</span>
                <span className="text-slate-900">{signTimestamp}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Statutory transfer record has been created and dispatched to the national tracking registry.
            </p>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  onNavigate('inter-district-transfer-tracking', { transferId: approvedTransfer.id });
                }}
                className="px-4 py-2 bg-secondary hover:bg-sky-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Track active transfer</span>
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
