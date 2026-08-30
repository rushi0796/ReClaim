import React from 'react';
import ValidationOverview from '../components/ValidationOverview';
import RecoveryAnalytics from '../components/RecoveryAnalytics';

export default function Analytics({ batchData, batchValidationData }) {
  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics & Validation</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Statistical proof, out-of-sample backtesting, and portfolio revenue recovery metrics
        </p>
      </div>

      {/* Primary: Out-of-Sample LOOCV Backtesting */}
      <ValidationOverview batchValidationData={batchValidationData} />

      {/* Secondary: In-Sample Expected Value Simulation */}
      <RecoveryAnalytics batchData={batchData} />
    </div>
  );
}
