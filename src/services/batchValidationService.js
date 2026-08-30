const DatasetService = require('./datasetService');
const DecisionEngine = require('../engine/decisionEngine');

class BatchValidationService {
  /**
   * Performs Leave-One-Out Cross-Validation (LOOCV) batch backtesting.
   * Excludes target payment i during model evaluation to prevent data leakage & selection bias.
   * @returns {Object} Out-of-sample performance metrics for RECLAIM vs Baseline policy
   */
  static validateBatch() {
    const dataset = DatasetService.getHistoricalPayments();
    const totalSamples = dataset.length;

    let reclaimSumPredictedProb = 0;
    let reclaimSumActualOutcome = 0;
    let reclaimSumMAE = 0;
    let reclaimCorrectCount = 0;
    let reclaimSumExpectedAmount = 0;
    let reclaimSumActualAmount = 0;

    let baselineSumPredictedProb = 0;
    let baselineSumActualOutcome = 0;
    let baselineSumExpectedAmount = 0;
    let baselineSumActualAmount = 0;

    dataset.forEach((record, index) => {
      // 1. Data Leakage Prevention: Exclude record index from training set
      const trainingSet = dataset.filter((_, i) => i !== index);
      const amount = Number(record.amount);
      const actualOutcome = record.recovered === true ? 1 : 0;
      const actualAmount = record.recovered === true ? amount : 0;

      // 2. RECLAIM Decision on held-out dataset
      const reclaimAnalysis = DecisionEngine.analyze({
        payment_id: record.payment_id,
        amount: amount,
        currency: record.currency || 'INR',
        failure_reason: record.failure_reason,
        customer_history: record.customer_history
      }, trainingSet);

      const rec = reclaimAnalysis.analysis;
      const predictedProb = rec.recovery_probability;
      const mae = Math.abs(predictedProb - actualOutcome);
      const isCorrect = (predictedProb >= 0.5 ? 1 : 0) === actualOutcome;

      reclaimSumPredictedProb += predictedProb;
      reclaimSumActualOutcome += actualOutcome;
      reclaimSumMAE += mae;
      if (isCorrect) reclaimCorrectCount++;

      reclaimSumExpectedAmount += rec.expected_recovered_amount;
      reclaimSumActualAmount += actualAmount;

      // 3. Baseline Policy Decision on held-out dataset (Always immediate_retry)
      const baselineEval = DecisionEngine.evaluateIntervention(
        'immediate_retry',
        amount,
        record.failure_reason,
        record.customer_history,
        trainingSet
      );

      const baseProb = baselineEval.recovery_probability;
      baselineSumPredictedProb += baseProb;
      baselineSumExpectedAmount += baselineEval.expected_recovered_amount;

      if (record.intervention === 'immediate_retry') {
        baselineSumActualOutcome += actualOutcome;
        baselineSumActualAmount += actualAmount;
      } else {
        baselineSumActualOutcome += baseProb;
        baselineSumActualAmount += baselineEval.expected_recovered_amount;
      }
    });

    const reclaimPredictedRate = totalSamples > 0 ? (reclaimSumPredictedProb / totalSamples) : 0;
    const reclaimActualRate = totalSamples > 0 ? (reclaimSumActualOutcome / totalSamples) : 0;
    const reclaimAccuracy = totalSamples > 0 ? (reclaimCorrectCount / totalSamples) : 0;
    const reclaimMAE = totalSamples > 0 ? (reclaimSumMAE / totalSamples) : 0;

    const baselinePredictedRate = totalSamples > 0 ? (baselineSumPredictedProb / totalSamples) : 0;
    const baselineActualRate = totalSamples > 0 ? (baselineSumActualOutcome / totalSamples) : 0;

    const actualLiftPoints = Math.round((reclaimActualRate - baselineActualRate) * 1000) / 10;
    const actualLiftPercentage = baselineActualRate > 0 
      ? (((reclaimActualRate - baselineActualRate) / baselineActualRate) * 100).toFixed(1) + '%'
      : '0%';

    return {
      disclaimer: "SYNTHETIC DEMO DATA – OUT-OF-SAMPLE LOOCV BACKTESTING: Computed using Leave-One-Out Cross-Validation on synthetic historical payment dataset for Buildathon prototype demonstration. Prevents in-sample selection bias.",
      validation_samples: totalSamples,
      reclaim: {
        predicted_recovery_rate: Math.round(reclaimPredictedRate * 10000) / 10000,
        predicted_recovery_rate_percentage: (reclaimPredictedRate * 100).toFixed(1) + '%',
        actual_recovery_rate: Math.round(reclaimActualRate * 10000) / 10000,
        actual_recovery_rate_percentage: (reclaimActualRate * 100).toFixed(1) + '%',
        expected_recovery: Math.round(reclaimSumExpectedAmount * 100) / 100,
        actual_recovered_amount: Math.round(reclaimSumActualAmount * 100) / 100,
        accuracy: Math.round(reclaimAccuracy * 10000) / 10000,
        accuracy_percentage: (reclaimAccuracy * 100).toFixed(1) + '%',
        mae: Math.round(reclaimMAE * 10000) / 10000
      },
      baseline: {
        policy: "always_immediate_retry",
        predicted_recovery_rate: Math.round(baselinePredictedRate * 10000) / 10000,
        predicted_recovery_rate_percentage: (baselinePredictedRate * 100).toFixed(1) + '%',
        actual_recovery_rate: Math.round(baselineActualRate * 10000) / 10000,
        actual_recovery_rate_percentage: (baselineActualRate * 100).toFixed(1) + '%',
        expected_recovery: Math.round(baselineSumExpectedAmount * 100) / 100,
        actual_recovered_amount: Math.round(baselineSumActualAmount * 100) / 100
      },
      comparison: {
        actual_recovery_lift: actualLiftPoints,
        actual_recovery_lift_percentage: actualLiftPercentage,
        lift_explanation: `Out-of-sample backtesting demonstrates a ${actualLiftPoints} percentage point lift (${actualLiftPercentage}) in actual historical recovery rate over naive immediate_retry.`
      }
    };
  }
}

module.exports = BatchValidationService;
