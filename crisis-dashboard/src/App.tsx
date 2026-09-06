import { useState, useEffect, useMemo, useCallback } from 'react';
import type { PageId } from './types/navigation';
import { Header } from './components/Header';
import { KpiLedger } from './components/KpiLedger';
import { IndiaMap } from './components/IndiaMap';
import { StateRegistry } from './components/StateRegistry';
import { InfrastructureStrip } from './components/InfrastructureStrip';
import { NodeDetailModal } from './components/NodeDetailModal';
import { StateDistrictDrilldown } from './components/pages/StateDistrictDrilldown';
import { UrgentAlertFeed } from './components/pages/UrgentAlertFeed';
import { EmergencyRedistribution } from './components/pages/EmergencyRedistribution';
import { ResourceTransferTracking } from './components/pages/ResourceTransferTracking';
import { DataIngestionPage } from './components/pages/DataIngestionPage';
import { LoginPage } from './components/pages/LoginPage';
import { RegisterPage } from './components/pages/RegisterPage';
import { LoadingState } from './components/common/LoadingState';
import { ErrorState } from './components/common/ErrorState';
import { RestrictedScreen } from './components/common/RestrictedScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getNationalOverview, getAlertsSummary, getTransfers } from './api/endpoints';
import type { NationalOverviewResponse } from './api/types';
import { STATE_DATASET } from './data/stateData';
import type { StateCrisisData } from './data/stateData';
import { Radio, Cpu, Layers } from 'lucide-react';

