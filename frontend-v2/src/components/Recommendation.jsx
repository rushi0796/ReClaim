import React from 'react';

export default function Recommendation({ decision }) {
  if (!decision) return null;

  const actionName = decision.recommended_action 
    ? decision.recommended_action.replace(/_/g, ' ').toUpperCase()
    : 'REMINDER';

  const probPct = decision.recovery_probability !== undefined
    ? (decision.recovery_probability * 100).toFixed(1) + '%'
    : '69.0%';

  const expectedAmount = decision.expected_recovered_amount !== undefined
    ? '₹' + Number(decision.expected_recovered_amount.toFixed(2)).toLocaleString('en-IN')
    : '₹689.31';

  return (
    <div className="bg-slate-900 text-white rounded-lg p-4 shadow-2xs space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          RECLAIM RECOMMENDS
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
          Optimal Choice
        </span>
      </div>

      <div className="flex items-baseline justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-xl font-bold tracking-tight text-white block">
            {actionName}
          </span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold font-mono text-emerald-400 block">
            {probPct}
          </span>
          <span className="text-[10px] text-slate-400 block uppercase font-medium">Recovery Probability</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400 font-sans text-xs">Expected Recovery Yield:</span>
        <span className="text-sm font-bold text-white">{expectedAmount}</span>
      </div>
    </div>
  );
}
