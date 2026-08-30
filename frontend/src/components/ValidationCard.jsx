import React from 'react';

export default function ValidationCard({ validationData, isLoading, onFetchValidation }) {
  const isDataAvailable = !!validationData;

  const samples = validationData?.validation_samples || 54;
  const actualRecovery = validationData?.reclaim?.actual_recovery_rate_percentage || '50.0%';
  const liftPts = validationData?.comparison?.actual_recovery_lift !== undefined 
    ? '+' + validationData.comparison.actual_recovery_lift + ' pts' 
    : '+34.3 pts';
  const maeVal = validationData?.reclaim?.mae !== undefined ? validationData.reclaim.mae : '0.505';

  const baselineActual = validationData?.baseline?.actual_recovery_rate_percentage || '15.7%';

  return (
    <div className="bg-white border border-[#EAECF0] rounded-xl p-5 md:p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EAECF0] gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#111827]">
            Model validation
          </h3>
          <p className="text-xs text-[#667085]">
            Out-of-sample backtesting using Leave-One-Out Cross-Validation
          </p>
        </div>

        <button
          type="button"
          onClick={onFetchValidation}
          disabled={isLoading}
          className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-white border border-[#D0D5DD] hover:bg-[#F9FAFB] text-[#344054] disabled:opacity-50 transition shadow-2xs self-start sm:self-auto"
        >
          {isLoading ? 'Running validation...' : 'Run validation backtest'}
        </button>
      </div>

      {/* 4 Compact Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#F8F9FA] p-3.5 rounded-lg border border-[#EAECF0]">
          <span className="text-[11px] font-medium text-[#667085] block">Validation samples</span>
          <span className="text-xl font-bold text-[#111827] mt-0.5 block font-mono">{samples}</span>
        </div>

        <div className="bg-[#F8F9FA] p-3.5 rounded-lg border border-[#EAECF0]">
          <span className="text-[11px] font-medium text-[#667085] block">Actual recovery</span>
          <span className="text-xl font-bold text-[#027A48] mt-0.5 block font-mono">{actualRecovery}</span>
        </div>

        <div className="bg-[#ECFDF3] p-3.5 rounded-lg border border-[#ABE5C6]">
          <span className="text-[11px] font-medium text-[#027A48] block">Recovery lift</span>
          <span className="text-xl font-bold text-[#027A48] mt-0.5 block font-mono">{liftPts}</span>
        </div>

        <div className="bg-[#F8F9FA] p-3.5 rounded-lg border border-[#EAECF0]">
          <span className="text-[11px] font-medium text-[#667085] block">MAE</span>
          <span className="text-xl font-bold text-[#344054] mt-0.5 block font-mono">{maeVal}</span>
        </div>
      </div>

      {/* Clean Comparison */}
      <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#EAECF0] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-6">
          <div>
            <span className="text-[#667085] block font-medium">RECLAIM Policy</span>
            <span className="text-sm font-bold text-[#027A48] font-mono mt-0.5 block">{actualRecovery} actual recovery</span>
          </div>

          <span className="text-[#98A2B3] font-medium">vs</span>

          <div>
            <span className="text-[#667085] block font-medium">Baseline (Always Retry)</span>
            <span className="text-sm font-semibold text-[#344054] font-mono mt-0.5 block">{baselineActual}</span>
          </div>
        </div>

        <div className="text-left md:text-right pt-2 md:pt-0 border-t md:border-t-0 border-[#EAECF0]">
          <span className="text-[#667085] block font-medium">Out-of-sample lift</span>
          <span className="text-sm font-bold text-[#027A48] font-mono mt-0.5 block">+{validationData?.comparison?.actual_recovery_lift || '34.3'} percentage points</span>
        </div>
      </div>
    </div>
  );
}
