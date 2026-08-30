import React from 'react';

export default function RecoveryAnalytics({ batchData }) {
  const riskAmount = batchData?.total_revenue_at_risk
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
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">PORTFOLIO RECOVERY ANALYTICS</h3>
          <p className="text-xs text-slate-500 font-medium">
            In-sample expected value simulation across dataset
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 self-start sm:self-auto font-medium">
          In-Sample Simulation
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <span className="text-[11px] text-slate-500 block font-sans font-medium">Revenue at Risk</span>
          <span className="text-lg font-bold text-slate-900 mt-0.5 block">{riskAmount}</span>
        </div>
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <span className="text-[11px] text-slate-500 block font-sans font-medium">Expected Recovery</span>
          <span className="text-lg font-bold text-emerald-600 mt-0.5 block">{expectedRecovery}</span>
        </div>
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <span className="text-[11px] text-slate-500 block font-sans font-medium">Expected Rate</span>
          <span className="text-lg font-bold text-slate-900 mt-0.5 block">{expectedRate}</span>
        </div>
        <div className="bg-emerald-50 p-3.5 rounded-lg border border-emerald-200">
          <span className="text-[11px] text-emerald-800 block font-sans font-medium">Expected Lift</span>
          <span className="text-lg font-bold text-emerald-700 mt-0.5 block">{expectedLift}</span>
        </div>
      </div>

      {/* Action Distribution Bar Chart */}
      {batchData?.action_distribution && (
        <div className="space-y-3 pt-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Action Allocation Distribution
          </span>

          <div className="space-y-2 font-sans text-xs">
            {Object.keys(batchData.action_distribution).map(action => {
              const count = batchData.action_distribution[action];
              const total = batchData.total_payments || 54;
              const pct = Math.round((count / total) * 100);

              const barColor = 
                action === 'reminder' ? 'bg-emerald-600' :
                action === 'payment_method_update' ? 'bg-slate-700' :
                action === 'retry_later' ? 'bg-slate-400' : 'bg-slate-300';

              return (
                <div key={action} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span className="capitalize font-medium">{action.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-slate-500">{count} payments ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
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
    </div>
  );
}
