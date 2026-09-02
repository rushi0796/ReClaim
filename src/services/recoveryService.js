const DatasetService = require('./datasetService');
const DecisionEngine = require('../engine/decisionEngine');
const ValidationEngine = require('../engine/validationEngine');
const BatchRecoveryService = require('./batchRecoveryService');
const BatchValidationService = require('./batchValidationService');
const RecoveryActionExecutor = require('./recoveryActionExecutor');
const AiReasoningService = require('./aiReasoningService');
const RazorpayService = require('./razorpayService');
const { isEventProcessed, markEventProcessed } = require('../utils/idempotency');
const { logDecision, logWebhookExecution } = require('../utils/auditLogger');
const PolicyService = require('./policyService');

class RecoveryService {
  /**
   * Synchronizes failed Test Mode payments directly from Razorpay API.
   * @returns {Promise<Object>}
   */
  static async syncRazorpayFailedPayments() {
    try {
      const rawItems = await RazorpayService.fetchFailedPayments({ count: 20 });
      const syncedPayments = [];

      for (const item of rawItems) {
        const rawAmount = item.amount || 0;
        const amountInINR = rawAmount >= 100 ? rawAmount / 100 : rawAmount;
        const currency = item.currency || 'INR';

        const rawFailure = item.error_reason || item.error_code || 'payment_failed';
        const errorCode = item.error_code || null;
        const errorDescription = item.error_description || null;
        const errorSource = item.error_source || null;
        const errorStep = item.error_step || null;

        let normalizedFailure = 'insufficient_funds';
        const lowerFailure = String(rawFailure).toLowerCase() + ' ' + String(errorSource).toLowerCase() + ' ' + String(errorDescription).toLowerCase();

        if (lowerFailure.includes('fund') || lowerFailure.includes('balance') || lowerFailure.includes('insufficient')) {
          normalizedFailure = 'insufficient_funds';
        } else if (lowerFailure.includes('expire') || lowerFailure.includes('card_expired')) {
          normalizedFailure = 'expired_card';
        } else if (lowerFailure.includes('decline') || lowerFailure.includes('bank') || lowerFailure.includes('issuer') || lowerFailure.includes('authorization') || lowerFailure.includes('payment_failed')) {
          normalizedFailure = 'bank_declined';
        } else if (lowerFailure.includes('network') || lowerFailure.includes('timeout') || lowerFailure.includes('gateway')) {
          normalizedFailure = 'network_error';
        }

        const paymentRecord = {
          payment_id: item.id,
          amount: amountInINR,
          currency: currency,
          failure_reason: normalizedFailure,
          raw_error_reason: rawFailure,
          error_code: errorCode,
          error_description: errorDescription,
          error_source: errorSource,
          error_step: errorStep,
          customer_history: item.notes?.customer_history || 'first_time_failure',
          status: item.status || 'failed',
          created_at: item.created_at ? new Date(item.created_at * 1000).toISOString() : new Date().toISOString()
        };

        const saved = DatasetService.saveLivePayment(paymentRecord);
        syncedPayments.push(saved);
      }

      return {
        status: 'success',
        synced_count: syncedPayments.length,
        payments: syncedPayments
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        synced_count: 0,
        payments: []
      };
    }
  }

