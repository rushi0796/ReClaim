import React, { useState } from 'react';
import PaymentRow from './PaymentRow';

export default function RecoveryQueue({ payments = [], selectedPayment, onSelectPayment }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredPayments = payments.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const searchTarget = `${p.payment_id} ${p.failure_reason || ''} ${p.raw_error_reason || ''} ${p.error_code || ''} ${p.error_description || ''} ${p.recommended_action || ''}`.toLowerCase();
    const matchesSearch = !q || searchTarget.includes(q);
    const matchesReason = reasonFilter === 'all' || p.failure_reason === reasonFilter;
    const matchesAction = actionFilter === 'all' || p.recommended_action === actionFilter;
    return matchesSearch && matchesReason && matchesAction;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
      {/* Header & Dense Filter Bar */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">RECOVERY QUEUE</h2>
            <p className="text-xs text-slate-500 font-medium">
              Click any payment to inspect empirical decision model ({filteredPayments.length} records)
            </p>
          </div>
        </div>

        {/* Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <input
            type="text"
            placeholder="Search Payment ID or Error..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
          />

          <select
            value={reasonFilter}
            onChange={e => setReasonFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Failure Reasons</option>
            <option value="insufficient_funds">Insufficient Funds</option>
            <option value="expired_card">Expired Card</option>
            <option value="bank_declined">Bank Declined</option>
            <option value="network_error">Network Error</option>
          </select>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Actions</option>
            <option value="reminder">Reminder</option>
            <option value="payment_method_update">Payment Method Update</option>
            <option value="retry_later">Retry Later</option>
            <option value="immediate_retry">Immediate Retry</option>
          </select>
        </div>
      </div>

      {/* Desktop Dense Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-2 px-3">Payment ID</th>
              <th className="py-2 px-3">Amount</th>
              <th className="py-2 px-3">Failure Reason</th>
              <th className="py-2 px-3">RECLAIM Action</th>
              <th className="py-2 px-3">Probability</th>
              <th className="py-2 px-3">Source</th>
              <th className="py-2 px-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-xs text-slate-400 font-mono">
                  No payment failure records matched the selected filters.
                </td>
              </tr>
            ) : (
              filteredPayments.map(p => (
                <PaymentRow
                  key={p.payment_id}
                  payment={p}
                  isSelected={selectedPayment?.payment_id === p.payment_id}
                  onSelect={onSelectPayment}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="sm:hidden p-3 space-y-2">
        {filteredPayments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-mono">
            No payment failure records matched.
          </div>
        ) : (
          filteredPayments.map(p => (
            <PaymentRow
              key={p.payment_id}
              payment={p}
              isSelected={selectedPayment?.payment_id === p.payment_id}
              onSelect={onSelectPayment}
            />
          ))
        )}
      </div>
    </div>
  );
}
