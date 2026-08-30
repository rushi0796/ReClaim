const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const EXPIRY_WINDOW_MS = 72 * 60 * 60 * 1000; // 72 hours
const MAX_ALLOWED_ATTEMPTS = 3;

class PolicyEngine {
  /**
   * Evaluates deterministic safety and policy rules prior to executing a recovery intervention.
   * 
   * @param {Object} paymentContext - Failed payment details (payment_id, status, failure_timestamp, etc.)
   * @param {Object} decisionResult - Output from DecisionEngine (recommended_action, confidence, etc.)
   * @param {Array<Object>} auditHistory - Historical audit log records for this payment_id
   * @returns {Object} Policy evaluation result { allowed: boolean, reason: string, action: string }
   */
  static evaluate(paymentContext = {}, decisionResult = {}, auditHistory = []) {
    const now = Date.now();
    const paymentId = paymentContext.payment_id;

    // Filter audit logs relevant to this payment_id
    const paymentLogs = auditHistory.filter(log => log.payment_id === paymentId);

    // Rule 1: PAYMENT_SUCCESS
    const isCaptured = paymentContext.status === 'captured' || paymentContext.status === 'success';
    const logAlreadyCaptured = paymentLogs.some(log => 
      log.execution_details?.status === 'captured' || 
      log.execution_details?.status === 'success' ||
      log.status === 'captured'
    );

    if (isCaptured || logAlreadyCaptured) {
      return {
        allowed: false,
        reason: 'payment_already_recovered',
        action: 'stop'
      };
    }

    // Rule 2: RECOVERY_WINDOW (Payment older than 72 hours)
    const failureTimeStr = paymentContext.failure_timestamp || paymentContext.created_at || paymentContext.timestamp;
    if (failureTimeStr) {
      const failureTime = new Date(failureTimeStr).getTime();
      if (!isNaN(failureTime) && (now - failureTime) > EXPIRY_WINDOW_MS) {
        return {
          allowed: false,
          reason: 'recovery_window_expired',
          action: 'stop'
        };
      }
    }

    // Rule 3: MAX_ATTEMPTS (Maximum 3 attempts)
    const previousAttemptsCount = paymentLogs.filter(log => 
      log.execution_status === 'executed' || 
      log.execution_status === 'scheduled' ||
      log.policy_evaluation?.allowed === true
    ).length;

    if (previousAttemptsCount >= MAX_ALLOWED_ATTEMPTS) {
      return {
        allowed: false,
        reason: 'maximum_recovery_attempts_reached',
        action: 'escalate'
      };
    }

    // Rule 4: COOLDOWN (Immediate repeated actions within 24 hours)
    const executionLogs = paymentLogs.filter(log => log.timestamp && (log.execution_status === 'executed' || log.execution_status === 'scheduled'));
    if (executionLogs.length > 0) {
      const lastExecutionTime = new Date(executionLogs[executionLogs.length - 1].timestamp).getTime();
      if (!isNaN(lastExecutionTime) && (now - lastExecutionTime) < COOLDOWN_MS) {
        return {
          allowed: false,
          reason: 'recovery_cooldown_active',
          action: 'wait'
        };
      }
    }

    // Rule 5: LOW_CONFIDENCE (Decision confidence is low)
    const confidence = decisionResult.confidence || decisionResult.analysis?.confidence;
    if (confidence === 'low' || confidence === 'none') {
      return {
        allowed: false,
        reason: 'low_decision_confidence',
        action: 'escalate'
      };
    }

    // All Policy Checks Passed
    return {
      allowed: true,
      reason: 'policy_checks_passed',
      action: 'execute'
    };
  }
}

module.exports = PolicyEngine;
