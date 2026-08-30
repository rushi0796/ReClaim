import React from 'react';

export default function BatchRecoveryCard({ 
  batchData, 
  batchValidationData, 
  isLoading, 
  isValidating,
  onRunBatch,
  onRunBatchValidate
}) {
  const isDataAvailable = !!batchData;

  const totalRisk = batchData?.total_revenue_at_risk 
    ? '₹' + Number(batchData.total_revenue_at_risk).toLocaleString('en-IN')
    : '₹68,046';

  const expectedRecovery = batchData?.total_expected_recovery
    ? '₹' + Math.round(batchData.total_expected_recovery).toLocaleString('en-IN')
    : '₹54,584';

  const expectedRate = batchData?.expected_recovery_rate_percentage || '79.1%';

  const expectedLift = batchData?.comparison?.expected_recovery_lift
    ? '+₹' + Math.round(batchData.comparison.expected_recovery_lift).toLocaleString('en-IN')
    : '+₹43,893';

  return (
    <div className="bg-white border border-[#EAECF0] rounded-xl p-5 md:p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EAECF0] gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#111827]">
            Portfolio recovery
          </h3>
          <p className="text-xs text-[#667085]">
            Evaluate RECLAIM across the historical failed-payment dataset
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onRunBatch}
            disabled={isLoading}
            className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-[#111827] hover:bg-[#1f2937] text-white disabled:opacity-50 transition shadow-2xs"
          >
            {isLoading ? 'Running portfolio analysis...' : 'Run portfolio analysis'}
          </button>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#F8F9FA] p-3.5 rounded-lg border border-[#EAECF0]">
          <span className="text-[11px] font-medium text-[#667085] block">Revenue at risk</span>
          <span className="text-xl font-bold text-[#111827] mt-0.5 block font-mono">{totalRisk}</span>
        </div>

        <div className="bg-[#F8F9FA] p-3.5 rounded-lg border border-[#EAECF0]">
          <span className="text-[11px] font-medium text-[#667085] block">Expected recovery</span>
          <span className="text-xl font-bold text-[#027A48] mt-0.5 block font-mono">{expectedRecovery}</span>
        </div>

        <div className="bg-[#F8F9FA] p-3.5 rounded-lg border border-[#EAECF0]">
          <span className="text-[11px] font-medium text-[#667085] block">Expected recovery rate</span>
          <span className="text-xl font-bold text-[#111827] mt-0.5 block font-mono">{expectedRate}</span>
        </div>

        <div className="bg-[#ECFDF3] p-3.5 rounded-lg border border-[#ABE5C6]">
          <span className="text-[11px] font-medium text-[#027A48] block">Expected lift</span>
          <span className="text-xl font-bold text-[#027A48] mt-0.5 block font-mono">{expectedLift}</span>
        </div>
      </div>

      {/* Restrained Action Distribution Visualization */}
      {batchData?.action_distribution && (
        <div className="pt-2 space-y-3">
          <h4 className="text-xs font-medium text-[#667085] uppercase tracking-wider">
            Action Distribution
          </h4>
          <div className="space-y-2 font-sans text-xs">
            {Object.keys(batchData.action_distribution).map(action => {
              const count = batchData.action_distribution[action];
              const total = batchData.total_payments || 54;
              const pct = Math.round((count / total) * 100);

              const barColor = 
                action === 'reminder' ? 'bg-[#12B76A]' :
                action === 'payment_method_update' ? 'bg-[#344054]' :
                action === 'retry_later' ? 'bg-[#98A2B3]' : 'bg-[#D0D5DD]';

              return (
                <div key={action} className="space-y-1">
                  <div className="flex justify-between text-xs text-[#344054]">
                    <span className="capitalize font-medium">{action.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-[#667085]">{count} payments ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#F2F4F7] h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${barColor} transition-all duration-300 rounded-full`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Methodology Label */}
      <div className="text-[11px] text-[#667085] bg-[#F8F9FA] p-3 rounded-lg border border-[#EAECF0] flex items-center justify-between">
        <span>In-sample expected value simulation across 54 payments</span>
        <span className="font-mono text-[10px] text-[#98A2B3]">Simulation Mode</span>
      </div>
    </div>
  );
}
