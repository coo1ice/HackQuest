import React from 'react';
import type { PageId } from '../types/navigation';
import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  lastSyncTime?: string;
  onEmergencyOverride?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onNavigate,
  lastSyncTime = 'Sync: 4m ago (14:32 IST) • 5m interval',
  onEmergencyOverride,
}) => {
  const navItems: { id: PageId; label: string; badge?: string; badgeColor?: string }[] = [
    { id: 'national-overview', label: 'National Overview' },
    { id: 'state-district-drill-down', label: 'State & District Drill-down' },
    { id: 'urgent-alert-feed', label: 'Urgent Alert Feed', badge: '47', badgeColor: 'bg-error text-white' },
    { id: 'emergency-redistribution', label: 'Emergency Redistribution' },
    { id: 'inter-district-transfer-tracking', label: 'Inter-District Transfer Tracking', badge: '38', badgeColor: 'bg-secondary text-white' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-slate-300 shadow-sm">
      <div className="h-24 w-full px-4 sm:px-6 flex flex-col justify-between">
        {/* Top Incident Command Chrome */}
        <div className="h-12 flex items-center justify-between border-b border-slate-200/80">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('national-overview')}>
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
              <span className="font-medium text-slate-800">All 36 States &amp; UTs Connected</span>
            </div>

            <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-500 font-mono">
              <RefreshCw className="w-3 h-3 text-slate-400" />
              <span>{lastSyncTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-red-100 text-red-800 px-2.5 py-1 border border-red-200 text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px] text-error">crisis_alert</span>
              <span className="hidden sm:inline">National Triage Active</span>
              <span className="sm:hidden">Triage Active</span>
            </div>

            <div className="h-5 w-px bg-slate-300 hidden md:block"></div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">Dr. R. V. Ramanathan, IAS</div>
                <div className="text-[10px] text-slate-500 leading-tight">Joint Secy. • Central Allocation Officer</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                <span className="material-symbols-outlined text-white text-[18px]">person</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Operational Navigation Bar */}
        <div className="h-12 flex items-center justify-between overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-4 sm:gap-6 h-full select-none" data-active-classes="border-b-2 border-black text-slate-900 font-bold">
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

          <div className="hidden xl:flex items-center gap-2">
            <button
              onClick={onEmergencyOverride}
              className="text-[11px] font-mono bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              title="Press ESC to quickly focus emergency triage"
            >
              <kbd className="font-bold bg-white px-1 border border-slate-300">ESC</kbd>
              <span>Emergency Override Hotkey</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
