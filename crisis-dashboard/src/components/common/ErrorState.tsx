import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Data retrieval interrupted',
  message,
  onRetry,
}) => {
  return (
    <div className="w-full bg-red-50/70 border border-red-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs my-2">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-error" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-red-950 uppercase tracking-wide">
            {title}
          </span>
          <p className="text-xs text-red-900/90 leading-relaxed mt-0.5 max-w-2xl">
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 bg-white hover:bg-red-50 border border-red-300 text-red-900 text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer self-end sm:self-center shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-error" />
          <span>Retry connection</span>
        </button>
      )}
    </div>
  );
};
