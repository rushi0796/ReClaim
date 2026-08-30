const ALL_INTERVENTIONS = [
  'immediate_retry',
  'retry_later',
  'reminder',
  'payment_method_update'
];

class DecisionEngine {
  /**
   * Evaluates historical dataset and selects the best recovery intervention.
   * @param {Object} payment - Failed payment context payload
   * @param {Array<Object>} historicalData - Synthetic dataset of payment outcomes
   * @returns {Object} Recovery analysis with recommended action and ranked alternatives
   */
  static analyze(payment, historicalData = []) {
    const amount = Number(payment.amount);
    const failureReason = payment.failure_reason;
    const customerHistory = payment.customer_history;

    const evaluations = ALL_INTERVENTIONS.map(action => {
      return this.evaluateIntervention(action, amount, failureReason, customerHistory, historicalData);
    });

    // Sort by expected_recovered_amount descending, then recovery_probability descending
    evaluations.sort((a, b) => {
      if (b.expected_recovered_amount !== a.expected_recovered_amount) {
        return b.expected_recovered_amount - a.expected_recovered_amount;
      }
      return b.recovery_probability - a.recovery_probability;
    });

    const best = evaluations[0];
    const alternatives = evaluations.slice(1).map(item => ({
      action: item.action,
      recovery_probability: item.recovery_probability,
      expected_recovered_amount: item.expected_recovered_amount
    }));

    return {
      payment_id: payment.payment_id,
      amount: amount,
      currency: payment.currency || 'INR',
      analysis: {
        recommended_action: best.action,
        recovery_probability: best.recovery_probability,
        expected_recovered_amount: best.expected_recovered_amount,
        confidence: best.confidence,
        reason: best.reason
      },
      alternatives: alternatives
    };
  }

  /**
   * Calculates empirical recovery probability and expected recovery amount for a single intervention.
   */
  static evaluateIntervention(action, amount, failureReason, customerHistory, dataset) {
    let matchingRecords = [];
    let matchContextLevel = 'exact';

    // 1. Try exact context match (failure_reason + customer_history)
    if (customerHistory) {
      matchingRecords = dataset.filter(r => 
        r.failure_reason === failureReason && 
        r.customer_history === customerHistory && 
        r.intervention === action
      );
    }

    // 2. Fallback to failure_reason context match if exact context has insufficient data (< 3 samples)
    if (matchingRecords.length < 3) {
      const reasonRecords = dataset.filter(r => 
        r.failure_reason === failureReason && 
        r.intervention === action
      );
      if (reasonRecords.length > 0) {
        matchingRecords = reasonRecords;
        matchContextLevel = 'failure_reason';
      } else {
        // 3. Global fallback for this intervention
        matchingRecords = dataset.filter(r => r.intervention === action);
        matchContextLevel = 'global';
      }
    }

    const totalAttempts = matchingRecords.length;
    const successfulRecoveries = matchingRecords.filter(r => r.recovered === true).length;
    
    const rawProbability = totalAttempts > 0 ? (successfulRecoveries / totalAttempts) : 0;
    const recoveryProbability = Math.round(rawProbability * 10000) / 10000; // 4 decimals precision (or 2: Math.round(rawProbability * 100) / 100)
    const formattedProbability = Math.round(rawProbability * 100) / 100; // 2 decimal places for clean UI output

    const expectedRecoveredAmount = Math.round(amount * formattedProbability * 100) / 100;

    let confidence = 'low';
    if (totalAttempts >= 10) {
      confidence = 'high';
    } else if (totalAttempts >= 5) {
      confidence = 'medium';
    } else if (totalAttempts === 0) {
      confidence = 'none';
    }

    let reason = '';
    const pct = (formattedProbability * 100).toFixed(1);
    if (matchContextLevel === 'exact') {
      const contextTotal = dataset.filter(r => r.failure_reason === failureReason && r.customer_history === customerHistory).length;
      reason = `Out of ${contextTotal} total records matching failure reason '${failureReason}' and customer history '${customerHistory}', intervention '${action}' was tested ${totalAttempts} times with ${successfulRecoveries} successful recoveries (${successfulRecoveries}/${totalAttempts} = ${pct}%). Expected recovery: ${paymentCurrencySymbol(amount)}${expectedRecoveredAmount.toFixed(2)}.`;
    } else if (matchContextLevel === 'failure_reason') {
      const contextTotal = dataset.filter(r => r.failure_reason === failureReason).length;
      reason = `Out of ${contextTotal} total records matching failure reason '${failureReason}', intervention '${action}' was tested ${totalAttempts} times with ${successfulRecoveries} successful recoveries (${successfulRecoveries}/${totalAttempts} = ${pct}%). Expected recovery: ${paymentCurrencySymbol(amount)}${expectedRecoveredAmount.toFixed(2)}.`;
    } else {
      reason = `Global baseline data shows ${pct}% recovery rate (${successfulRecoveries}/${totalAttempts} attempts) for intervention '${action}'.`;
    }

    return {
      action,
      recovery_probability: formattedProbability,
      expected_recovered_amount: expectedRecoveredAmount,
      confidence,
      reason,
      total_attempts: totalAttempts,
      successful_recoveries: successfulRecoveries
    };
  }
}

function paymentCurrencySymbol(amount) {
  return '₹';
}

module.exports = DecisionEngine;
