import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PaymentForm from './components/PaymentForm';
import RevenueAtRiskCard from './components/RevenueAtRiskCard';
import RecommendationCard from './components/RecommendationCard';
import AlternativesTable from './components/AlternativesTable';
import ReasonCard from './components/ReasonCard';
import ValidationCard from './components/ValidationCard';
import StatusExecutionCard from './components/StatusExecutionCard';
import BatchRecoveryCard from './components/BatchRecoveryCard';
import EmptyState from './components/EmptyState';
import { fetchHealth, analyzePayment, validateEngine, simulateRecovery, batchAnalyze, batchValidate } from './services/api';

export default function App() {
  const [formData, setFormData] = useState({
    payment_id: 'pay_demo_001',
    amount: 999,
    currency: 'INR',
    failure_reason: 'insufficient_funds',
    customer_history: 'previously_recovered_after_reminder'
  });

  const [healthData, setHealthData] = useState(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);

  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [batchData, setBatchData] = useState(null);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);

  const [batchValidationData, setBatchValidationData] = useState(null);
  const [isValidatingBatch, setIsValidatingBatch] = useState(false);

  const [validationData, setValidationData] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const [errorMessage, setErrorMessage] = useState(null);

  // Initial Health Check
  useEffect(() => {
    fetchHealth()
      .then(data => setHealthData(data))
      .catch(err => console.warn('Health check error:', err.message))
      .finally(() => setIsHealthLoading(false));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? (value ? Number(value) : '') : value
    }));
  };

  const handleSelectPreset = async (presetKey) => {
    let preset = {};
    if (presetKey === 'demo1') {
      preset = {
        payment_id: 'pay_demo_001',
        amount: 999,
        currency: 'INR',
        failure_reason: 'insufficient_funds',
        customer_history: 'previously_recovered_after_reminder'
      };
    } else if (presetKey === 'demo2') {
      preset = {
        payment_id: 'pay_demo_002',
        amount: 1299,
        currency: 'INR',
        failure_reason: 'expired_card',
        customer_history: 'first_time_failure'
      };
    }

    setFormData(preset);
    await triggerAnalysis(preset);
  };

  const triggerAnalysis = async (payloadToAnalyze) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setSimulationResult(null);

    try {
      const result = await analyzePayment(payloadToAnalyze);
      setAnalysisData(result);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to analyze payment failure');
      setAnalysisData(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    triggerAnalysis(formData);
  };

  const handleFetchValidation = async () => {
    setIsValidating(true);
    try {
      const data = await validateEngine();
      setValidationData(data);
    } catch (err) {
      setErrorMessage(`Validation error: ${err.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRunBatch = async () => {
    setIsBatchAnalyzing(true);
    try {
      const data = await batchAnalyze();
      setBatchData(data);
    } catch (err) {
      setErrorMessage(`Batch analysis error: ${err.message}`);
    } finally {
      setIsBatchAnalyzing(false);
    }
  };

  const handleRunBatchValidate = async () => {
    setIsValidatingBatch(true);
    try {
      const data = await batchValidate();
      setBatchValidationData(data);
    } catch (err) {
      setErrorMessage(`Batch validation error: ${err.message}`);
    } finally {
      setIsValidatingBatch(false);
    }
  };

  const handleSimulateRecovery = async () => {
    if (!analysisData) return;
    setIsSimulating(true);
    try {
      const res = await simulateRecovery({
        payment_id: analysisData.payment_id,
        amount: analysisData.amount,
        currency: analysisData.currency,
        failure_reason: formData.failure_reason,
        customer_history: formData.customer_history
      });
      setSimulationResult(res);
    } catch (err) {
      setErrorMessage(`Simulation execution error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#111827] pb-16 font-sans">
      <Header health={healthData} isHealthLoading={isHealthLoading} />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
        {/* Main Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#EAECF0] gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              Revenue Recovery
            </h1>
            <p className="text-sm text-[#667085] mt-1 font-normal">
              Recover more failed payments with data-driven intervention decisions.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-[#667085] font-medium self-start sm:self-auto bg-white px-3 py-1.5 rounded-lg border border-[#EAECF0] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#12B76A]"></span>
            <span>Test environment • Razorpay connected</span>
          </div>
        </div>

        {/* Payment Failure Analysis Workspace */}
        <PaymentForm
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleFormSubmit}
          isLoading={isAnalyzing}
          onSelectPreset={handleSelectPreset}
        />

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-[#FEF3F2] border border-[#FECDCA] rounded-xl p-4 text-[#B42318] text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-[#B42318] underline font-medium hover:text-[#912018]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Analysis Results View */}
        {!analysisData && !isAnalyzing ? (
          <EmptyState onSelectPreset={handleSelectPreset} />
        ) : (
          <div className="space-y-6">
            {/* Top Metrics Row: Revenue at Risk & Recommendation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RevenueAtRiskCard
                amount={analysisData?.amount || formData.amount}
                currency={analysisData?.currency || formData.currency}
                paymentId={analysisData?.payment_id || formData.payment_id}
                failureReason={formData.failure_reason}
              />

              <RecommendationCard
                analysis={analysisData?.analysis}
              />
            </div>

            {/* Alternatives Ranking */}
            <AlternativesTable
              recommendedAction={analysisData?.analysis?.recommended_action}
              recommendedMetrics={analysisData?.analysis}
              alternatives={analysisData?.alternatives}
            />

            {/* Why RECLAIM Chose This Explanation */}
            <ReasonCard
              reason={analysisData?.analysis?.reason}
            />

            {/* Recovery Execution Timeline */}
            <StatusExecutionCard
              analysis={analysisData?.analysis}
              simulationResult={simulationResult}
              isSimulating={isSimulating}
              onSimulate={handleSimulateRecovery}
            />
          </div>
        )}

        {/* Model Validation Section */}
        <ValidationCard
          validationData={validationData}
          isLoading={isValidating}
          onFetchValidation={handleFetchValidation}
        />

        {/* Portfolio Recovery Analytics Section */}
        <BatchRecoveryCard
          batchData={batchData}
          batchValidationData={batchValidationData}
          isLoading={isBatchAnalyzing}
          isValidating={isValidatingBatch}
          onRunBatch={handleRunBatch}
          onRunBatchValidate={handleRunBatchValidate}
        />

        {/* Footer Synthetic Disclaimer */}
        <footer className="pt-6 border-t border-[#EAECF0] text-center text-xs text-[#98A2B3] font-medium">
          Demo environment • Metrics shown here are calculated from synthetic historical payment data and do not represent live Razorpay production recovery.
        </footer>
      </main>
    </div>
  );
}
