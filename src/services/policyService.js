const PolicyEngine = require('../engine/policyEngine');
const { getAuditLogs } = require('../utils/auditLogger');

class PolicyService {
  /**
   * Evaluates safety policies for a given payment recovery action attempt.
   * Loads audit history and invokes PolicyEngine.
   * 
   * @param {Object} paymentContext 
   * @param {Object} decisionResult 
   * @returns {Object} Policy evaluation result
   */
  static evaluatePolicy(paymentContext, decisionResult) {
    const auditLogs = getAuditLogs();
    return PolicyEngine.evaluate(paymentContext, decisionResult, auditLogs);
  }
}

module.exports = PolicyService;
