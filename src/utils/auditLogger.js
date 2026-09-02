const PersistentStorageService = require('../services/persistentStorageService');

// In-memory cache fallback for audit logs
const inMemoryAuditLogs = [];

/**
 * Appends a recovery decision or webhook execution to the persistent audit log.
 * @param {Object} payload - Failure context payload
 * @param {Object} decisionResult - Engine decision result object
 */
function logDecision(payload, decisionResult) {
  const auditRecord = {
    audit_id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    event_type: 'PAYMENT_ANALYZED',
    payment_id: payload.payment_id || payload.id || 'unknown',
    amount: payload.amount,
    currency: payload.currency || 'INR',
    failure_reason: payload.failure_reason,
    customer_history: payload.customer_history || null,
    recommended_action: decisionResult.analysis?.recommended_action || decisionResult.decision?.action || 'unknown',
    recovery_probability: decisionResult.analysis?.recovery_probability || null,
    expected_recovered_amount: decisionResult.analysis?.expected_recovered_amount || null,
    confidence: decisionResult.analysis?.confidence || 'high',
    reasoning: decisionResult.analysis?.reason || decisionResult.decision?.reason || '',
    policy_evaluation: decisionResult.policy_evaluation || { allowed: true, reason: 'policy_checks_passed' }
  };

  inMemoryAuditLogs.unshift(auditRecord);

  try {
    const existingLogs = PersistentStorageService.getJSONSync('reclaim:audit_logs', 'audit_logs.json', []);
    const updatedLogs = [auditRecord, ...existingLogs];
    PersistentStorageService.setJSONSync('reclaim:audit_logs', 'audit_logs.json', updatedLogs);
  } catch (error) {
    // In-memory array retains log history during runtime
  }

  return auditRecord;
}

/**
 * Appends a Razorpay webhook execution event (payment.failed, payment.captured) to the audit log.
 * @param {Object} webhookLogData 
 */
function logWebhookExecution(webhookLogData) {
  const eventType = webhookLogData.event_type || 'PAYMENT_FAILED_RECEIVED';
  const executionStatus = webhookLogData.execution?.status || 'processed';
  const policyAllowed = webhookLogData.policy_evaluation?.allowed;

  let actionStatus = 'PAYMENT_FAILED_RECEIVED';
  if (eventType === 'payment.captured') {
    actionStatus = 'PAYMENT_CAPTURED_RECOVERY_STOPPED';
  } else if (policyAllowed === false) {
    actionStatus = 'RECOVERY_ACTION_BLOCKED';
  } else if (executionStatus === 'executed') {
    actionStatus = 'RECOVERY_ACTION_EXECUTED';
  }

  const auditRecord = {
    audit_id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    event_type: actionStatus,
    raw_event: eventType,
    event_id: webhookLogData.event_id,
    payment_id: webhookLogData.payment_id,
    amount: webhookLogData.amount,
    currency: webhookLogData.currency || 'INR',
    failure_reason: webhookLogData.failure_reason,
    customer_history: webhookLogData.customer_history || null,
    recommended_action: webhookLogData.analysis?.recommended_action || 'none',
    recovery_probability: webhookLogData.analysis?.recovery_probability || null,
    expected_recovered_amount: webhookLogData.analysis?.expected_recovered_amount || null,
    policy_evaluation: webhookLogData.policy_evaluation,
    execution: webhookLogData.execution
  };

  inMemoryAuditLogs.unshift(auditRecord);

  try {
    const existingLogs = PersistentStorageService.getJSONSync('reclaim:audit_logs', 'audit_logs.json', []);
    const updatedLogs = [auditRecord, ...existingLogs];
    PersistentStorageService.setJSONSync('reclaim:audit_logs', 'audit_logs.json', updatedLogs);
  } catch (error) {
    // In-memory array retains log history
  }

  return auditRecord;
}

/**
 * Reads all recorded audit logs.
 * @returns {Array<Object>} List of audit records
 */
function getAuditLogs() {
  try {
    const fileLogs = PersistentStorageService.getJSONSync('reclaim:audit_logs', 'audit_logs.json', []);
    if (Array.isArray(fileLogs) && fileLogs.length > 0) {
      const mergedMap = new Map();
      fileLogs.forEach(r => mergedMap.set(r.audit_id, r));
      inMemoryAuditLogs.forEach(r => mergedMap.set(r.audit_id, r));
      return Array.from(mergedMap.values());
    }
  } catch (error) {
    console.error('Error reading audit logs:', error.message);
  }
  return [...inMemoryAuditLogs];
}

module.exports = {
  logDecision,
  logWebhookExecution,
  getAuditLogs
};
