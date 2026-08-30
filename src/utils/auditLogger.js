const fs = require('fs');
const path = require('path');

const LOGS_FILE = path.join(__dirname, '../../data/audit_logs.json');

/**
 * Appends a decision record to the persistent audit log file.
 * @param {Object} input - Payload received for recovery analysis
 * @param {Object} result - Calculated analysis result from decision engine
 */
function logDecision(input, result) {
  try {
    const logEntry = {
      log_id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      payment_id: input.payment_id,
      amount: input.amount,
      currency: input.currency || 'INR',
      failure_reason: input.failure_reason,
      customer_history: input.customer_history || null,
      recommended_action: result.analysis.recommended_action,
      predicted_probability: result.analysis.recovery_probability,
      recovery_probability: result.analysis.recovery_probability,
      expected_recovered_amount: result.analysis.expected_recovered_amount,
      confidence: result.analysis.confidence,
      reason: result.analysis.reason,
      alternatives_count: result.alternatives ? result.alternatives.length : 0
    };

    let logs = [];
    if (fs.existsSync(LOGS_FILE)) {
      const content = fs.readFileSync(LOGS_FILE, 'utf8');
      if (content.trim()) {
        logs = JSON.parse(content);
      }
    }

    logs.push(logEntry);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf8');
    return logEntry;
  } catch (error) {
    console.error('Failed to record audit log:', error.message);
    return null;
  }
}

/**
 * Appends a complete webhook lifecycle execution record to the persistent audit log file.
 * @param {Object} data - Full lifecycle data: incoming failure, decision, execution result, outcome
 */
function logWebhookExecution(data) {
  try {
    const logEntry = {
      log_id: `log_wh_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      event_type: data.event_type || 'payment.failed',
      event_id: data.event_id || null,
      payment_id: data.payment_id,
      amount: data.amount,
      currency: data.currency || 'INR',
      failure_reason: data.failure_reason,
      customer_history: data.customer_history || null,
      recommended_action: data.analysis.recommended_action,
      predicted_probability: data.analysis.recovery_probability,
      recovery_probability: data.analysis.recovery_probability,
      expected_recovered_amount: data.analysis.expected_recovered_amount,
      confidence: data.analysis.confidence,
      reason: data.analysis.reason,
      policy_evaluation: data.policy_evaluation || null,
      execution_status: data.execution.status,
      execution_mode: data.execution.execution_mode,
      execution_details: data.execution.details,
      final_outcome: data.execution.is_simulated ? 'SIMULATED_TEST_MODE_EXECUTION' : (data.execution.status === 'blocked' ? 'BLOCKED_BY_POLICY_ENGINE' : 'EXECUTED_IN_RAZORPAY_TEST_MODE')
    };

    let logs = [];
    if (fs.existsSync(LOGS_FILE)) {
      const content = fs.readFileSync(LOGS_FILE, 'utf8');
      if (content.trim()) {
        logs = JSON.parse(content);
      }
    }

    logs.push(logEntry);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf8');
    return logEntry;
  } catch (error) {
    console.error('Failed to record webhook execution audit log:', error.message);
    return null;
  }
}

/**
 * Retrieves all recorded audit logs.
 */
function getAuditLogs() {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const content = fs.readFileSync(LOGS_FILE, 'utf8');
      return content.trim() ? JSON.parse(content) : [];
    }
  } catch (error) {
    console.error('Failed to read audit logs:', error.message);
  }
  return [];
}

module.exports = {
  logDecision,
  logWebhookExecution,
  getAuditLogs
};
