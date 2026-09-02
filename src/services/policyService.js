const PolicyEngine = require('../engine/policyEngine');
const { getAuditLogs, getAuditLogsSync } = require('../utils/auditLogger');

class PolicyService {
  /**
   * Async evaluation of safety policies for a given payment recovery action attempt.
   * Loads audit history from Upstash Redis and invokes PolicyEngine.
   * 
   * @param {Object} paymentContext 
   * @param {Object} decisionResult 
   * @returns {Promise<Object>} Policy evaluation result
   */
  static async evaluatePolicyAsync(paymentContext, decisionResult) {
    const auditLogs = await getAuditLogs();
    return PolicyEngine.evaluate(paymentContext, decisionResult, auditLogs);
  }

  /**
   * Sync evaluation of safety policies.
   * 
   * @param {Object} paymentContext 
   * @param {Object} decisionResult 
   * @returns {Object} Policy evaluation result
   */
  static evaluatePolicy(paymentContext, decisionResult) {
    const auditLogs = getAuditLogsSync();
    return PolicyEngine.evaluate(paymentContext, decisionResult, auditLogs);
  }
}

module.exports = PolicyService;
