import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading operational telemetry records...',
}) => {
  return (
    <div className="w-full bg-white border border-slate-300 p-8 flex flex-col items-center justify-center gap-3 text-center my-2 shadow-xs">
      <div className="w-8 h-8 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-slate-600 animate-spin" />
      </div>
      <div className="text-xs font-semibold text-slate-800 tracking-tight">
        {message}
      </div>
      <div className="text-[11px] text-slate-500 font-mono">
        Connecting to national surveillance node
      </div>
    </div>
  );
};
