import React from 'react';

export default function RecommendationCard({ analysis }) {
  if (!analysis) return null;

  const actionName = analysis.recommended_action 
    ? analysis.recommended_action.replace(/_/g, ' ').toUpperCase()
    : 'N/A';

  const probPct = analysis.recovery_probability !== undefined 
    ? (analysis.recovery_probability * 100).toFixed(1) + '%'
    : '0%';

  const expectedAmount = analysis.expected_recovered_amount !== undefined
    ? '₹' + Number(analysis.expected_recovered_amount.toFixed(2)).toLocaleString('en-IN')
    : '₹0';

  const confidence = analysis.confidence || 'high';

  return (
    <div className="bg-white border border-[#EAECF0] rounded-xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#667085]">
            RECLAIM recommendation
          </span>
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#ECFDF3] border border-[#ABE5C6] text-[#027A48] capitalize">
            {confidence} confidence
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-xs text-[#667085] block font-medium">RECOMMENDED INTERVENTION</span>
            <div className="text-2xl md:text-3xl font-bold text-[#111827] tracking-tight mt-0.5">
              {actionName}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-[#667085] block font-medium">RECOVERY PROBABILITY</span>
            <span className="text-2xl md:text-3xl font-bold text-[#027A48] tracking-tight mt-0.5">
              {probPct}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-[#EAECF0] flex items-center justify-between">
        <span className="text-xs text-[#667085] font-medium">Expected recovery value</span>
        <span className="text-base font-bold text-[#111827] font-mono">{expectedAmount}</span>
      </div>
    </div>
  );
}
