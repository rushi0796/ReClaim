import React from 'react';

export default function Reasoning({ reason }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
        WHY RECLAIM CHOSE THIS
      </span>
      <p className="text-xs text-slate-700 leading-relaxed font-normal">
        {reason || '9 of 13 similar historical reminder attempts recovered.'}
      </p>
    </div>
  );
}
