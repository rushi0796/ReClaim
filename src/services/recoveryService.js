const DatasetService = require('./datasetService');
const DecisionEngine = require('../engine/decisionEngine');
const ValidationEngine = require('../engine/validationEngine');
const BatchRecoveryService = require('./batchRecoveryService');
const BatchValidationService = require('./batchValidationService');
const RecoveryActionExecutor = require('./recoveryActionExecutor');
const { isEventProcessed, markEventProcessed } = require('../utils/idempotency');
const { logDecision, logWebhookExecution } = require('../utils/auditLogger');
const PolicyService = require('./policyService');

class RecoveryService {
  /**
   * Processes the entire historical dataset as a batch analysis.
   * @returns {Object} Batch analytics summary
   */
  static analyzeBatchRecovery() {
    return BatchRecoveryService.analyzeBatch();
  }

  /**
   * Performs Leave-One-Out Cross-Validation (LOOCV) batch backtesting.
   * @returns {Object} Out-of-sample performance metrics
   */
  static validateBatchRecovery() {
    return BatchValidationService.validateBatch();
  }
  /**
   * Processes incoming Razorpay payment failure webhook event:
   * Extracts context -> checks idempotency -> decision analysis -> safety policy check -> executes intervention -> logs audit.
   * @param {Object} eventBody 
   * @returns {Promise<Object>}
   */
  static async processWebhookEvent(eventBody) {
    const paymentEntity = eventBody.payload?.payment?.entity || eventBody;
    const paymentId = paymentEntity.id || eventBody.payment_id || `pay_test_${Date.now()}`;
    const eventType = eventBody.event || 'payment.failed';
    const eventId = eventBody.id || `${paymentId}_${eventType}`;

    // 1. Idempotency Check
    if (isEventProcessed(eventId)) {
      return {
        status: 'already_processed',
        event_id: eventId,
        payment_id: paymentId,
        message: 'Duplicate webhook event received. Action execution skipped for idempotency.'
      };
    }

    // 2. Extract and Normalize Payment Context
    let rawAmount = paymentEntity.amount !== undefined ? paymentEntity.amount : (eventBody.amount || 0);
    let amountInINR = rawAmount;
    if (rawAmount >= 100 && (paymentEntity.amount !== undefined || rawAmount % 100 === 0)) {
      amountInINR = rawAmount / 100;
    }
    if (eventBody.amount_in_inr) amountInINR = eventBody.amount_in_inr;

    const currency = paymentEntity.currency || eventBody.currency || 'INR';

    let rawFailure = paymentEntity.error_reason || paymentEntity.error_code || eventBody.failure_reason || 'insufficient_funds';
    let normalizedFailure = 'insufficient_funds';

    const lowerFailure = String(rawFailure).toLowerCase();
    if (lowerFailure.includes('fund') || lowerFailure.includes('balance') || lowerFailure.includes('insufficient')) {
      normalizedFailure = 'insufficient_funds';
    } else if (lowerFailure.includes('expire') || lowerFailure.includes('card_expired')) {
      normalizedFailure = 'expired_card';
    } else if (lowerFailure.includes('decline') || lowerFailure.includes('bank') || lowerFailure.includes('issuer')) {
      normalizedFailure = 'bank_declined';
    } else if (lowerFailure.includes('network') || lowerFailure.includes('timeout') || lowerFailure.includes('gateway')) {
      normalizedFailure = 'network_error';
    }

    const customerHistory = eventBody.customer_history || paymentEntity.notes?.customer_history || 'previously_recovered_after_reminder';
    const customer = {
      email: paymentEntity.email || eventBody.email || 'customer@example.com',
      contact: paymentEntity.contact || eventBody.contact || '+919999999999',
      name: paymentEntity.notes?.customer_name || 'Test Merchant Customer'
    };

    const paymentContext = {
      payment_id: paymentId,
      amount: amountInINR,
      currency: currency,
      failure_reason: normalizedFailure,
      customer_history: customerHistory,
      customer: customer,
      status: paymentEntity.status || eventBody.status,
      failure_timestamp: paymentEntity.created_at || eventBody.failure_timestamp || eventBody.timestamp
    };

    // 3. Decision Engine Analysis
    const dataset = DatasetService.getHistoricalPayments();
    const analysisResult = DecisionEngine.analyze(paymentContext, dataset);

    // 4. Safety & Policy Engine Evaluation
    const policyEvaluation = PolicyService.evaluatePolicy(paymentContext, analysisResult);

    let executionResult;
    if (policyEvaluation.allowed) {
      // 5. Recovery Action Execution (Test Mode / Simulated)
      const bestAction = analysisResult.analysis.recommended_action;
      executionResult = await RecoveryActionExecutor.execute(bestAction, paymentContext);
    } else {
      // Action Blocked by Policy Engine
      executionResult = {
        action: policyEvaluation.action,
        status: 'blocked',
        execution_mode: 'POLICY_ENGINE_BLOCKED',
        is_simulated: true,
        timestamp: new Date().toISOString(),
        details: {
          payment_id: paymentId,
          reason: policyEvaluation.reason,
          message: `Recovery action blocked by Safety & Policy Engine: ${policyEvaluation.reason}`
        }
      };
    }

    // 6. Mark Event as Processed (Idempotency)
    markEventProcessed(eventId, {
      payment_id: paymentId,
      action: policyEvaluation.allowed ? analysisResult.analysis.recommended_action : policyEvaluation.action,
      status: executionResult.status
    });

    // 7. Log Audit Record
    logWebhookExecution({
      event_type: eventType,
      event_id: eventId,
      payment_id: paymentId,
      amount: amountInINR,
      currency: currency,
      failure_reason: normalizedFailure,
      customer_history: customerHistory,
      analysis: analysisResult.analysis,
      policy_evaluation: policyEvaluation,
      execution: executionResult
    });

    return {
      status: policyEvaluation.allowed ? 'processed' : 'blocked',
      event_id: eventId,
      payment_id: paymentId,
      amount: amountInINR,
      currency: currency,
      failure_reason: normalizedFailure,
      analysis: analysisResult.analysis,
      alternatives: analysisResult.alternatives,
      policy_evaluation: policyEvaluation,
      execution: executionResult,
      audit_logged: true
    };
  }
  /**
   * Runs Leave-One-Out counterfactual validation across the historical dataset.
   * @returns {Object}
   */
  static validateEngine() {
    return ValidationEngine.validate();
  }

