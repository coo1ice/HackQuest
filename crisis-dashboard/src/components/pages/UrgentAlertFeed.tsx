import React, { useState, useEffect, useCallback } from 'react';
import type { PageId } from '../../types/navigation';
import { getAlerts, getAlertsSummary, updateAlertStatus } from '../../api/endpoints';
import type { AlertResponse, AlertsSummaryResponse } from '../../api/types';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Send,
  Check,
  Truck,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { STATE_DATASET } from '../../data/stateData';

interface UrgentAlertFeedProps {
  onNavigate: (page: PageId, options?: { stateId?: string; districtName?: string; facilityName?: string; directiveId?: number }) => void;
}

export const UrgentAlertFeed: React.FC<UrgentAlertFeedProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isStateOfficer = user?.role === 'state_officer';
  const officerStateCode = isStateOfficer && user?.scope_id ? user.scope_id : undefined;
  const officerStateName = officerStateCode ? (STATE_DATASET[officerStateCode]?.name || officerStateCode) : undefined;

  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [summary, setSummary] = useState<AlertsSummaryResponse | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'acknowledged'>('active');

  // Scope filter: State officer defaults strictly to their jurisdiction
  const [scopeFilter, setScopeFilter] = useState<'jurisdiction' | 'all'>(isStateOfficer ? 'jurisdiction' : 'all');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>(officerStateCode || 'all');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [isUpdatingId, setIsUpdatingId] = useState<number | null>(null);

  // Sync state filter if officer changes
  useEffect(() => {
    if (officerStateCode) {
      setSelectedStateFilter(officerStateCode);
      setScopeFilter('jurisdiction');
    }
  }, [officerStateCode]);

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const activeStateId = isStateOfficer
      ? (scopeFilter === 'jurisdiction' ? officerStateCode : undefined)
      : (selectedStateFilter !== 'all' ? selectedStateFilter : undefined);

    try {
      const [alertsRes, summaryRes] = await Promise.all([
        getAlerts({
          severity: severityFilter === 'all' ? undefined : severityFilter,
          status: statusFilter === 'all' ? undefined : statusFilter,
          state_id: activeStateId,
        }),
        getAlertsSummary({ state_id: activeStateId }),
      ]);
      setAlerts(alertsRes);
      setSummary(summaryRes);
      setCountdown(30);
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve real-time alerts from the surveillance feed.');
    } finally {
      setIsLoading(false);
    }
  }, [severityFilter, statusFilter, isStateOfficer, scopeFilter, officerStateCode, selectedStateFilter]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Periodic polling countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadAlerts();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loadAlerts]);

  const handleAcknowledge = async (id: number) => {
    setIsUpdatingId(id);
    try {
      const updated = await updateAlertStatus(id, 'acknowledged');
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'acknowledged', acknowledged_by: updated.acknowledged_by || user?.username || 'Authorized Officer' } : a))
      );
    } catch (err: any) {
      alert(`Could not update alert status: ${err?.message || 'Server error'}`);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const criticalCount = summary?.critical_count ?? 4;
  const warningCount = summary?.warning_count ?? 8;
  const totalActive = summary?.total_active_alerts ?? alerts.length;

  return (
    <div className="flex flex-col w-full gap-4 pb-12">
      {/* Top Alert Console Strip */}
      <div className="w-full bg-white border border-slate-300 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 bg-slate-50 border border-slate-200 p-3 sm:p-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-error rounded-full animate-pulse"></span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {isStateOfficer
                  ? `${officerStateName || officerStateCode} State Urgent Alert Feed`
                  : 'National Urgent Alert Feed'}
              </h2>
              <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider font-mono">
                {isStateOfficer ? `COMMAND: ${officerStateCode}` : 'APEX NATIONAL GRID'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-mono">
              <span className="flex items-center gap-1 text-error font-bold">
                <AlertOctagon className="w-4 h-4 text-error" />
                {criticalCount} Critical Stockout Alerts
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-900 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                {warningCount} Warning Level Alerts
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-secondary font-medium">
                <CheckCircle2 className="w-4 h-4 text-secondary" />
                {totalActive} {isStateOfficer && scopeFilter === 'jurisdiction' ? `${officerStateName} Incidents` : 'Total Monitored Incidents'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {/* Jurisdiction Scope Switcher */}
            {isStateOfficer ? (
              <div className="flex items-center gap-1 bg-white border border-slate-300 p-0.5 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setScopeFilter('jurisdiction')}
                  className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                    scopeFilter === 'jurisdiction' ? 'bg-black text-white' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  My State ({officerStateName})
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter('all')}
                  className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                    scopeFilter === 'all' ? 'bg-black text-white' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  All-India Directives
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 px-2.5 py-1 text-xs shadow-2xs">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Jurisdiction:</span>
                <select
                  value={selectedStateFilter}
                  onChange={(e) => setSelectedStateFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All 36 States &amp; UTs</option>
                  {Object.values(STATE_DATASET).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="text-xs text-slate-800">
                Poll refresh: <strong className="font-mono">{countdown}s</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={loadAlerts}
              disabled={isLoading}
              className="bg-black hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync alerts</span>
            </button>
          </div>
        </div>

        {/* Severity Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 uppercase font-semibold mr-1">Severity:</span>
            <button
              type="button"
              onClick={() => setSeverityFilter('all')}
              className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                severityFilter === 'all'
                  ? 'bg-black text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter('critical')}
              className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                severityFilter === 'critical'
                  ? 'bg-error text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Critical (&lt;48h)
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter('high')}
              className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                severityFilter === 'high'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Warning (48-96h)
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter('medium')}
              className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                severityFilter === 'medium'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Medium
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Status:</span>
            <div className="inline-flex bg-slate-100 border border-slate-200 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'active' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('acknowledged')}
                className={`px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'acknowledged' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Acknowledged
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingState message="Fetching live health resource alerts..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAlerts} />
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No urgent health resource alerts"
          description="There are currently no active alerts matching this severity tier. All reporting health facilities are operating within nominal thresholds."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {alerts.map((alertItem) => {
            const isCritical = alertItem.severity === 'critical';
            const isAck = alertItem.status === 'acknowledged' || !!alertItem.acknowledged_by;

            return (
              <div
                key={alertItem.id}
                className={`bg-white border border-slate-300 shadow-xs overflow-hidden transition-all ${
                  isAck ? 'opacity-60' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Left accent color bar */}
                  <div
                    className={`w-full lg:w-2 self-stretch shrink-0 ${
                      isCritical ? 'bg-error' : alertItem.severity === 'high' ? 'bg-amber-500' : 'bg-slate-700'
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
                            {alertItem.severity}
                          </span>
                          <span className="bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px] font-bold px-1.5 py-0.5">
                            {alertItem.phc_id}
                          </span>
                          <span className="text-xs text-slate-600 font-medium">
                            {alertItem.phc_name || alertItem.phc_id}
                          </span>
                          {alertItem.district_name && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs text-slate-500">
                                District: {alertItem.district_name}
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-1">
                          {alertItem.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {alertItem.message}
                        </p>
                      </div>

                      {/* Depletion Clock Tile */}
                      <div className="flex items-center lg:flex-col lg:items-end gap-1.5 bg-slate-50 border border-slate-200 p-3 shrink-0">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                          Surveillance Status
                        </span>
                        <div className="font-mono text-sm sm:text-base text-slate-900 font-bold flex items-center gap-1">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span>{isAck ? 'Acknowledged' : 'Active Alert'}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(alertItem.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                        </span>
                      </div>
                    </div>

                    {/* Recommendation Strip if provided */}
                    {alertItem.action_recommended && (
                      <div className="bg-sky-50/70 border border-sky-200 p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2">
                          <Truck className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[11px] font-bold uppercase text-secondary tracking-wider">
                              Automated Logistics Recommendation
                            </span>
                            <p className="text-slate-800 mt-0.5 leading-relaxed">{alertItem.action_recommended}</p>
                          </div>
                        </div>
                        {alertItem.linked_recommendation_id && (
                          <span className="font-mono text-xs font-bold text-secondary bg-white px-2 py-0.5 border border-sky-200">
                            Directive #{alertItem.linked_recommendation_id}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                        <span>Logged: {new Date(alertItem.created_at).toLocaleString('en-IN')}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Deep link to Emergency Redistribution */}
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate('emergency-redistribution', {
                              directiveId: alertItem.linked_recommendation_id,
                              facilityName: alertItem.phc_name || alertItem.phc_id,
                              districtName: alertItem.district_name,
                            })
                          }
                          className="bg-black hover:bg-slate-800 text-white font-semibold px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Open redistribution approval</span>
                        </button>

                        <button
                          type="button"
                          disabled={isAck || isUpdatingId === alertItem.id}
                          onClick={() => handleAcknowledge(alertItem.id)}
                          className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5 text-slate-500" />
                          <span>{isAck ? 'Acknowledged' : 'Acknowledge alert'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
