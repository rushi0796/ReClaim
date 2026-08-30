const RecoveryService = require('../src/services/recoveryService');
const PolicyEngine = require('../src/engine/policyEngine');
const { getAuditLogs } = require('../src/utils/auditLogger');

(async () => {
  console.log('================================================================');
  console.log('  RECLAIM - Safety & Policy Engine & Webhook Pipeline Demo');
  console.log('================================================================\n');

  // Scenario 1: Valid Reminder Allowed
  console.log('--- SCENARIO 1: Valid Payment Recovery Action Allowed ---');
  const validEvent = {
    entity: 'event',
    event: 'payment.failed',
    id: `event_policy_valid_${Date.now()}`,
    payload: {
      payment: {
        entity: {
          id: `pay_demo_valid_${Math.floor(Math.random() * 1000)}`,
          amount: 99900,
          currency: 'INR',
          status: 'failed',
          error_reason: 'insufficient_funds',
          notes: { customer_history: 'previously_recovered_after_reminder' }
        }
      }
    }
  };

  const res1 = await RecoveryService.processWebhookEvent(validEvent);
  console.log(`Payment ID    : ${res1.payment_id}`);
  console.log(`Decision      : ${res1.analysis.recommended_action} (Conf: ${res1.analysis.confidence})`);
  console.log(`Policy Check  : Allowed=${res1.policy_evaluation.allowed} | Reason=${res1.policy_evaluation.reason}`);
  console.log(`Execution     : Status=${res1.execution.status} | Mode=${res1.execution.execution_mode}\n`);

  // Scenario 2: Duplicate / Cooldown Blocked
  console.log('--- SCENARIO 2: Cooldown Block (Repeated Action Within 24h) ---');
  const duplicateEvent = {
    entity: 'event',
    event: 'payment.failed',
    id: `event_policy_cooldown_${Date.now()}`,
    payload: {
      payment: {
        entity: {
          id: res1.payment_id, // Same payment ID
          amount: 99900,
          currency: 'INR',
          status: 'failed',
          error_reason: 'insufficient_funds',
          notes: { customer_history: 'previously_recovered_after_reminder' }
        }
      }
    }
  };

  const res2 = await RecoveryService.processWebhookEvent(duplicateEvent);
  console.log(`Payment ID    : ${res2.payment_id}`);
  console.log(`Policy Check  : Allowed=${res2.policy_evaluation.allowed} | Reason=${res2.policy_evaluation.reason}`);
  console.log(`Action Taken  : ${res2.execution.action} (Status: ${res2.execution.status})\n`);

  // Scenario 3: Payment Already Recovered / Succeeded
  console.log('--- SCENARIO 3: Payment Already Recovered Blocked ---');
  const capturedEvent = {
    entity: 'event',
    event: 'payment.failed',
    id: `event_policy_captured_${Date.now()}`,
    payload: {
      payment: {
        entity: {
          id: `pay_demo_captured_${Math.floor(Math.random() * 1000)}`,
          amount: 149900,
          currency: 'INR',
          status: 'captured', // Already captured!
          error_reason: 'insufficient_funds',
          notes: { customer_history: 'first_time_failure' }
        }
      }
    }
  };

  const res3 = await RecoveryService.processWebhookEvent(capturedEvent);
  console.log(`Payment ID    : ${res3.payment_id}`);
  console.log(`Status        : ${capturedEvent.payload.payment.entity.status}`);
  console.log(`Policy Check  : Allowed=${res3.policy_evaluation.allowed} | Reason=${res3.policy_evaluation.reason}`);
  console.log(`Action Taken  : ${res3.execution.action}\n`);

  // Scenario 4: Low Confidence Decision Escalated
  console.log('--- SCENARIO 4: Low Confidence Decision Escalated ---');
  const lowConfContext = {
    payment_id: `pay_demo_lowconf_${Math.floor(Math.random() * 1000)}`,
    status: 'failed'
  };
  const lowConfDecision = {
    recommended_action: 'retry_later',
    confidence: 'low'
  };
  const lowConfPolicy = PolicyEngine.evaluate(lowConfContext, lowConfDecision, []);
  console.log(`Payment ID    : ${lowConfContext.payment_id}`);
  console.log(`Confidence    : ${lowConfDecision.confidence}`);
  console.log(`Policy Check  : Allowed=${lowConfPolicy.allowed} | Reason=${lowConfPolicy.reason}`);
  console.log(`Action Taken  : ${lowConfPolicy.action}\n`);

  // Scenario 5: Maximum Attempts Blocked
  console.log('--- SCENARIO 5: Maximum Attempts (>= 3) Blocked ---');
  const maxAttemptsContext = {
    payment_id: `pay_demo_maxattempts_${Math.floor(Math.random() * 1000)}`,
    status: 'failed'
  };
  const maxAttemptsDecision = {
    recommended_action: 'reminder',
    confidence: 'high'
  };
  const mockAuditLogs = [
    { payment_id: maxAttemptsContext.payment_id, execution_status: 'executed', timestamp: new Date(Date.now() - 100 * 3600 * 1000).toISOString() },
    { payment_id: maxAttemptsContext.payment_id, execution_status: 'executed', timestamp: new Date(Date.now() - 75 * 3600 * 1000).toISOString() },
    { payment_id: maxAttemptsContext.payment_id, execution_status: 'executed', timestamp: new Date(Date.now() - 50 * 3600 * 1000).toISOString() }
  ];
  const maxAttemptsPolicy = PolicyEngine.evaluate(maxAttemptsContext, maxAttemptsDecision, mockAuditLogs);
  console.log(`Payment ID    : ${maxAttemptsContext.payment_id}`);
  console.log(`Prior Attempts: 3`);
  console.log(`Policy Check  : Allowed=${maxAttemptsPolicy.allowed} | Reason=${maxAttemptsPolicy.reason}`);
  console.log(`Action Taken  : ${maxAttemptsPolicy.action}\n`);

  console.log('================================================================');
  console.log('  RECLAIM Safety & Policy Engine Demo Completed Successfully!');
  console.log('================================================================\n');
})();
