import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No active records found',
  description = 'There are currently no matching telemetry records or alerts in this category.',
  actionText,
  onAction,
}) => {
  return (
    <div className="w-full bg-white border border-slate-300 p-8 flex flex-col items-center justify-center gap-2.5 text-center my-2 shadow-xs">
      <div className="w-10 h-10 bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
        <Inbox className="w-5 h-5 text-slate-600" />
      </div>
      <div className="text-xs font-bold text-slate-900 tracking-tight">
        {title}
      </div>
      <div className="text-xs text-slate-600 max-w-md leading-relaxed">
        {description}
      </div>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
