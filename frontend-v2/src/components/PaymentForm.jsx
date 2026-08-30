import React from 'react';

export default function PaymentForm({ formData, onChange, onSubmit, isLoading, onSelectPreset }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-200 gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">ANALYZE FAILED PAYMENT</h2>
          <p className="text-xs text-slate-500 font-medium">
            Enter custom failure context to compute empirical recovery probabilities
          </p>
        </div>

        <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-slate-50 p-1 rounded-md border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 px-2">Presets:</span>
          <button
            type="button"
            onClick={() => onSelectPreset('demo1')}
            className="text-xs px-2.5 py-1 rounded bg-white text-slate-800 font-semibold hover:text-slate-900 border border-slate-200 shadow-2xs transition"
          >
            Funds Failure (₹999)
          </button>
          <button
            type="button"
            onClick={() => onSelectPreset('demo2')}
            className="text-xs px-2.5 py-1 rounded bg-white text-slate-800 font-semibold hover:text-slate-900 border border-slate-200 shadow-2xs transition"
          >
            Expired Card (₹1,299)
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Payment ID
            </label>
            <input
              type="text"
              name="payment_id"
              value={formData.payment_id}
              onChange={onChange}
              required
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Amount (INR)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={onChange}
              required
              min="1"
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Currency
            </label>
            <input
              type="text"
              name="currency"
              value={formData.currency}
              onChange={onChange}
              required
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Failure Reason
            </label>
            <select
              name="failure_reason"
              value={formData.failure_reason}
              onChange={onChange}
              className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="insufficient_funds">Insufficient Funds (insufficient_funds)</option>
              <option value="expired_card">Card Expired (expired_card)</option>
              <option value="bank_declined">Bank Declined (bank_declined)</option>
              <option value="network_error">Network Error (network_error)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Customer History Context
            </label>
            <select
              name="customer_history"
              value={formData.customer_history}
              onChange={onChange}
              className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="previously_recovered_after_reminder">Previously Recovered After Reminder</option>
              <option value="first_time_failure">First Time Failure</option>
              <option value="frequent_failed_attempts">Frequent Failed Attempts</option>
              <option value="active_subscriber">Active Subscriber</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-md transition shadow-2xs text-xs"
        >
          {isLoading ? 'Analyzing Payment Context...' : 'Analyze Payment'}
        </button>
      </form>
    </div>
  );
}
