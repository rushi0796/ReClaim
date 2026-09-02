const assert = require('assert');
const crypto = require('crypto');
const RazorpayService = require('../src/services/razorpayService');
const RecoveryService = require('../src/services/recoveryService');
const PolicyEngine = require('../src/engine/policyEngine');
const AiReasoningService = require('../src/services/aiReasoningService');
const { getAuditLogs } = require('../src/utils/auditLogger');
const { isEventProcessed } = require('../src/utils/idempotency');

async function runIntegrationTestSuite() {
  console.log('====================================================');
  console.log('  RECLAIM - Comprehensive Integration & Razorpay Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✓ PASSED: ${message}`);
    } else {
      console.error(`  ✗ FAILED: ${message}`);
    }
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'reclaim_wh_sec_test_2026';

  // 1. Webhook Signature Verification
  console.log('--- TEST 1: Razorpay Webhook Signature Verification ---');
  const validPayload = JSON.stringify({ event: 'payment.failed', id: 'event_test_101' });
  const validSignature = crypto.createHmac('sha256', webhookSecret).update(validPayload).digest('hex');
  const invalidSignature = 'invalid_signature_hash_123';

  assert(
    RazorpayService.verifyWebhookSignature(validPayload, validSignature, webhookSecret) === true,
    'Valid HMAC SHA256 signature verified successfully'
  );

  assert(
    RazorpayService.verifyWebhookSignature(validPayload, invalidSignature, webhookSecret) === false,
    'Invalid signature rejected safely'
  );

  // 2. Genuine payment.failed Webhook Lifecycle
  console.log('\n--- TEST 2: Genuine payment.failed Webhook Lifecycle ---');
  const uniquePaymentId = `pay_test_failed_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const uniqueEventId = `event_failed_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const paymentFailedEvent = {
    entity: 'event',
    account_id: 'acc_test_merchant',
    event: 'payment.failed',
    id: uniqueEventId,
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: uniquePaymentId,
          amount: 149900, // ₹1,499.00
          currency: 'INR',
          status: 'failed',
          order_id: 'order_test_101',
          invoice_id: null,
          international: false,
          method: 'card',
          amount_refunded: 0,
          refund_status: null,
          captured: false,
          description: 'Test Failed Subscription Payment',
          card_id: 'card_test_101',
          bank: null,
          wallet: null,
          vpa: null,
          email: 'customer@example.com',
          contact: '+919999999999',
          notes: {
            customer_history: 'previously_recovered_after_reminder'
          },
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Payment authorization failed due to insufficient funds',
          error_source: 'customer',
          error_step: 'payment_authorization',
          error_reason: 'insufficient_funds',
          created_at: Math.floor(Date.now() / 1000)
        }
      }
    }
  };

  const failedResult = await RecoveryService.processWebhookEvent(paymentFailedEvent);
  assert(failedResult.status === 'processed', 'payment.failed event processed successfully');
  assert(failedResult.policy_evaluation.allowed === true, 'Safety policy allowed recovery execution');
  assert(failedResult.execution.status === 'executed', 'Recovery action executed in Test Mode');
  assert(Boolean(failedResult.execution.details?.payment_url || failedResult.execution.details?.short_url), 'Razorpay Test Mode Payment Link generated');
  assert(failedResult.audit_logged === true, 'Entire lifecycle logged to audit trail');

  // 3. Webhook Idempotency Check
  console.log('\n--- TEST 3: Webhook Idempotency Deduplication ---');
  const duplicateResult = await RecoveryService.processWebhookEvent(paymentFailedEvent);
  assert(duplicateResult.status === 'already_processed', 'Duplicate webhook event blocked cleanly for idempotency');

  // 4. payment.captured Lifecycle Event
  console.log('\n--- TEST 4: payment.captured Lifecycle Event ---');
  const paymentCapturedEvent = {
    entity: 'event',
    account_id: 'acc_test_merchant',
    event: 'payment.captured',
    id: `event_captured_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: uniquePaymentId, // Same payment ID now recovered!
          amount: 149900,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_test_101',
          created_at: Math.floor(Date.now() / 1000)
        }
      }
    }
  };

  const capturedResult = await RecoveryService.processWebhookEvent(paymentCapturedEvent);
  assert(capturedResult.status === 'captured_processed', 'payment.captured event processed successfully');
  assert(capturedResult.execution.execution_mode === 'PAYMENT_CAPTURED_RECOVERY_STOPPED', 'Recovery lifecycle completed and future actions stopped');

  // 5. GenAI Reasoning Engine & Safe Fallback
  console.log('\n--- TEST 5: GenAI Reasoning Engine & Safe Fallback ---');
  const sampleContext = {
    payment_id: 'pay_ai_test_1',
    amount: 999,
    failure_reason: 'insufficient_funds',
    customer_history: 'first_time_failure'
  };
  const aiResult = await AiReasoningService.analyzePaymentWithAI(sampleContext, {
    analysis: { recommended_action: 'reminder', recovery_probability: 0.69 }
  });
  assert(Boolean(aiResult.analysis?.recommended_action), 'GenAI / Fallback generated structured action');
  assert(typeof aiResult.analysis?.recovery_probability === 'number', 'Structured probability score generated');
  assert(Boolean(aiResult.ai_status), 'AI engine status metadata present');

  // 6. Safety Policy Engine (Final Gate)
  console.log('\n--- TEST 6: Deterministic Safety Policy Engine (Final Gate) ---');

  // Rule 1: Payment captured block
  const capturedRuleCheck = PolicyEngine.evaluate(
    { payment_id: 'pay_r1', status: 'captured' },
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
    { payment_id: 'pay_r3', execution_details: { status: 'executed' } },
    { payment_id: 'pay_r3', execution_details: { status: 'executed' } },
    { payment_id: 'pay_r3', execution_details: { status: 'executed' } }
  ];
  const maxAttemptsCheck = PolicyEngine.evaluate(
    { payment_id: 'pay_r3', status: 'failed', failure_timestamp: Date.now() },
    { analysis: { recommended_action: 'reminder', recovery_probability: 0.8, confidence: 'high' } },
    mockLogsMax
  );
  assert(maxAttemptsCheck.allowed === false && maxAttemptsCheck.reason === 'maximum_recovery_attempts_reached', 'Rule 3: Max attempts (>=3) blocked');

  // Rule 4: Cooldown block
  const mockLogsCooldown = [
    { payment_id: 'pay_r4', timestamp: new Date(Date.now() - (2 * 3600 * 1000)).toISOString(), execution_details: { status: 'executed' } }
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
  const auditLogs = await getAuditLogs();
  assert(Array.isArray(auditLogs) && auditLogs.length > 0, 'Audit log entries recorded successfully');

  console.log('\n----------------------------------------------------');
  console.log(`Integration Test Results: ${passed}/${total} Passed.`);
  console.log('====================================================\n');
}

runIntegrationTestSuite().catch(err => {
  console.error('Integration Test Suite Error:', err);
  process.exitCode = 1;
});
