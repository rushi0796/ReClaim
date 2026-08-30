import React, { useState } from 'react';
import RecoveryAnalytics from '../components/RecoveryAnalytics';
import AuditTimeline from '../components/AuditTimeline';
import DecisionPanel from '../components/DecisionPanel';
import { analyzePayment } from '../services/api';

export default function Recovery({ batchData, auditLogs = [], payments = [] }) {
  const [selectedPayment, setSelectedPayment] = useState(payments[0] || null);
  const [activeDecision, setActiveDecision] = useState(null);

  const handleSelectPayment = async (payment) => {
    setSelectedPayment(payment);
    try {
      const res = await analyzePayment({
        payment_id: payment.payment_id,
        amount: payment.amount,
        currency: payment.currency || 'INR',
        failure_reason: payment.failure_reason || 'insufficient_funds',
        customer_history: payment.customer_history || 'first_time_failure'
      });
      setActiveDecision(res.analysis);
    } catch (err) {
      console.warn('Analysis fetch error:', err.message);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recovery Command</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Review and execute AI-selected recovery actions across your merchant account
        </p>
      </div>

      {/* Visual 5-step Flow */}
      <div className="bg-slate-900 text-white p-3 rounded-lg flex items-center justify-around text-xs font-mono font-semibold shadow-2xs">
        <span className="text-rose-400">1. PAYMENT FAILED</span>
        <span className="text-slate-500">→</span>
        <span className="text-amber-300">2. RECLAIM ANALYZED</span>
        <span className="text-slate-500">→</span>
        <span className="text-emerald-400">3. ACTION SELECTED</span>
        <span className="text-slate-500">→</span>
        <span className="text-blue-300">4. SAFETY CHECKS</span>
        <span className="text-slate-500">→</span>
        <span className="text-white font-bold bg-emerald-600 px-2 py-0.5 rounded">5. EXECUTE</span>
      </div>

      {/* Portfolio Distribution Analytics */}
      <RecoveryAnalytics batchData={batchData} />

      {/* Audit Timeline Log */}
      <AuditTimeline auditLogs={auditLogs} />
    </div>
  );
}