  /**
   * Analyzes payment failure context and determines optimal recovery action with empirical probabilities.
   * @param {Object} payload 
   * @returns {Object} Recovery analysis result
   */
  static analyzeRecovery(payload) {
    const dataset = DatasetService.getHistoricalPayments();
    const result = DecisionEngine.analyze(payload, dataset);

    const policyEvaluation = PolicyService.evaluatePolicy(payload, result);
    result.policy_evaluation = policyEvaluation;

    // Save decision to audit log
    logDecision(payload, result);

    return result;
  }

  /**
   * Legacy decision method preserved for backward compatibility with POST /api/recovery/decide.
   * @param {Object} payload 
   * @returns {Object}
   */
  static makeDecision(payload) {
    const { payment_id, amount, currency = 'INR', failure_reason } = payload;

    let action;
    let reason;

    switch (failure_reason) {
      case 'insufficient_funds':
        action = 'reminder';
        reason = 'Immediate retry is unlikely to succeed. Ask the customer to add funds.';
        break;

      case 'expired_card':
        action = 'update_payment_method';
        reason = 'The payment method has expired. Ask the customer to update it.';
        break;

      case 'bank_declined':
        action = 'retry_later';
        reason = 'A delayed retry may have a better chance of success.';
        break;

      default:
        action = 'retry';
        reason = 'The failure may be recoverable through a retry.';
    }

    return {
      payment_id,
      amount,
      currency,
      decision: {
        action,
        reason
      },
      status: 'decision_created'
    };
  }
}

module.exports = RecoveryService;
