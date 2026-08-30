import React from 'react';

export default function PaymentForm({ formData, onChange, onSubmit, isLoading, onSelectPreset }) {
  return (
    <div className="bg-white border border-[#EAECF0] rounded-xl p-5 md:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-5 border-b border-[#EAECF0] gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#111827] tracking-tight">
            Analyze failed payment
          </h2>
          <p className="text-xs text-[#667085] mt-0.5">
            Enter the failed payment context and let RECLAIM select the highest-value intervention.
          </p>
        </div>

        {/* Subtle Preset Controls */}
        <div className="flex items-center space-x-1.5 self-start md:self-auto bg-[#F8F9FA] p-1 rounded-lg border border-[#EAECF0]">
          <span className="text-[11px] font-medium text-[#98A2B3] px-2">Presets:</span>
          <button
            type="button"
            onClick={() => onSelectPreset('demo1')}
            className="text-xs px-2.5 py-1 rounded-md bg-white text-[#344054] font-medium hover:text-[#111827] border border-[#D0D5DD] shadow-2xs transition"
          >
            Funds Failure (₹999)
          </button>
          <button
            type="button"
            onClick={() => onSelectPreset('demo2')}
            className="text-xs px-2.5 py-1 rounded-md bg-white text-[#344054] font-medium hover:text-[#111827] border border-[#D0D5DD] shadow-2xs transition"
          >
            Card Expired (₹1,299)
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Row 1: Payment ID, Amount, Currency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#344054] mb-1.5">
              Payment ID
            </label>
            <input
              type="text"
              name="payment_id"
              value={formData.payment_id}
              onChange={onChange}
              required
              className="w-full bg-white border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent font-mono transition"
              placeholder="pay_demo_001"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#344054] mb-1.5">
              Amount (INR)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={onChange}
              required
              min="1"
              className="w-full bg-white border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent font-mono transition"
              placeholder="999"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#344054] mb-1.5">
              Currency
            </label>
            <input
              type="text"
              name="currency"
              value={formData.currency}
              onChange={onChange}
              required
              className="w-full bg-white border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent font-mono transition"
            />
          </div>
        </div>

        {/* Row 2: Failure Reason, Customer History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#344054] mb-1.5">
              Failure Reason
            </label>
            <select
              name="failure_reason"
              value={formData.failure_reason}
              onChange={onChange}
              className="w-full bg-white border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent transition"
            >
              <option value="insufficient_funds">Insufficient Funds (insufficient_funds)</option>
              <option value="expired_card">Card Expired (expired_card)</option>
              <option value="bank_declined">Bank Declined (bank_declined)</option>
              <option value="network_error">Network Error (network_error)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#344054] mb-1.5">
              Customer History Context
            </label>
            <select
              name="customer_history"
              value={formData.customer_history}
              onChange={onChange}
              className="w-full bg-white border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent transition"
            >
              <option value="previously_recovered_after_reminder">Previously Recovered After Reminder</option>
              <option value="first_time_failure">First Time Failure</option>
              <option value="frequent_failed_attempts">Frequent Failed Attempts</option>
              <option value="active_subscriber">Active Subscriber</option>
            </select>
          </div>
        </div>

        {/* Action Button: Dark #111827 */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#111827] hover:bg-[#1f2937] disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition shadow-sm text-sm flex items-center justify-center space-x-2 mt-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing...</span>
            </>
          ) : (
            <span>Analyze payment</span>
          )}
        </button>
      </form>
    </div>
  );
}
