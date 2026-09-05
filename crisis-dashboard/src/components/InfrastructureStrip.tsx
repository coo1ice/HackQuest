import React from 'react';
import { Wind, Snowflake } from 'lucide-react';

export const InfrastructureStrip: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
      {/* PSA Oxygen Generation Plants */}
      <div className="bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-100 text-secondary">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              PSA Oxygen Generation Plants
            </div>
            <div className="text-xs font-bold text-slate-900 tabular-nums">
              1,842 / 1,910 Operational
            </div>
          </div>
        </div>
        <span className="text-xs font-bold text-secondary bg-white border border-slate-200 px-2.5 py-1">
          96.4% Nominal
        </span>
      </div>

      {/* Cold Chain Freezers */}
      <div className="bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-100 text-secondary">
            <Snowflake className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Cold Chain Freezers (ILR / Deep Freezer)
            </div>
            <div className="text-xs font-bold text-slate-900 tabular-nums">
              28,104 / 28,450 Operational
            </div>
          </div>
        </div>
        <span className="text-xs font-bold text-secondary bg-white border border-slate-200 px-2.5 py-1">
          98.8% Nominal
        </span>
      </div>
    </div>
  );
};
