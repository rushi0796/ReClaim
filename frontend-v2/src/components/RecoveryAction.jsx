import React, { useState } from 'react';
import { simulateRecovery } from '../services/api';

export default function RecoveryAction({ payment, decisionResult, onExecuted, onNavigateAudit }) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [error, setError] = useState(null);

  const handleExecute = async () => {
    if (!payment || isExecuting || executionResult) return;
    setIsExecuting(true);
    setError(null);

    try {
      const res = await simulateRecovery({
        payment_id: payment.payment_id,
        amount: payment.amount,
        currency: payment.currency || 'INR',
        failure_reason: payment.failure_reason,
        customer_history: payment.customer_history
      });

      setExecutionResult(res);

      if (onExecuted) {
        onExecuted();
      }
    } catch (err) {
      setError(err.message || 'Failed to execute recovery action');
    } finally {
      setIsExecuting(false);
    }
  };

  const isExecuted = !!executionResult;
  const timeStr = executionResult?.execution?.timestamp
    ? new Date(executionResult.execution.timestamp).toLocaleTimeString('en-US', { hour12: false })
    : new Date().toLocaleTimeString('en-US', { hour12: false });

  const paymentUrl = executionResult?.execution?.details?.payment_url;

  return (
    <div className="space-y-3 pt-2 border-t border-slate-200 font-sans">
      <button
        type="button"
        onClick={handleExecute}
        disabled={isExecuting || isExecuted}
        className={`w-full font-bold py-2.5 px-4 rounded-lg transition shadow-2xs text-xs uppercase tracking-wider flex items-center justify-center space-x-2 ${
          isExecuted 
            ? 'bg-emerald-600 text-white cursor-default' 
            : 'bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white'
        }`}
      >
        {isExecuting ? (
          <span>Executing Recovery Action...</span>
        ) : isExecuted ? (
          <span>✓ Action Dispatched (Test Mode)</span>
        ) : (
          <span>EXECUTE RECOVERY</span>
        )}
      </button>

      <p className="text-[10px] text-slate-500 font-mono text-center">
        TEST MODE – No real money will be charged.
      </p>

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      {/* Execution Lifecycle Timeline */}
      <div className="space-y-2 pt-1 font-sans text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
            ✓
          </div>
          <div className="flex-1 flex justify-between">
            <span className="font-medium text-slate-900">Decision made</span>
            <span className="text-slate-400 font-mono text-[11px]">Recommended</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] ${
            isExecuted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
          }`}>
            {isExecuted ? '✓' : '•'}
          </div>
          <div className="flex-1 flex justify-between">
            <span className={`font-medium ${isExecuted ? 'text-slate-900' : 'text-slate-500'}`}>
              Recovery action dispatched
            </span>
            {isExecuted && <span className="text-slate-400 font-mono text-[11px]">{timeStr}</span>}
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] ${
            isExecuted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
          }`}>
            {isExecuted ? '✓' : '•'}
          </div>
          <div className="flex-1 flex justify-between">
            <span className={`font-medium ${isExecuted ? 'text-slate-900' : 'text-slate-500'}`}>
              Razorpay test-mode action created
            </span>
            {isExecuted && <span className="text-slate-400 font-mono text-[11px]">{timeStr}</span>}
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] ${
            isExecuted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
          }`}>
            {isExecuted ? '✓' : '•'}
          </div>
          <div className="flex-1 flex justify-between">
            <span className={`font-medium ${isExecuted ? 'text-slate-900' : 'text-slate-500'}`}>
              Audit event recorded
            </span>
            {isExecuted && <span className="text-slate-400 font-mono text-[11px]">{timeStr}</span>}
          </div>
        </div>
      </div>

      {isExecuted && (
        <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs font-sans space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-900">Recovery action ready</span>
            <span className="text-[10px] font-mono bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
              Ready
            </span>
          </div>

          {paymentUrl && (
            <div className="font-mono text-xs pt-1 border-t border-emerald-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Payment Link:</span>
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:underline font-semibold block truncate"
              >
                {paymentUrl}
              </a>
            </div>
          )}

          {onNavigateAudit && (
            <button
              onClick={onNavigateAudit}
              className="w-full text-xs font-semibold py-1.5 px-3 rounded bg-emerald-700 hover:bg-emerald-800 text-white transition text-center block mt-2 shadow-2xs"
            >
              View Audit Log →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