function DashboardContent() {
  const { user, isEmergencyOverride } = useAuth();
  const isAuthorizedForRedistribution = isEmergencyOverride || (!!user && user.role !== 'phc_staff');

  const getInitialPage = (): PageId => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (['login', 'register', 'national-overview', 'state-district-drill-down', 'urgent-alert-feed', 'emergency-redistribution', 'inter-district-transfer-tracking', 'data-ingestion'].includes(hash)) {
        return hash as PageId;
      }
      const params = new URLSearchParams(window.location.search);
      const p = params.get('page');
      if (p && ['login', 'register', 'national-overview', 'state-district-drill-down', 'urgent-alert-feed', 'emergency-redistribution', 'inter-district-transfer-tracking', 'data-ingestion'].includes(p)) {
        return p as PageId;
      }
    }
    return 'national-overview';
  };

  const [activePage, setActivePage] = useState<PageId>(getInitialPage);
  const [selectedStateId, setSelectedStateId] = useState<string | null>(() => {
    if (user?.role === 'state_officer' && user.scope_id && STATE_DATASET[user.scope_id]) {
      return user.scope_id;
    }
    return 'INBR';
  });

  // UI state: hovered, inspecting
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);
  const [inspectingState, setInspectingState] = useState<StateCrisisData | null>(null);

  // Cross-page navigation contextual options
  const [targetFacility, setTargetFacility] = useState<string>('Kanti PHC (Muzaffarpur)');
  const [highlightedShipmentId, setHighlightedShipmentId] = useState<string>('TR-2024-9041');
  const [targetDirectiveId, setTargetDirectiveId] = useState<number | undefined>(undefined);
  const [targetTransferId, setTargetTransferId] = useState<number | undefined>(undefined);

  // Live national data states
  const [overview, setOverview] = useState<NationalOverviewResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('14:32 IST');

  // Badge counters
  const [urgentAlertCount, setUrgentAlertCount] = useState<number>(4);
  const [activeTransferCount, setActiveTransferCount] = useState<number>(6);

  // Fetch National Overview
  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const data = await getNationalOverview();
      setOverview(data);
      if (data.last_synced_at) {
        const d = new Date(data.last_synced_at);
        if (!isNaN(d.getTime())) {
          const formatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          setLastSyncTime(formatted);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to national telemetry service';
      setOverviewError(msg);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  // Automatically sync jurisdiction state when officer logs in
  useEffect(() => {
    if (user?.role === 'state_officer' && user.scope_id && STATE_DATASET[user.scope_id]) {
      setSelectedStateId(user.scope_id);
    }
  }, [user]);

  // Fetch alert & transfer badge counts
  const fetchBadgeCounts = useCallback(async () => {
    try {
      const summary = await getAlertsSummary();
      setUrgentAlertCount(summary.critical_count);
    } catch {
      // Keep default badge count if unauthenticated or error
    }

    try {
      const transfers = await getTransfers();
      const inTransit = transfers.filter((t) => t.status !== 'received').length;
      setActiveTransferCount(inTransit);
    } catch {
      // Keep default badge count if unauthenticated or error
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    fetchBadgeCounts();
  }, [fetchOverview, fetchBadgeCounts]);

  // Status mapping for SVG India map
  const statusMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (overview?.states) {
      for (const s of overview.states) {
        map[s.state_id] = s.status;
      }
    }
    return map;
  }, [overview]);

  // Global navigation router
  const handleNavigate = (
    page: PageId,
    options?: {
      stateId?: string;
      districtName?: string;
      facilityName?: string;
      shipmentId?: string;
      directiveId?: number;
      transferId?: number;
    }
  ) => {
    if (options?.stateId && STATE_DATASET[options.stateId]) {
      setSelectedStateId(options.stateId);
    }
    if (options?.facilityName) {
      setTargetFacility(options.facilityName);
    }
    if (options?.shipmentId) {
      setHighlightedShipmentId(options.shipmentId);
    }
    if (options?.directiveId !== undefined) {
      setTargetDirectiveId(options.directiveId);
    }
    if (options?.transferId !== undefined) {
      setTargetTransferId(options.transferId);
    }
    if (typeof window !== 'undefined') {
      window.location.hash = page;
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync with browser hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as PageId;
      if (['login', 'register', 'national-overview', 'state-district-drill-down', 'urgent-alert-feed', 'emergency-redistribution', 'inter-district-transfer-tracking'].includes(hash)) {
        setActivePage(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectState = (stateId: string | null) => {
    if (stateId === null) {
      setSelectedStateId(null);
      return;
    }
    if (STATE_DATASET[stateId]) {
      // Toggle selection: if already selected, deselect
      setSelectedStateId((prev) => (prev === stateId ? null : stateId));
    }
  };

  const handleOpenNode = (state: StateCrisisData) => {
    setInspectingState(state);
  };

  const handleDrilldownState = (stateId: string) => {
    handleNavigate('state-district-drill-down', { stateId });
  };

  // Keyboard shortcut listener for ESC (Emergency Override / Return)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (inspectingState) {
          setInspectingState(null);
        } else if (activePage !== 'urgent-alert-feed') {
          handleNavigate('urgent-alert-feed');
        } else {
          handleNavigate('national-overview');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectingState, activePage]);

  // If user is on login page
  if (activePage === 'login') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 selection:bg-slate-800 selection:text-white">
        <Header
          activePage="login"
          onNavigate={(p) => handleNavigate(p)}
          onEmergencyOverride={() => handleNavigate('urgent-alert-feed')}
          lastSyncTime={lastSyncTime}
          urgentAlertCount={urgentAlertCount}
          activeTransferCount={activeTransferCount}
        />
        <main className="flex-1 w-full max-w-[1780px] mx-auto p-4 sm:p-6 pt-28 sm:pt-28 flex flex-col items-center justify-center">
          <LoginPage
            onLoginSuccess={(target) => handleNavigate(target || 'national-overview')}
            onNavigate={handleNavigate}
          />
        </main>
        <footer className="w-full bg-white border-t border-slate-300 py-3 px-4 sm:px-6 mt-auto">
          <div className="max-w-[1780px] mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              Official Portal of MoHFW, Government of India • National Health Resource Monitoring Cell
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span>BUILD v4.19.8-PROD</span>
              <span>NIC Node: DL-COMMAND-01</span>
              <span className="text-slate-700 font-semibold">SECURITY: CONFIDENTIAL-OPS</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // If user is on register page
  if (activePage === 'register') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 selection:bg-slate-800 selection:text-white">
        <Header
          activePage="register"
          onNavigate={(p) => handleNavigate(p)}
          onEmergencyOverride={() => handleNavigate('urgent-alert-feed')}
          lastSyncTime={lastSyncTime}
          urgentAlertCount={urgentAlertCount}
          activeTransferCount={activeTransferCount}
        />
        <main className="flex-1 w-full max-w-[1780px] mx-auto p-4 sm:p-6 pt-28 sm:pt-28 flex flex-col items-center justify-center">
          <RegisterPage
            onRegisterSuccess={() => handleNavigate('national-overview')}
            onNavigate={handleNavigate}
          />
        </main>
        <footer className="w-full bg-white border-t border-slate-300 py-3 px-4 sm:px-6 mt-auto">
          <div className="max-w-[1780px] mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              Official Portal of MoHFW, Government of India • National Health Resource Monitoring Cell
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span>BUILD v4.19.8-PROD</span>
              <span>NIC Node: DL-COMMAND-01</span>
              <span className="text-slate-700 font-semibold">SECURITY: CONFIDENTIAL-OPS</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 selection:bg-slate-800 selection:text-white">
      {/* 5-Tab Persistent Command Header */}
      <Header
        activePage={activePage}
        onNavigate={(p) => handleNavigate(p)}
        onEmergencyOverride={() => handleNavigate('urgent-alert-feed')}
        lastSyncTime={lastSyncTime}
        urgentAlertCount={urgentAlertCount}
        activeTransferCount={activeTransferCount}
      />

      {/* Main Operational Container (Offset by header) */}
      <main className="flex-1 w-full max-w-[1780px] mx-auto p-4 sm:p-6 pt-28 sm:pt-28 flex flex-col gap-4">
        {/* PAGE 1: NATIONAL OVERVIEW */}
        {activePage === 'national-overview' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Top Operational Status Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-error"></span>
                <span className="text-xs font-bold uppercase tracking-wide text-slate-900">
                  National Crisis Dispatch and Resource Monitoring
                </span>
                <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5">
                  JURISDICTION: ALL INDIA (36 STATES &amp; UTs)
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1 text-secondary font-medium">
                  <Radio className="w-3.5 h-3.5 text-secondary animate-pulse" />
                  {overview?.reporting_rate_pct != null && !isNaN(overview.reporting_rate_pct)
                    ? `${overview.reporting_rate_pct.toFixed(1)}% reporting telemetry`
                    : '99.1% reporting telemetry'}
                </span>
                <span>•</span>
                <span>Last census sync: <strong>{lastSyncTime}</strong></span>
              </div>
            </div>

            {/* Error or Loading Banner for National Overview */}
            {overviewError && (
              <ErrorState
                title="National Telemetry Sync Notice"
                message={overviewError}
                onRetry={fetchOverview}
              />
            )}

            {overviewLoading && !overview && (
              <LoadingState message="Polling national PHC resource telemetry across all state commands..." />
            )}

            {/* Composite Vulnerability Map & Legend Sub-strip */}
            <div className="w-full px-4 py-2 bg-white border border-slate-300 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-secondary" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  Composite Vulnerability Map
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-1.5 py-0.2 border border-slate-300">
                  ALL ZONES
                </span>
              </div>

              {/* Red/Blue Color Metrics Legend */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-error border border-red-700 shadow-2xs shrink-0"></span>
                  <span className="font-semibold text-slate-900 text-[11px]">Critical Stockout</span>
                  <span className="text-slate-500 text-[11px] hidden sm:inline">(BR, AS, OD, SK)</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-secondary border border-sky-800 shadow-2xs shrink-0"></span>
                  <span className="font-semibold text-slate-900 text-[11px]">Adequate Reserve</span>
                  <span className="text-slate-500 text-[11px] hidden sm:inline">(RJ, UP, MP, GJ)</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-slate-300 border border-slate-400 shadow-2xs shrink-0"></span>
                  <span className="font-medium text-slate-700 text-[11px]">Normal Buffer</span>
                  <span className="text-slate-400 text-[11px] hidden lg:inline">(&gt;14d)</span>
                </div>
              </div>
            </div>

            {/* National Operational KPI Ledger */}
            <KpiLedger
              onNavigate={handleNavigate}
              data={
                overview
                  ? {
                      totalPhcs: overview.total_phcs,
                      reportingPhcs: overview.reporting_phcs,
                      reportingRatePct: overview.reporting_rate_pct,
                      criticalStatesCount: overview.critical_deficit_states_count,
                      bedOccupancyPct: overview.national_bed_occupancy_pct,
                      inTransitTransfersCount: overview.in_transit_transfers_count,
                    }
                  : undefined
              }
            />

            {/* Spatial Surveillance Map & Urgency Registry Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
              {/* Left / Center 8 Columns: Spatial Cartography & Command Panel */}
              <div className="lg:col-span-8 flex flex-col gap-3">
                {/* GIS Map Canvas Card */}
                <div className="bg-white border border-slate-300 p-3 sm:p-4 flex flex-col shadow-sm relative">
                  {/* Map Title Strip */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Spatial Crisis Cartography • Standard Indian Territorial Alignment
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 hidden sm:inline">
                      Click any state boundary to lock command telemetry
                    </span>
                  </div>

                  {/* Map Container with Relative Positioning for the Floating Command Panel */}
                  <div className="relative w-full bg-slate-50/70 border border-slate-200 min-h-[580px] sm:min-h-[640px] flex items-center justify-center overflow-hidden">
                    <IndiaMap
                      selectedStateId={selectedStateId}
                      onSelectState={handleSelectState}
                      hoveredStateId={hoveredStateId}
                      onHoverState={setHoveredStateId}
                      statusMap={statusMap}
                      onNavigate={handleNavigate}
                      onOpenNode={handleOpenNode}
                    />
                  </div>

                  {/* Infrastructure Integrity Strip */}
                  <InfrastructureStrip />
                </div>
              </div>

              {/* Right 4 Columns: States Ranked by Urgency Registry */}
              <div className="lg:col-span-4 flex flex-col">
                <StateRegistry
                  selectedStateId={selectedStateId}
                  onSelectState={handleSelectState}
                  onDrilldownState={handleDrilldownState}
                  apiStates={overview?.states}
                />
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: STATE & DISTRICT DRILL-DOWN */}
        {activePage === 'state-district-drill-down' && (
          <StateDistrictDrilldown
            selectedStateId={selectedStateId ?? undefined}
            onNavigate={handleNavigate}
          />
        )}

        {/* PAGE 3: URGENT ALERT FEED */}
        {activePage === 'urgent-alert-feed' && (
          <UrgentAlertFeed onNavigate={handleNavigate} />
        )}

        {/* PAGE 4: EMERGENCY REDISTRIBUTION */}
        {activePage === 'emergency-redistribution' && (
          isAuthorizedForRedistribution ? (
            <EmergencyRedistribution
              targetFacilityName={targetFacility}
              directiveId={targetDirectiveId}
              onNavigate={handleNavigate}
            />
          ) : (
            <RestrictedScreen
              screenTitle="Emergency Redistribution Directives"
              requiredRole="District Health Officer, State Surveillance Officer, or National Admin"
              onNavigate={handleNavigate}
            />
          )
        )}

        {/* PAGE 5: INTER-DISTRICT TRANSFER TRACKING */}
        {activePage === 'inter-district-transfer-tracking' && (
          <ResourceTransferTracking
            highlightedShipmentId={highlightedShipmentId}
            transferId={targetTransferId}
            onNavigate={handleNavigate}
          />
        )}

        {/* PAGE 6: TELEMETRY DATA INGESTION (CSV / EXCEL) */}
        {activePage === 'data-ingestion' && (
          <DataIngestionPage onNavigate={handleNavigate} />
        )}
      </main>

      {/* Node Detail Modal (Accessible from map or registry) */}
      <NodeDetailModal
        state={inspectingState}
        onClose={() => setInspectingState(null)}
        onDrilldown={(stateId) => {
          setInspectingState(null);
          handleNavigate('state-district-drill-down', { stateId });
        }}
        onAuthorizeRedistribution={(state) => {
          setInspectingState(null);
          handleNavigate('emergency-redistribution', { stateId: state.id });
        }}
      />

      {/* Persistent Operational Footer */}
      <footer className="w-full bg-white border-t border-slate-300 py-3 px-4 sm:px-6 mt-auto">
        <div className="max-w-[1780px] mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Official Portal of MoHFW, Government of India • National Health Resource Monitoring Cell
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>BUILD v4.19.8-PROD</span>
            <span>NIC Node: DL-COMMAND-01</span>
            <span className="text-slate-700 font-semibold">SECURITY: CONFIDENTIAL-OPS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}

export default App;


