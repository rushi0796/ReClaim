import React from 'react';

export default function RevenueAtRiskCard({ amount, currency, paymentId, failureReason }) {
  return (
    <div className="bg-white border border-[#EAECF0] rounded-xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#667085]">
            Revenue at risk
          </span>
          <span className="text-[11px] font-mono text-[#98A2B3] px-2 py-0.5 rounded bg-[#F8F9FA] border border-[#EAECF0]">
            {currency || 'INR'}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-3xl md:text-4xl font-bold text-[#111827] tracking-tight">
            ₹{Number(amount).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-[#EAECF0] grid grid-cols-2 gap-2 text-xs font-mono">
        <div>
          <span className="text-[#98A2B3] block text-[11px]">PAYMENT ID</span>
          <span className="text-[#344054] font-medium truncate block">{paymentId}</span>
        </div>
        <div>
          <span className="text-[#98A2B3] block text-[11px]">FAILURE REASON</span>
          <span className="text-[#344054] font-medium block capitalize">{failureReason ? failureReason.replace(/_/g, ' ') : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
