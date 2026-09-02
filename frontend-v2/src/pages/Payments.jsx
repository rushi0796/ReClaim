import React, { useState, useEffect } from 'react';
import RecoveryQueue from '../components/RecoveryQueue';
import DecisionPanel from '../components/DecisionPanel';
import { analyzePayment } from '../services/api';

export default function Payments({ payments = [], onRefreshAudit, onRefreshQueue, onNavigateAudit }) {
  const [selectedPayment, setSelectedPayment] = useState(payments[0] || null);
  const [activeDecision, setActiveDecision] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (payments.length > 0 && !selectedPayment) {
      setSelectedPayment(payments[0]);
    }
  }, [payments]);

  const handleSelectPayment = async (payment) => {
    setSelectedPayment(payment);
    setIsAnalyzing(true);
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
      setActiveDecision(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Failed Payments</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          These payments failed but may still be recoverable. Select any payment to view AI recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecoveryQueue
            payments={payments}
            selectedPayment={selectedPayment}
            onSelectPayment={handleSelectPayment}
            onRefreshQueue={onRefreshQueue}
          />
        </div>

        <div className="lg:col-span-1">
          {isAnalyzing ? (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center space-y-3 shadow-2xs">
              <div className="w-6 h-6 rounded-full border-2 border-slate-900 border-t-transparent animate-spin mx-auto"></div>
              <span className="text-xs text-slate-500 font-mono block">Calling POST /api/recovery/analyze...</span>
            </div>
          ) : (
            <DecisionPanel
              payment={selectedPayment || payments[0]}
              decisionResult={activeDecision}
              onExecuted={onRefreshAudit}
              onNavigateAudit={onNavigateAudit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