  /**
   * Processes the payment dataset as a batch analysis.
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
   * Processes incoming Razorpay payment webhook event (payment.failed, payment.captured):
   * Validates event -> checks idempotency -> saves to live dataset -> GenAI analysis -> safety policy check -> executes intervention -> logs audit.
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

    // Handle payment.captured lifecycle event
    if (eventType === 'payment.captured' || paymentEntity.status === 'captured') {
      const rawAmount = paymentEntity.amount !== undefined ? paymentEntity.amount : (eventBody.amount || 0);
      const amountInINR = rawAmount >= 100 ? rawAmount / 100 : rawAmount;
      
      const captureRecord = DatasetService.saveLivePayment({
        payment_id: paymentId,
        amount: amountInINR,
        currency: paymentEntity.currency || eventBody.currency || 'INR',
        status: 'captured',
        failure_reason: 'none',
        is_live_test_mode: true
      });

      const captureResult = {
        status: 'captured_processed',
        event_type: eventType,
        event_id: eventId,
        payment_id: paymentId,
        amount: amountInINR,
        currency: paymentEntity.currency || eventBody.currency || 'INR',
        payment_status: 'captured',
        message: 'Payment successfully captured in Razorpay Test Mode. Recovery lifecycle completed and future interventions stopped.',
        policy_evaluation: {
          allowed: false,
          reason: 'payment_already_recovered',
          action: 'stop'
        },
        execution: {
          action: 'stop',
          status: 'captured',
          execution_mode: 'PAYMENT_CAPTURED_RECOVERY_STOPPED',
          is_simulated: true,
          timestamp: new Date().toISOString()
        },
        audit_logged: true
      };

      markEventProcessed(eventId, { payment_id: paymentId, status: 'captured' });
      logWebhookExecution({
        event_type: eventType,
        event_id: eventId,
        payment_id: paymentId,
        amount: amountInINR,
        currency: paymentEntity.currency || 'INR',
        failure_reason: 'none',
        analysis: { recommended_action: 'stop', recovery_probability: 1.0, expected_recovered_amount: amountInINR, confidence: 'high', reason: 'Payment captured successfully.' },
        policy_evaluation: captureResult.policy_evaluation,
        execution: captureResult.execution
      });

      return captureResult;
    }

    // 2. Extract and Normalize Payment Failure Context from Razorpay Webhook
    let rawAmount = paymentEntity.amount !== undefined ? paymentEntity.amount : (eventBody.amount || 0);
    let amountInINR = rawAmount;
    if (rawAmount >= 100 && (paymentEntity.amount !== undefined || rawAmount % 100 === 0)) {
      amountInINR = rawAmount / 100;
    }
    if (eventBody.amount_in_inr) amountInINR = eventBody.amount_in_inr;

    const currency = paymentEntity.currency || eventBody.currency || 'INR';

    let rawFailure = paymentEntity.error_reason || paymentEntity.error_code || eventBody.failure_reason || 'insufficient_funds';
    let errorCode = paymentEntity.error_code || eventBody.error_code || null;
    let errorDescription = paymentEntity.error_description || eventBody.error_description || null;
    let errorSource = paymentEntity.error_source || eventBody.error_source || null;
    let errorStep = paymentEntity.error_step || eventBody.error_step || null;

    let normalizedFailure = 'insufficient_funds';

    const lowerFailure = String(rawFailure).toLowerCase() + ' ' + String(errorSource).toLowerCase() + ' ' + String(errorDescription).toLowerCase();

    if (lowerFailure.includes('fund') || lowerFailure.includes('balance') || lowerFailure.includes('insufficient')) {
      normalizedFailure = 'insufficient_funds';
    } else if (lowerFailure.includes('expire') || lowerFailure.includes('card_expired')) {
      normalizedFailure = 'expired_card';
    } else if (lowerFailure.includes('decline') || lowerFailure.includes('bank') || lowerFailure.includes('issuer') || lowerFailure.includes('authorization') || lowerFailure.includes('payment_failed')) {
      normalizedFailure = 'bank_declined';
    } else if (lowerFailure.includes('network') || lowerFailure.includes('timeout') || lowerFailure.includes('gateway')) {
      normalizedFailure = 'network_error';
    }

    const customerHistory = eventBody.customer_history || paymentEntity.notes?.customer_history || 'first_time_failure';
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
      raw_error_reason: rawFailure,
      error_code: errorCode,
      error_description: errorDescription,
      error_source: errorSource,
      error_step: errorStep,
      customer_history: customerHistory,
      customer: customer,
      status: paymentEntity.status || eventBody.status || 'failed',
      failure_timestamp: paymentEntity.created_at || eventBody.failure_timestamp || eventBody.timestamp
    };

    // 3. PERSIST REAL FAILED PAYMENT TO LIVE DATASET
    DatasetService.saveLivePayment(paymentContext);

    // 4. Empirical LOOCV Baseline & GenAI Reasoning Analysis
    const historicalDataset = DatasetService.getHistoricalPayments();
    const empiricalAnalysis = DecisionEngine.analyze(paymentContext, historicalDataset);
    const aiAnalysisResult = await AiReasoningService.analyzePaymentWithAI(paymentContext, empiricalAnalysis);

    // 5. Deterministic Safety & Policy Engine Evaluation (Final Gate)
    const policyEvaluation = PolicyService.evaluatePolicy(paymentContext, aiAnalysisResult);

    let executionResult;
    if (policyEvaluation.allowed) {
      // 6. Recovery Action Execution in Razorpay Test Mode
      const bestAction = aiAnalysisResult.analysis.recommended_action;
      executionResult = await RecoveryActionExecutor.execute(bestAction, paymentContext);
    } else {
      // Action Blocked by Safety Policy Engine
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

    // 7. Mark Event as Processed (Idempotency)
    markEventProcessed(eventId, {
      payment_id: paymentId,
      action: policyEvaluation.allowed ? aiAnalysisResult.analysis.recommended_action : policyEvaluation.action,
      status: executionResult.status
    });

    // 8. Log Comprehensive Audit Record Lifecycle Events
    logWebhookExecution({
      event_type: eventType,
      event_id: eventId,
      payment_id: paymentId,
      amount: amountInINR,
      currency: currency,
      failure_reason: normalizedFailure,
      customer_history: customerHistory,
      analysis: aiAnalysisResult.analysis,
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
      raw_error_reason: rawFailure,
      error_code: errorCode,
      error_description: errorDescription,
      analysis: aiAnalysisResult.analysis,
      alternatives: aiAnalysisResult.alternatives,
      ai_status: aiAnalysisResult.ai_status,
      ai_engine: aiAnalysisResult.ai_engine,
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
   * Analyzes payment failure context with GenAI & empirical probabilities.
   * @param {Object} payload 
   * @returns {Promise<Object>} Recovery analysis result
   */
  static async analyzeRecovery(payload) {
    const historicalDataset = DatasetService.getHistoricalPayments();
    const empiricalAnalysis = DecisionEngine.analyze(payload, historicalDataset);
    const aiResult = await AiReasoningService.analyzePaymentWithAI(payload, empiricalAnalysis);

    const policyEvaluation = PolicyService.evaluatePolicy(payload, aiResult);
    aiResult.policy_evaluation = policyEvaluation;

    // Save decision to audit log
    logDecision(payload, aiResult);

    return aiResult;
  }

  /**
   * Legacy decision method preserved for backward compatibility.
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
