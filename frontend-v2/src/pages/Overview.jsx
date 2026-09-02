import React, { useState, useRef } from 'react';
import OverviewStats from '../components/OverviewStats';
import RecoveryQueue from '../components/RecoveryQueue';
import DecisionPanel from '../components/DecisionPanel';
import PaymentForm from '../components/PaymentForm';
import { analyzePayment } from '../services/api';

export default function Overview({ batchData, batchValidationData, payments = [], onRefreshAudit, onNavigateAudit }) {
  const [selectedPayment, setSelectedPayment] = useState(payments[0] || null);
  const [activeDecision, setActiveDecision] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalyzeForm, setShowAnalyzeForm] = useState(false);

  const queueRef = useRef(null);

  const [formData, setFormData] = useState({
    payment_id: 'pay_demo_001',
    amount: 999,
    currency: 'INR',
    failure_reason: 'insufficient_funds',
    customer_history: 'previously_recovered_after_reminder'
  });

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

  const handleScrollToQueue = () => {
    if (queueRef.current) {
      queueRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? (value ? Number(value) : '') : value
    }));
  };

  const handleSelectPreset = (presetKey) => {
    if (presetKey === 'demo1') {
      setFormData({
        payment_id: 'pay_demo_001',
        amount: 999,
        currency: 'INR',
        failure_reason: 'insufficient_funds',
        customer_history: 'previously_recovered_after_reminder'
      });
    } else {
      setFormData({
        payment_id: 'pay_demo_002',
        amount: 1299,
        currency: 'INR',
        failure_reason: 'expired_card',
        customer_history: 'first_time_failure'
      });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsAnalyzing(true);
    try {
      const res = await analyzePayment(formData);
      const paymentObj = {
        payment_id: res.payment_id,
        amount: res.amount,
        currency: res.currency,
        failure_reason: formData.failure_reason,
        customer_history: formData.customer_history,
        recommended_action: res.analysis.recommended_action,
        recovery_probability: res.analysis.recovery_probability,
        expected_recovered_amount: res.analysis.expected_recovered_amount
      };
      setSelectedPayment(paymentObj);
      setActiveDecision(res.analysis);
    } catch (err) {
      console.error('Analyze error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">RECLAIM</h1>
            <span className="text-slate-300 font-bold">•</span>
            <span className="text-sm font-semibold text-slate-600">AI Revenue Recovery</span>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold ml-1">
              by RUSHIKESH.STUDIO
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold border border-slate-200 ml-1">
              TEST MODE
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Automatically decide what to do when payments fail.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={handleScrollToQueue}
            className="text-xs font-semibold px-3.5 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition shadow-2xs"
          >
            View Failed Payments →
          </button>
          <button
            onClick={() => setShowAnalyzeForm(!showAnalyzeForm)}
            className="text-xs font-semibold px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            {showAnalyzeForm ? 'Hide Form' : '+ Custom Input'}
          </button>
        </div>
      </div>

      {/* 4 Compact Overview KPI Cards */}
      <OverviewStats
        batchData={batchData}
        batchValidationData={batchValidationData}
      />

      {/* Expandable Custom Payment Input Form */}
      {showAnalyzeForm && (
        <PaymentForm
          formData={formData}
          onChange={handleFormChange}
          onSubmit={handleFormSubmit}
          isLoading={isAnalyzing}
          onSelectPreset={handleSelectPreset}
        />
      )}

      {/* Main Workspace Grid: Recovery Queue (Left) & Decision Panel (Right) */}
      <div ref={queueRef} className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Payments Needing Recovery</h2>
            <p className="text-xs text-slate-500 font-medium">
              RECLAIM has detected failed payments that may still be recoverable.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
          <div className="lg:col-span-2">
            <RecoveryQueue
              payments={payments}
              selectedPayment={selectedPayment}
              onSelectPayment={handleSelectPayment}
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
    </div>
  );
}
