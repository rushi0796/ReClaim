const DatasetService = require('../services/datasetService');
const DecisionEngine = require('./decisionEngine');

const INTERVENTIONS = [
  'immediate_retry',
  'retry_later',
  'reminder',
  'payment_method_update'
];

class ValidationEngine {
  /**
   * Evaluates Leave-One-Out Cross-Validation (LOOCV) on historical dataset.
   * Prevents data leakage by removing each target sample from the dataset before predicting its outcome.
   * @returns {Object} Overall and intervention-level validation metrics
   */
  static validate() {
    const dataset = DatasetService.getHistoricalPayments();
    
    let totalSamples = 0;
    let correctPredictions = 0;
    let sumMAE = 0;
    let sumPredictedProb = 0;
    let sumActualOutcome = 0;

    const interventionStats = {};
    INTERVENTIONS.forEach(action => {
      interventionStats[action] = {
        sample_size: 0,
        correct_predictions: 0,
        sum_mae: 0,
        sum_predicted: 0,
        sum_actual: 0
      };
    });

    dataset.forEach((record, index) => {
      // Data Leakage Prevention: Create training set excluding current target record
      const trainingSet = dataset.filter((_, i) => i !== index);

      const actualOutcome = record.recovered === true ? 1 : 0;
      const action = record.intervention;

      // Evaluate intervention prediction using remaining records only (out-of-sample)
      const evalResult = DecisionEngine.evaluateIntervention(
        action,
        record.amount,
        record.failure_reason,
        record.customer_history,
        trainingSet
      );

      const predictedProb = evalResult.recovery_probability;
      const mae = Math.abs(predictedProb - actualOutcome);
      
      // Binary decision classification threshold at 0.5
      const predictedBinary = predictedProb >= 0.5 ? 1 : 0;
      const isCorrect = predictedBinary === actualOutcome;

      // Accumulate global metrics
      totalSamples++;
      if (isCorrect) correctPredictions++;
      sumMAE += mae;
      sumPredictedProb += predictedProb;
      sumActualOutcome += actualOutcome;

      // Accumulate per-intervention metrics
      if (interventionStats[action]) {
        const stats = interventionStats[action];
        stats.sample_size++;
        if (isCorrect) stats.correct_predictions++;
        stats.sum_mae += mae;
        stats.sum_predicted += predictedProb;
        stats.sum_actual += actualOutcome;
      }
    });

    const overallAccuracy = totalSamples > 0 ? (correctPredictions / totalSamples) : 0;
    const overallMAE = totalSamples > 0 ? (sumMAE / totalSamples) : 0;
    const overallPredictedRate = totalSamples > 0 ? (sumPredictedProb / totalSamples) : 0;
    const overallActualRate = totalSamples > 0 ? (sumActualOutcome / totalSamples) : 0;

    const interventionsBreakdown = {};
    INTERVENTIONS.forEach(action => {
      const stats = interventionStats[action];
      const size = stats.sample_size;
      interventionsBreakdown[action] = {
        sample_size: size,
        accuracy: size > 0 ? Math.round((stats.correct_predictions / size) * 10000) / 10000 : 0,
        accuracy_percentage: size > 0 ? (stats.correct_predictions / size * 100).toFixed(1) + '%' : '0%',
        mean_absolute_error: size > 0 ? Math.round((stats.sum_mae / size) * 10000) / 10000 : 0,
        predicted_recovery_rate: size > 0 ? Math.round((stats.sum_predicted / size) * 10000) / 10000 : 0,
        actual_recovery_rate: size > 0 ? Math.round((stats.sum_actual / size) * 10000) / 10000 : 0
      };
    });

    return {
      disclaimer: "DEMO DATA DISCLAIMER: Evaluated on synthetic historical payment dataset for Buildathon prototype demonstration. Does not represent live Razorpay production metrics.",
      methodology: "Leave-One-Out Cross-Validation (LOOCV) / Backtesting: Each historical payment outcome is sequentially withheld from the dataset. The decision engine calculates the predicted recovery probability using only the remaining historical outcomes to prevent data leakage. Out-of-sample predictions are then benchmarked against actual historical outcomes.",
      validation_samples: totalSamples,
      metrics: {
        accuracy: Math.round(overallAccuracy * 10000) / 10000,
        accuracy_percentage: (overallAccuracy * 100).toFixed(1) + '%',
        mean_absolute_error: Math.round(overallMAE * 10000) / 10000,
        predicted_recovery_rate: Math.round(overallPredictedRate * 10000) / 10000,
        actual_recovery_rate: Math.round(overallActualRate * 10000) / 10000
      },
      interventions: interventionsBreakdown
    };
  }
}

module.exports = ValidationEngine;
