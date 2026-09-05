import React from 'react';
import type { PageId } from '../types/navigation';
import { RefreshCw, UserCheck, LogOut, LogIn, Gavel } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  lastSyncTime?: string;
  onEmergencyOverride?: () => void;
  urgentAlertCount?: number;
  activeTransferCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onNavigate,
  lastSyncTime,
  onEmergencyOverride: _onEmergencyOverride,
  urgentAlertCount = 4,
  activeTransferCount = 6,
}) => {
  const {
    user,
    isAuthenticated,
    logout,
    isEmergencyOverride,
    enableEmergencyOverride,
    disableEmergencyOverride,
  } = useAuth();

  const navItems: { id: PageId; label: string; badge?: string; badgeColor?: string }[] = [
    { id: 'national-overview', label: 'National Overview' },
    { id: 'state-district-drill-down', label: 'State & District Drill-down' },
    {
      id: 'urgent-alert-feed',
      label: 'Urgent Alert Feed',
      badge: urgentAlertCount > 0 ? String(urgentAlertCount) : undefined,
      badgeColor: 'bg-error text-white',
    },
    { id: 'emergency-redistribution', label: 'Emergency Redistribution' },
    {
      id: 'inter-district-transfer-tracking',
      label: 'Inter-District Transfer Tracking',
      badge: activeTransferCount > 0 ? String(activeTransferCount) : undefined,
      badgeColor: 'bg-secondary text-white',
    },
    {
      id: 'login',
      label: isAuthenticated && user ? `Officer: ${user.username}` : 'Officer Sign In',
      badge: isAuthenticated ? 'ONLINE' : 'PORTAL',
      badgeColor: isAuthenticated ? 'bg-secondary text-white' : 'bg-slate-700 text-white',
    },
  ];

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'national_admin':
        return 'Central Command Administrator';
      case 'state_officer':
        return 'State Surveillance Officer';
      case 'district_officer':
        return 'District Health Officer';
      case 'phc_staff':
        return 'PHC Medical Officer';
      default:
        return 'Authorized Official';
    }
  };

  const formattedSyncTime = lastSyncTime
    ? `Synced: ${new Date(lastSyncTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`
    : 'Telemetry: 5m interval';

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-slate-300 shadow-xs">
      <div className="h-24 w-full px-4 sm:px-6 flex flex-col justify-between">
        {/* Top Incident Command Chrome */}
        <div className="h-12 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => onNavigate('national-overview')}
            >
              <div className="w-7 h-7 bg-black text-white flex items-center justify-center font-bold text-xs tracking-wider">
                <span className="material-symbols-outlined text-[17px] text-white">assured_workload</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-slate-900 uppercase leading-none">
                  NHRM-India
                </span>
                <span className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                  MoHFW • Emergency Allocation Command
                </span>
              </div>
            </div>

            <div className="h-5 w-px bg-slate-300 hidden md:block"></div>

            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 border border-slate-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-medium text-slate-800">Operational Surveillance Online</span>
            </div>

            <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-500 font-mono">
              <RefreshCw className="w-3 h-3 text-slate-400" />
              <span>{formattedSyncTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-red-50 text-red-800 px-2.5 py-1 border border-red-200 text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px] text-error">crisis_alert</span>
              <span className="hidden sm:inline">National Triage Active</span>
              <span className="sm:hidden">Triage</span>
            </div>

            <div className="h-5 w-px bg-slate-300 hidden md:block"></div>

            {/* Auth Profile Section */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {user.username}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    {getRoleDisplayName(user.role)} • Scope: {user.scope_id}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs" title={`${user.username} (${user.role})`}>
                  <UserCheck className="w-4 h-4 text-white" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onNavigate('login');
                  }}
                  className="ml-1 p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
                  title="Sign out & switch account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="px-3 py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Officer Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="hidden sm:flex px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Primary Operational Navigation Bar */}
        <div className="h-12 flex items-center justify-between overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-4 sm:gap-6 h-full select-none">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  data-path={item.id}
                  className={`h-full flex items-center gap-2 px-1 text-xs sm:text-[13px] transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border-b-2 border-black text-slate-950 font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-none font-mono ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            {isEmergencyOverride ? (
              <div className="flex items-center gap-1.5 bg-amber-500 text-white font-mono text-[11px] font-bold px-2.5 py-1 border border-amber-600 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>OVERRIDE ACTIVE (NDMA SEC 38)</span>
                <button
                  type="button"
                  onClick={disableEmergencyOverride}
                  className="ml-1 px-1.5 py-0.2 bg-amber-700 hover:bg-amber-800 text-[10px] uppercase font-bold cursor-pointer transition-colors"
                  title="Revoke emergency override"
                >
                  Revoke
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => enableEmergencyOverride('Header quick override')}
                className="text-[11px] font-mono bg-slate-100 hover:bg-amber-50 hover:text-amber-900 border border-slate-300 hover:border-amber-400 px-2.5 py-1 text-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Invoke statutory emergency override under NDMA Sec 38"
              >
                <Gavel className="w-3.5 h-3.5 text-amber-700" />
                <span>Emergency Override</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
