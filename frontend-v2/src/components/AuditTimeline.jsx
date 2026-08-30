import React from 'react';

export default function AuditTimeline({ auditLogs = [] }) {
  const sampleLogs = [
    {
      log_id: 'log_wh_demo_101',
      timestamp: new Date().toISOString(),
      payment_id: 'pay_demo_001',
      event_type: 'payment.failed',
      recommended_action: 'reminder',
      execution_status: 'executed',
      final_outcome: 'EXECUTED_IN_RAZORPAY_TEST_MODE'
    }
  ];

  const logsToDisplay = auditLogs && auditLogs.length > 0 ? auditLogs : sampleLogs;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden font-sans">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">AUDIT TRAIL LOG</h3>
          <p className="text-xs text-slate-500 font-medium">
            Immutable lifecycle log of recovery decisions, safety policies, and Razorpay dispatches
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
          {logsToDisplay.length} Records
        </span>
      </div>

      {logsToDisplay.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 font-mono">
          No audit records logged yet. Execute a recovery action to record audit entries.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3">Decision</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Execution</th>
                <th className="py-2.5 px-3 text-right">Event ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logsToDisplay.map((log, idx) => {
                const actionText = log.recommended_action 
                  ? log.recommended_action.replace(/_/g, ' ').toUpperCase()
                  : (log.details?.action ? log.details.action.toUpperCase() : 'REMINDER');

                const timeText = log.timestamp
                  ? new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })
                  : new Date().toLocaleTimeString('en-US', { hour12: false });

                const dateText = log.timestamp
                  ? new Date(log.timestamp).toLocaleDateString()
                  : new Date().toLocaleDateString();

                const statusText = log.execution_status || log.status || 'EXECUTED';
                const logId = log.log_id || log.event_id || `evt_${idx + 1}`;

                return (
                  <tr key={logId + '_' + idx} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {dateText} {timeText}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {log.payment_id || 'pay_demo_001'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center space-x-1.5 text-xs text-slate-800 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="capitalize">{log.failure_reason ? log.failure_reason.replace(/_/g, ' ') : 'insufficient funds'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        {actionText}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold uppercase">
                        {statusText}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500">
                      {logId}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
