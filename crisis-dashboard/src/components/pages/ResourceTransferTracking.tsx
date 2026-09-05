import React, { useState, useEffect, useCallback } from 'react';
import type { PageId } from '../../types/navigation';
import {
  getTransfers,
  getTransferDetail,
  updateTransferStatus,
  logOutcome,
} from '../../api/endpoints';
import type { TransferResponse } from '../../api/types';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import {
  Truck,
  Check,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  PackageCheck,
} from 'lucide-react';

interface ResourceTransferTrackingProps {
  onNavigate: (page: PageId, options?: { stateId?: string; districtName?: string }) => void;
  highlightedShipmentId?: string;
  transferId?: number;
}

export const ResourceTransferTracking: React.FC<ResourceTransferTrackingProps> = ({
  onNavigate,
  transferId,
}) => {
  const [transfers, setTransfers] = useState<TransferResponse[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'dispatched' | 'received'>('all');

  // Async states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [outcomeLogged, setOutcomeLogged] = useState<boolean>(false);

  const loadTransfers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await getTransfers(statusFilter === 'all' ? undefined : statusFilter);
      setTransfers(list);

      if (list && list.length > 0) {
        if (transferId) {
          const matched = list.find((t) => t.id === transferId);
          if (matched) {
            setSelectedTransfer(matched);
          } else {
            // Fetch explicit transfer detail
            try {
              const explicit = await getTransferDetail(transferId);
              setSelectedTransfer(explicit);
            } catch {
              setSelectedTransfer(list[0]);
            }
          }
        } else if (!selectedTransfer || !list.some((t) => t.id === selectedTransfer.id)) {
          setSelectedTransfer(list[0]);
        }
      } else {
        setSelectedTransfer(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve logistics tracking records from the dispatch registry.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, transferId]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  const handleAdvanceStatus = async (targetStatus: 'dispatched' | 'received') => {
    if (!selectedTransfer) return;
    setIsUpdating(true);
    try {
      const updated = await updateTransferStatus(selectedTransfer.id, {
        status: targetStatus,
        notes: `Advanced to ${targetStatus} via incident command terminal.`,
      });
      setSelectedTransfer(updated);
      setTransfers((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
    } catch (err: any) {
      alert(`Could not advance transfer status: ${err?.message || 'Server error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogOutcome = async () => {
    if (!selectedTransfer) return;
    setIsUpdating(true);
    try {
      await logOutcome({
        transfer_id: selectedTransfer.id,
        stockout_prevented: true,
        notes: 'Stockout prevented verified upon delivery.',
      });
      setOutcomeLogged(true);
    } catch (err: any) {
      alert(`Failed to log outcome: ${err?.message || 'Server error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusPillClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'dispatched':
        return 'bg-sky-100 text-secondary border-sky-300 font-bold';
      case 'received':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStageNumbers = (status: string) => {
    switch (status) {
      case 'approved':
        return { stage: 2, label: 'Approved • Order Issued' };
      case 'dispatched':
        return { stage: 3, label: 'Dispatched • In Transit' };
      case 'received':
        return { stage: 4, label: 'Received & Reconciled' };
      default:
        return { stage: 1, label: 'Recommended' };
    }
  };

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
            Inter-District Resource Transfer Tracking
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-mono">
            <span><strong className="text-slate-900">{transfers.length}</strong> Total Transfers</span>
            <span>•</span>
            <span><strong className="text-slate-900">{transfers.filter((t) => t.status === 'dispatched').length}</strong> In Transit</span>
            <span>•</span>
            <span><strong className="text-slate-900">{transfers.filter((t) => t.status === 'received').length}</strong> Completed</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="inline-flex bg-slate-100 border border-slate-200 p-1 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                statusFilter === 'approved' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Approved
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('dispatched')}
              className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                statusFilter === 'dispatched' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Dispatched
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('received')}
              className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                statusFilter === 'received' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Received
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('emergency-redistribution')}
            className="bg-black hover:bg-slate-800 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Initiate Transfer</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Retrieving live transit and transfer ledger..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadTransfers} />
      ) : !selectedTransfer ? (
        <EmptyState
          title="No transfer records found"
          description="There are currently no active or historical inter-district transfer directives in this status filter."
          actionText="View Emergency Directives"
          onAction={() => onNavigate('emergency-redistribution')}
        />
      ) : (
        <>
          {/* Featured Active Transfer Live Stepper Strip */}
          <div className="bg-white border border-slate-300 p-4 sm:p-5 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 gap-3 bg-slate-50 border border-slate-200 p-3">
              <div className="flex items-center gap-3">
                <Truck className="w-6 h-6 text-secondary shrink-0" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Transfer #{selectedTransfer.id}: {selectedTransfer.recommendation?.medicine_id || 'Medical Consignment'}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 uppercase border ${getStatusPillClass(selectedTransfer.status)}`}>
                      {selectedTransfer.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="font-semibold text-slate-900">
                      {selectedTransfer.recommendation?.from_phc_name || selectedTransfer.recommendation?.from_phc_id || 'Origin Depot'}
                    </span>
                    <span className="text-slate-400">to</span>
                    <span className="font-semibold text-slate-900">
                      {selectedTransfer.recommendation?.to_phc_name || selectedTransfer.recommendation?.to_phc_id || 'Destination PHC'}
                    </span>
                    {selectedTransfer.recommendation?.distance_km && (
                      <span>• Distance: {selectedTransfer.recommendation.distance_km} km</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons to Advance Status in Real-Time */}
              <div className="flex items-center gap-2">
                {selectedTransfer.status === 'approved' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleAdvanceStatus('dispatched')}
                    className="px-3 py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Dispatch Consignment</span>
                  </button>
                )}

                {selectedTransfer.status === 'dispatched' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleAdvanceStatus('received')}
                    className="px-3 py-1.5 bg-secondary hover:bg-sky-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Confirm Received</span>
                  </button>
                )}

                {selectedTransfer.status === 'received' && (
                  <button
                    type="button"
                    disabled={isUpdating || outcomeLogged}
                    onClick={handleLogOutcome}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{outcomeLogged ? 'Outcome Verified' : 'Record Stockout Averted'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={loadTransfers}
                  className="bg-white hover:bg-slate-100 border border-slate-300 p-2 text-slate-700 cursor-pointer"
                  title="Refresh status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* 4-Stage Stepper Component */}
            {(() => {
              const { stage } = getStageNumbers(selectedTransfer.status);
              return (
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
                    <div className="text-[11px] text-secondary font-medium">Completed</div>
                    <div className="text-[11px] text-slate-500 leading-snug">
                      Optimization match generated by OR-Tools solver.
                    </div>
                  </div>

                  {/* Stage 2 */}
                  <div className={`p-3 flex flex-col gap-1 border ${
                    stage >= 2 ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                        stage >= 2 ? 'bg-secondary text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {stage >= 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">STAGE 02</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1">Approved</div>
                    <div className={`text-[11px] ${stage >= 2 ? 'text-secondary font-medium' : 'text-slate-500'}`}>
                      {stage >= 2 ? 'Statutory Authorization Issued' : 'Pending Review'}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-snug">
                      Authorized under NDMA Section 38 mandate.
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div className={`p-3 flex flex-col gap-1 border ${
                    stage === 3
                      ? 'bg-sky-50 border-2 border-secondary shadow-xs'
                      : stage > 3
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                        stage >= 3 ? 'bg-secondary text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {stage > 3 ? <Check className="w-3.5 h-3.5" /> : stage === 3 ? <Truck className="w-3.5 h-3.5" /> : '3'}
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">STAGE 03</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1">Dispatched</div>
                    <div className={`text-[11px] ${stage >= 3 ? 'text-secondary font-bold' : 'text-slate-500'}`}>
                      {stage >= 3 ? 'Highway Transit Active' : 'Awaiting Departure'}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-snug">
                      Cold-chain containment verified.
                    </div>
                  </div>

                  {/* Stage 4 */}
                  <div className={`p-3 flex flex-col gap-1 border ${
                    stage === 4
                      ? 'bg-emerald-50 border-2 border-emerald-600'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                        stage === 4 ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {stage === 4 ? <Check className="w-3.5 h-3.5" /> : '4'}
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">STAGE 04</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1">Received &amp; Reconciled</div>
                    <div className={`text-[11px] ${stage === 4 ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                      {stage === 4 ? 'Consignment Received' : 'Pending Arrival'}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-snug">
                      Logged into recipient health facility cold ILR.
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Audit Status History Timeline */}
            {selectedTransfer.status_history && selectedTransfer.status_history.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 p-3 text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">
                  Status History Trail
                </span>
                <div className="space-y-1 font-mono text-[11px]">
                  {selectedTransfer.status_history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-700 border-b border-slate-200/50 pb-0.5">
                      <span className="font-bold uppercase text-slate-900">{h.status}</span>
                      <span>By: {h.changed_by}</span>
                      <span>{new Date(h.changed_at).toLocaleTimeString('en-IN')} IST</span>
                      {h.notes && <span className="font-sans text-slate-500 truncate max-w-xs">{h.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Shipments Registry Table */}
          <div className="w-full bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                  National Dispatch Pipeline Ledger ({transfers.length} Records)
                </h4>
              </div>
              <span className="text-xs text-slate-500">Click any row to display live transit telemetry</span>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-semibold select-none">
                  <tr>
                    <th className="py-2.5 px-4">Transfer ID &amp; Cargo</th>
                    <th className="py-2.5 px-3">Corridor Routing</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Lifecycle Status</th>
                    <th className="py-2.5 px-4 text-right">Operational Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {transfers.map((t) => {
                    const isSelected = selectedTransfer.id === t.id;
                    const rec = t.recommendation;

                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTransfer(t)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-50/80 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-4">
                          <div className="flex flex-col font-sans">
                            <span className="font-bold text-slate-900 text-xs">#{t.id}</span>
                            <span className="text-[11px] text-slate-600">{rec?.medicine_id || 'Emergency Medicine'}</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-sans">
                          <div className="flex flex-col text-xs">
                            <span className="text-slate-800">{rec?.from_phc_name || rec?.from_phc_id || 'Origin Depot'}</span>
                            <span className="text-slate-500 text-[11px]">
                              to {rec?.to_phc_name || rec?.to_phc_id || 'Destination PHC'}
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900">{rec?.quantity ?? '-'} Units</span>
                        </td>

                        <td className="py-2.5 px-3 font-sans">
                          <span className={`text-[10px] px-2 py-0.5 border ${getStatusPillClass(t.status)}`}>
                            {t.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="py-2.5 px-4 text-right font-sans">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTransfer(t);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-[11px] font-semibold px-2.5 py-1 transition-colors cursor-pointer"
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
        </>
      )}
    </div>
  );
};
