import React from 'react';

export default function Alternatives({ alternatives = [] }) {
  const defaultAlternatives = [
    { action: 'reminder', recovery_probability: 0.69, expected_recovered_amount: 689.31, isTop: true },
    { action: 'retry_later', recovery_probability: 0.38, expected_recovered_amount: 379.62, isTop: false },
    { action: 'payment_method_update', recovery_probability: 0.25, expected_recovered_amount: 249.75, isTop: false },
    { action: 'immediate_retry', recovery_probability: 0.0, expected_recovered_amount: 0.0, isTop: false }
  ];

  const displayList = alternatives.length > 0 ? alternatives : defaultAlternatives;

  return (
    <div className="space-y-2 font-sans">
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
        ALTERNATIVES CONSIDERED
      </span>

      <div className="space-y-1.5 font-mono text-xs">
        {displayList.map(alt => {
          const actionText = alt.action ? alt.action.replace(/_/g, ' ') : 'Action';
          const probPct = (alt.recovery_probability * 100).toFixed(0) + '%';

          return (
            <div 
              key={alt.action} 
              className={`flex items-center justify-between p-2 rounded-md border text-xs transition ${
                alt.isTop 
                  ? 'bg-emerald-50/70 border-emerald-200 font-semibold text-slate-900' 
                  : 'bg-slate-50/80 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="capitalize font-sans font-medium">{actionText}</span>
                {alt.isTop && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-sans font-bold bg-emerald-600 text-white uppercase tracking-wider">
                    BEST OPTION
                  </span>
                )}
              </div>
              <span className="font-mono font-bold text-slate-900">{probPct}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
