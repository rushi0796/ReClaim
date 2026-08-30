const DatasetService = require('./datasetService');
const DecisionEngine = require('../engine/decisionEngine');

class BatchRecoveryService {
  /**
   * Processes the entire historical dataset as a batch analysis.
   * Calculates total revenue at risk, baseline expected recovery, RECLAIM expected recovery,
   * expected recovery lift, action distribution, and per-payment decision list.
   * @returns {Object} Batch analytics summary and payment breakdown
   */
  static analyzeBatch() {
    const dataset = DatasetService.getHistoricalPayments();
    
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

    const decisions = dataset.map(payment => {
      const amount = Number(payment.amount);
      totalPayments++;
      totalRevenueAtRisk += amount;

      // 1. RECLAIM Optimal Decision
      const reclaimAnalysis = DecisionEngine.analyze(payment, dataset);
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
        dataset
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
        confidence: rec.confidence
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
      disclaimer: "SYNTHETIC DEMO DATA – EXPECTED VALUE SIMULATION: Computed using synthetic historical payment data for Buildathon prototype demonstration. Does not represent actual live recovered funds.",
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
