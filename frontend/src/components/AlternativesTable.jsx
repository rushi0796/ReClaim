import React from 'react';

export default function AlternativesTable({ recommendedAction, recommendedMetrics, alternatives = [] }) {
  // Combine recommended intervention + alternatives into a single sorted list
  const list = [];
  if (recommendedAction && recommendedMetrics) {
    list.push({
      action: recommendedAction,
      recovery_probability: recommendedMetrics.recovery_probability,
      expected_recovered_amount: recommendedMetrics.expected_recovered_amount,
      isRecommended: true
    });
  }

  alternatives.forEach(alt => {
    if (alt.action !== recommendedAction) {
      list.push({
        action: alt.action,
        recovery_probability: alt.recovery_probability,
        expected_recovered_amount: alt.expected_recovered_amount,
        isRecommended: false
      });
    }
  });

  // Sort by expected recovery descending
  list.sort((a, b) => b.expected_recovered_amount - a.expected_recovered_amount);

  return (
    <div className="bg-white border border-[#EAECF0] rounded-xl p-5 md:p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#111827] uppercase tracking-wider">
          Evaluated Interventions Comparison
        </h3>
        <p className="text-xs text-[#667085] mt-0.5">
          Empirical probability and expected recovered value across all candidate interventions
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#EAECF0] text-[#667085] font-medium">
              <th className="py-2.5 px-3">Intervention</th>
              <th className="py-2.5 px-3">Recovery probability</th>
              <th className="py-2.5 px-3">Expected recovery</th>
              <th className="py-2.5 px-3 text-right">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAECF0]">
            {list.map(item => {
              const formattedName = item.action.replace(/_/g, ' ');
              const probPct = (item.recovery_probability * 100).toFixed(1) + '%';
              const expectedVal = '₹' + Number(item.expected_recovered_amount.toFixed(2)).toLocaleString('en-IN');

              return (
                <tr 
                  key={item.action} 
                  className={item.isRecommended ? 'bg-[#F6FEF9]' : 'hover:bg-[#F9FAFB]'}
                >
                  <td className="py-3 px-3 font-medium text-[#111827] capitalize">
                    {formattedName}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#344054]">
                    {probPct}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#111827] font-semibold">
                    {expectedVal}
                  </td>
                  <td className="py-3 px-3 text-right font-medium">
                    {item.isRecommended ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF3] text-[#027A48] border border-[#ABE5C6]">
                        Recommended
                      </span>
                    ) : (
                      <span className="text-[#98A2B3] text-[11px]">Evaluated</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="sm:hidden space-y-2.5">
        {list.map(item => {
          const formattedName = item.action.replace(/_/g, ' ');
          const probPct = (item.recovery_probability * 100).toFixed(1) + '%';
          const expectedVal = '₹' + Number(item.expected_recovered_amount.toFixed(2)).toLocaleString('en-IN');

          return (
            <div 
              key={item.action}
              className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                item.isRecommended ? 'bg-[#F6FEF9] border-[#ABE5C6]' : 'bg-white border-[#EAECF0]'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#111827] capitalize">{formattedName}</span>
                {item.isRecommended && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#ECFDF3] text-[#027A48] border border-[#ABE5C6]">
                    Recommended
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono text-[#667085] pt-1 border-t border-[#EAECF0]/60">
                <span>Probability: <strong className="text-[#111827]">{probPct}</strong></span>
                <span>Expected: <strong className="text-[#111827]">{expectedVal}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
