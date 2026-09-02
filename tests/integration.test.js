const crypto = require('crypto');
const RecoveryService = require('../src/services/recoveryService');
const RazorpayService = require('../src/services/razorpayService');
const PolicyService = require('../src/services/policyService');
const AiReasoningService = require('../src/services/aiReasoningService');
const PolicyEngine = require('../src/engine/policyEngine');
const { getAuditLogs } = require('../src/utils/auditLogger');

async function runIntegrationTestSuite() {
  console.log('====================================================');
  console.log('  RECLAIM - Comprehensive Integration & Razorpay Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, description) {
    total++;
    if (condition) {
      console.log(`  ✓ PASSED: ${description}`);
      passed++;
    } else {
      console.error(`  ✗ FAILED: ${description}`);
      process.exitCode = 1;
    }
  }

  // 1. Webhook Signature Verification
  console.log('--- TEST 1: Razorpay Webhook Signature Verification ---');
  const testSecret = 'reclaim_wh_sec_test_2026';
  const testBody = JSON.stringify({ entity: 'event', event: 'payment.failed', id: 'evt_sig_test_1' });
  const validSig = crypto.createHmac('sha256', testSecret).update(testBody).digest('hex');
  const isValidSig = RazorpayService.verifyWebhookSignature(testBody, validSig, testSecret);
  const isInvalidSig = RazorpayService.verifyWebhookSignature(testBody, 'invalid_sig_hex_string_with_matching_len_000000000000000000000000', testSecret);

  assert(isValidSig === true, 'Valid HMAC SHA256 signature verified successfully');
  assert(isInvalidSig === false, 'Invalid signature rejected safely');

  // 2. Fresh payment.failed Webhook Flow
  console.log('\n--- TEST 2: Genuine payment.failed Webhook Lifecycle ---');
  const freshPaymentId = `pay_wh_test_${Date.now()}`;
  const freshEventId = `evt_failed_${Date.now()}`;

  const failedPayload = {
    entity: 'event',
    event: 'payment.failed',
    id: freshEventId,
    payload: {
      payment: {
        entity: {
          id: freshPaymentId,
          amount: 99900,
          currency: 'INR',
          status: 'failed',
          error_reason: 'insufficient_funds',
          notes: { customer_history: 'previously_recovered_after_reminder' }
        }
      }
    }
  };

  const webhookResult = await RecoveryService.processWebhookEvent(failedPayload);
  assert(webhookResult.status === 'processed', 'payment.failed event processed successfully');
  assert(webhookResult.policy_evaluation.allowed === true, 'Safety policy allowed recovery execution');
  assert(webhookResult.execution.status === 'executed', 'Recovery action executed in Test Mode');
  assert(Boolean(webhookResult.execution.details.payment_url), 'Razorpay Test Mode Payment Link generated');
  assert(webhookResult.audit_logged === true, 'Entire lifecycle logged to audit trail');

  // 3. Duplicate Webhook Idempotency Check
  console.log('\n--- TEST 3: Webhook Idempotency Deduplication ---');
  const dupResult = await RecoveryService.processWebhookEvent(failedPayload);
  assert(dupResult.status === 'already_processed', 'Duplicate webhook event blocked cleanly for idempotency');

  // 4. payment.captured Webhook Lifecycle
  console.log('\n--- TEST 4: payment.captured Lifecycle Event ---');
  const capturedPaymentId = `pay_captured_test_${Date.now()}`;
  const capturedEventId = `evt_captured_${Date.now()}`;

  const capturedPayload = {
    entity: 'event',
    event: 'payment.captured',
    id: capturedEventId,
    payload: {
      payment: {
        entity: {
          id: capturedPaymentId,
          amount: 149900,
          currency: 'INR',
          status: 'captured'
        }
      }
    }
  };

  const captureResult = await RecoveryService.processWebhookEvent(capturedPayload);
  assert(captureResult.status === 'captured_processed', 'payment.captured event processed successfully');
  assert(captureResult.execution.execution_mode === 'PAYMENT_CAPTURED_RECOVERY_STOPPED', 'Recovery lifecycle completed and future actions stopped');

  // 5. GenAI Reasoning & Safe Fallback Test
  console.log('\n--- TEST 5: GenAI Reasoning Engine & Safe Fallback ---');
  const sampleContext = {
    payment_id: 'pay_genai_test_001',
    amount: 1299,
    currency: 'INR',
    failure_reason: 'expired_card',
    customer_history: 'first_time_failure'
  };

  const aiResult = await AiReasoningService.analyzePaymentWithAI(sampleContext);
  assert(Boolean(aiResult.analysis.recommended_action), 'GenAI / Fallback generated structured action');
  assert(typeof aiResult.analysis.recovery_probability === 'number', 'Structured probability score generated');
  assert(Boolean(aiResult.ai_status), 'AI engine status metadata present');

  // 6. Safety Policy Rules Gatekeeper Check
  console.log('\n--- TEST 6: Deterministic Safety Policy Engine (Final Gate) ---');

  // Rule 1: Captured payment block
  const capturedRuleCheck = PolicyEngine.evaluate(
    { payment_id: 'pay_r1', status: 'captured', failure_timestamp: Date.now() },
    { analysis: { recommended_action: 'reminder', recovery_probability: 0.8, confidence: 'high' } }
  );
  assert(capturedRuleCheck.allowed === false && capturedRuleCheck.reason === 'payment_already_recovered', 'Rule 1: Captured payment blocked');

  // Rule 2: Expired recovery window block
  const expiredRuleCheck = PolicyEngine.evaluate(
    { payment_id: 'pay_r2', status: 'failed', failure_timestamp: Date.now() - (80 * 3600 * 1000) },
    { analysis: { recommended_action: 'reminder', recovery_probability: 0.8, confidence: 'high' } }
  );
  assert(expiredRuleCheck.allowed === false && expiredRuleCheck.reason === 'recovery_window_expired', 'Rule 2: Expired window (>72h) blocked');

  // Rule 3: Max attempts block
  const mockLogsMax = [
    { payment_id: 'pay_r3', execution_status: 'executed' },
    { payment_id: 'pay_r3', execution_status: 'executed' },
    { payment_id: 'pay_r3', execution_status: 'executed' }
  ];
  const maxAttemptsCheck = PolicyEngine.evaluate(
    { payment_id: 'pay_r3', status: 'failed', failure_timestamp: Date.now() },
    { analysis: { recommended_action: 'reminder', recovery_probability: 0.8, confidence: 'high' } },
    mockLogsMax
  );
  assert(maxAttemptsCheck.allowed === false && maxAttemptsCheck.reason === 'maximum_recovery_attempts_reached', 'Rule 3: Max attempts (>=3) blocked');

  // Rule 4: Cooldown window block
  const mockLogsCooldown = [
    { payment_id: 'pay_r4', timestamp: new Date(Date.now() - (2 * 3600 * 1000)).toISOString(), execution_status: 'executed' }
  ];
  const cooldownCheck = PolicyEngine.evaluate(
    { payment_id: 'pay_r4', status: 'failed', failure_timestamp: Date.now() },
    { analysis: { recommended_action: 'reminder', recovery_probability: 0.8, confidence: 'high' } },
    mockLogsCooldown
  );
  assert(cooldownCheck.allowed === false && cooldownCheck.reason === 'recovery_cooldown_active', 'Rule 4: Cooldown (<24h) blocked');

  // Rule 5: Low confidence escalation
  const lowConfCheck = PolicyEngine.evaluate(
    { payment_id: 'pay_r5', status: 'failed', failure_timestamp: Date.now() },
    { analysis: { recommended_action: 'reminder', recovery_probability: 0.2, confidence: 'low' } }
  );
  assert(lowConfCheck.allowed === false && lowConfCheck.reason === 'low_decision_confidence', 'Rule 5: Low confidence escalated');

  // 7. Audit Log Lifecycle Verification
  console.log('\n--- TEST 7: Persistent Audit Log Verification ---');
  const auditLogs = getAuditLogs();
  assert(Array.isArray(auditLogs) && auditLogs.length > 0, 'Audit log entries recorded successfully');

  console.log('\n----------------------------------------------------');
  console.log(`Integration Test Results: ${passed}/${total} Passed.`);
  console.log('====================================================\n');
}

runIntegrationTestSuite().catch(err => {
  console.error('Integration Test Suite Error:', err);
  process.exit(1);
});
