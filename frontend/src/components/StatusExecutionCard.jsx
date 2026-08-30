import React from 'react';

export default function StatusExecutionCard({ analysis, simulationResult, isSimulating, onSimulate }) {
  if (!analysis) return null;

  const timestampStr = simulationResult?.execution?.timestamp
    ? new Date(simulationResult.execution.timestamp).toLocaleTimeString('en-US', { hour12: false })
    : new Date().toLocaleTimeString('en-US', { hour12: false });

  const isExecuted = !!simulationResult;
  const actionName = analysis.recommended_action ? analysis.recommended_action.replace(/_/g, ' ').toUpperCase() : 'ACTION';

  return (
    <div className="bg-white border border-[#EAECF0] rounded-xl p-5 md:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EAECF0] gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#111827]">
            Recovery execution & status
          </h3>
          <p className="text-xs text-[#667085]">
            Dispatch recovery intervention via Razorpay Test Mode pipeline
          </p>
        </div>

        <button
          type="button"
          onClick={onSimulate}
          disabled={isSimulating}
          className="text-xs font-medium px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1f2937] text-white disabled:opacity-50 transition shadow-2xs self-start sm:self-auto flex items-center space-x-1.5"
        >
          {isSimulating ? (
            <span>Simulating...</span>
          ) : (
            <span>Simulate recovery</span>
          )}
        </button>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-3 font-sans pt-1">
        {/* Step 1: Decision Made */}
        <div className="flex items-start space-x-3 text-xs">
          <div className="w-5 h-5 rounded-full bg-[#ECFDF3] text-[#12B76A] flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
            ✓
          </div>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <span className="font-semibold text-[#111827]">Decision made</span>
              <span className="text-[#667085] ml-2 font-mono text-[11px]">{actionName} selected</span>
            </div>
            <span className="text-[11px] font-mono text-[#98A2B3]">{timestampStr}</span>
          </div>
        </div>

        {/* Step 2: Action Dispatched */}
        <div className="flex items-start space-x-3 text-xs">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 ${
            isExecuted ? 'bg-[#ECFDF3] text-[#12B76A]' : 'bg-[#F2F4F7] text-[#98A2B3]'
          }`}>
            {isExecuted ? '✓' : '•'}
          </div>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <span className={`font-semibold ${isExecuted ? 'text-[#111827]' : 'text-[#667085]'}`}>
                Action dispatched
              </span>
              <span className="text-[#667085] ml-2 font-mono text-[11px]">
                {isExecuted 
                  ? (simulationResult.execution?.details?.payment_url ? 'Razorpay payment link generated' : 'Test intervention dispatched')
                  : 'Awaiting execution'
                }
              </span>
            </div>
            {isExecuted && <span className="text-[11px] font-mono text-[#98A2B3]">{timestampStr}</span>}
          </div>
        </div>

        {/* Step 3: Audit Logged */}
        <div className="flex items-start space-x-3 text-xs">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 ${
            isExecuted ? 'bg-[#ECFDF3] text-[#12B76A]' : 'bg-[#F2F4F7] text-[#98A2B3]'
          }`}>
            {isExecuted ? '✓' : '•'}
          </div>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <span className={`font-semibold ${isExecuted ? 'text-[#111827]' : 'text-[#667085]'}`}>
                Audit logged
              </span>
              <span className="text-[#667085] ml-2 font-mono text-[11px]">
                {isExecuted ? 'Recovery event recorded to audit_logs.json' : 'Pending'}
              </span>
            </div>
            {isExecuted && <span className="text-[11px] font-mono text-[#98A2B3]">{timestampStr}</span>}
          </div>
        </div>
      </div>

      {/* Payment Link Output if generated */}
      {simulationResult?.execution?.details?.payment_url && (
        <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#EAECF0] text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
          <span className="text-[#667085]">Test Payment Link:</span>
          <a
            href={simulationResult.execution.details.payment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#027A48] hover:underline font-semibold truncate"
          >
            {simulationResult.execution.details.payment_url}
          </a>
        </div>
      )}
    </div>
  );
}
