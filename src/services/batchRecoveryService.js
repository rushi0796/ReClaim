const DatasetService = require('./datasetService');
const DecisionEngine = require('../engine/decisionEngine');

class BatchRecoveryService {
  /**
   * Async processing of payment dataset (live Razorpay payments from Upstash Redis + synthetic historical data).
   * @returns {Promise<Object>} Batch analytics summary and payment breakdown
   */
  static async analyzeBatchAsync() {
    const historicalDataset = DatasetService.getHistoricalPayments();
    const allPayments = await DatasetService.getAllPaymentsAsync();
    return this.computeBatchMetrics(allPayments, historicalDataset);
  }

  /**
   * Sync processing for backward compatibility.
   * @returns {Object}
   */
  static analyzeBatch() {
    const historicalDataset = DatasetService.getHistoricalPayments();
    const allPayments = DatasetService.getAllPayments();
    return this.computeBatchMetrics(allPayments, historicalDataset);
  }

  /**
   * Internal helper to compute batch analysis statistics.
   */
  static computeBatchMetrics(allPayments, historicalDataset) {
    let totalPayments = 0;
    let totalRevenueAtRisk = 0;
    let totalReclaimExpectedRecovery = 0;
    let totalBaselineExpectedRecovery = 0;
    let sumReclaimProbabilities = 0;

    const actionDistribution = {
      immediate_retry: 0,
      retry_later: 0,
      reminder: 0,
      payment_method_update: 0
    };

    const decisions = allPayments.map(payment => {
      const amount = Number(payment.amount);
      totalPayments++;
      totalRevenueAtRisk += amount;

      // 1. RECLAIM Optimal Decision using historical dataset as outcome reference
      const reclaimAnalysis = DecisionEngine.analyze(payment, historicalDataset);
      const rec = reclaimAnalysis.analysis;

      totalReclaimExpectedRecovery += rec.expected_recovered_amount;
      sumReclaimProbabilities += rec.recovery_probability;

      if (actionDistribution[rec.recommended_action] !== undefined) {
        actionDistribution[rec.recommended_action]++;
      }

      // 2. Baseline Evaluation (Naive Policy: immediate_retry)
      const baselineEval = DecisionEngine.evaluateIntervention(
        'immediate_retry',
        amount,
        payment.failure_reason,
        payment.customer_history,
        historicalDataset
      );
      totalBaselineExpectedRecovery += baselineEval.expected_recovered_amount;

      return {
        payment_id: payment.payment_id,
        amount: amount,
        currency: payment.currency || 'INR',
        failure_reason: payment.failure_reason,
        customer_history: payment.customer_history || null,
        recommended_action: rec.recommended_action,
        recovery_probability: rec.recovery_probability,
        expected_recovered_amount: rec.expected_recovered_amount,
        confidence: rec.confidence,
        is_live_test_mode: Boolean(payment.is_live_test_mode || payment.is_real_razorpay),
        raw_error_reason: payment.raw_error_reason || null,
        error_code: payment.error_code || null,
        error_description: payment.error_description || null,
        error_source: payment.error_source || null,
        error_step: payment.error_step || null,
        created_at: payment.created_at || null
      };
    });

    const roundedRisk = Math.round(totalRevenueAtRisk * 100) / 100;
    const roundedReclaimExpected = Math.round(totalReclaimExpectedRecovery * 100) / 100;
    const roundedBaselineExpected = Math.round(totalBaselineExpectedRecovery * 100) / 100;
    
    const expectedLiftAmount = Math.round((roundedReclaimExpected - roundedBaselineExpected) * 100) / 100;
    const expectedLiftPercentage = roundedBaselineExpected > 0 
      ? Math.round((expectedLiftAmount / roundedBaselineExpected) * 10000) / 100
      : 0;

    const expectedRecoveryRate = totalPayments > 0 
      ? Math.round((sumReclaimProbabilities / totalPayments) * 10000) / 10000
      : 0;

    return {
      disclaimer: "EXPECTED VALUE SIMULATION: Computed using synthetic historical payment dataset and live Razorpay Test Mode transactions.",
      total_payments: totalPayments,
      total_revenue_at_risk: roundedRisk,
      total_expected_recovery: roundedReclaimExpected,
      expected_recovery_rate: expectedRecoveryRate,
      expected_recovery_rate_percentage: (expectedRecoveryRate * 100).toFixed(1) + '%',
      action_distribution: actionDistribution,
      comparison: {
        baseline_policy: "Always apply immediate_retry",
        baseline_expected_recovery: roundedBaselineExpected,
        reclaim_expected_recovery: roundedReclaimExpected,
        expected_recovery_lift: expectedLiftAmount,
        expected_recovery_lift_percentage: expectedLiftPercentage.toFixed(1) + '%'
      },
      decisions: decisions
    };
  }
}

module.exports = BatchRecoveryService;
