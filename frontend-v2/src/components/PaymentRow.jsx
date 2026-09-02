import React from 'react';

export default function PaymentRow({ payment, isSelected, onSelect }) {
  const formattedAmount = '₹' + Number(payment.amount).toLocaleString('en-IN');
  const actionName = payment.recommended_action 
    ? payment.recommended_action.replace(/_/g, ' ').toUpperCase()
    : 'REMINDER';

  const probPct = payment.recovery_probability !== undefined 
    ? (payment.recovery_probability * 100).toFixed(1) + '%'
    : '69.0%';

  const failureText = payment.failure_reason 
    ? payment.failure_reason.replace(/_/g, ' ') 
    : 'insufficient funds';

  const isRealRazorpay = Boolean(payment.is_live_test_mode || payment.is_real_razorpay || String(payment.payment_id).startsWith('pay_TX') || String(payment.payment_id).startsWith('pay_rzp'));

  return (
    <>
      {/* Desktop Table Row */}
      <tr
        onClick={() => onSelect(payment)}
        className={`hidden sm:table-row cursor-pointer transition text-xs border-b border-slate-100 ${
          isSelected ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'
        }`}
      >
        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
          <div className="flex items-center space-x-1.5">
            <span>{payment.payment_id}</span>
            {isRealRazorpay && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                REAL TEST
              </span>
            )}
          </div>
        </td>
        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
          {formattedAmount}
        </td>
        <td className="py-2.5 px-3 text-slate-600 capitalize">
          {failureText}
        </td>
        <td className="py-2.5 px-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {actionName}
          </span>
        </td>
        <td className="py-2.5 px-3 font-mono text-slate-900 font-semibold">
          {probPct}
        </td>
        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
          {isRealRazorpay ? 'Razorpay Webhook' : 'Evaluated'}
        </td>
        <td className="py-2.5 px-3 text-right">
          <button className="text-xs text-slate-700 hover:text-slate-900 font-medium underline font-mono text-[11px]">
            Inspect →
          </button>
        </td>
      </tr>

      {/* Mobile Stacked Payment Card */}
      <div
        onClick={() => onSelect(payment)}
        className={`sm:hidden p-3 rounded-lg border text-xs cursor-pointer transition space-y-1.5 ${
          isSelected 
            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' 
            : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <span className={`font-mono font-semibold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
              {payment.payment_id}
            </span>
            {isRealRazorpay && (
              <span className="px-1 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                REAL TEST
              </span>
            )}
          </div>
          <span className={`font-mono font-bold text-sm ${isSelected ? 'text-emerald-400' : 'text-slate-900'}`}>
            {formattedAmount}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className={`capitalize ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
            {failureText}
          </span>
          <span className={`px-2 py-0.5 rounded font-medium text-[10px] ${
            isSelected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {actionName} ({probPct})
          </span>
        </div>
      </div>
    </>
  );
}
