const assert = require('assert');
const PolicyEngine = require('../src/engine/policyEngine');

console.log('====================================================');
console.log('  RECLAIM - Safety & Policy Engine Test Suite');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASSED: ${name}`);
  } catch (err) {
    console.error(`  ✗ FAILED: ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

// 1. TEST: PAYMENT_SUCCESS Rule
runTest('Rule 1: Block when payment status is captured/success', () => {
  const paymentContext = { payment_id: 'pay_test_captured', status: 'captured' };
  const decision = { recommended_action: 'reminder', confidence: 'high' };
  
  const result = PolicyEngine.evaluate(paymentContext, decision, []);
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.reason, 'payment_already_recovered');
  assert.strictEqual(result.action, 'stop');
});

// 2. TEST: RECOVERY_WINDOW Rule (Older than 72 hours)
runTest('Rule 2: Block when payment is older than 72 hours', () => {
  const oldTimestamp = new Date(Date.now() - 80 * 60 * 60 * 1000).toISOString(); // 80 hours ago
  const paymentContext = { payment_id: 'pay_test_old', timestamp: oldTimestamp };
  const decision = { recommended_action: 'reminder', confidence: 'high' };

  const result = PolicyEngine.evaluate(paymentContext, decision, []);
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.reason, 'recovery_window_expired');
  assert.strictEqual(result.action, 'stop');
});

// 3. TEST: MAX_ATTEMPTS Rule (Attempts >= 3)
runTest('Rule 3: Block when maximum recovery attempts (3) are reached', () => {
  const paymentContext = { payment_id: 'pay_test_max_attempts' };
  const decision = { recommended_action: 'reminder', confidence: 'high' };
  const mockAuditHistory = [
    { payment_id: 'pay_test_max_attempts', execution_status: 'executed', timestamp: new Date(Date.now() - 50 * 3600 * 1000).toISOString() },
    { payment_id: 'pay_test_max_attempts', execution_status: 'executed', timestamp: new Date(Date.now() - 30 * 3600 * 1000).toISOString() },
    { payment_id: 'pay_test_max_attempts', execution_status: 'executed', timestamp: new Date(Date.now() - 25 * 3600 * 1000).toISOString() }
  ];

  const result = PolicyEngine.evaluate(paymentContext, decision, mockAuditHistory);
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.reason, 'maximum_recovery_attempts_reached');
  assert.strictEqual(result.action, 'escalate');
});

// 4. TEST: COOLDOWN Rule (Repeated action within 24 hours)
runTest('Rule 4: Block when repeated action occurs within 24h cooldown window', () => {
  const recentTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
  const paymentContext = { payment_id: 'pay_test_cooldown' };
  const decision = { recommended_action: 'reminder', confidence: 'high' };
  const mockAuditHistory = [
    { payment_id: 'pay_test_cooldown', execution_status: 'executed', timestamp: recentTimestamp }
  ];

  const result = PolicyEngine.evaluate(paymentContext, decision, mockAuditHistory);
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.reason, 'recovery_cooldown_active');
  assert.strictEqual(result.action, 'wait');
});

// 5. TEST: LOW_CONFIDENCE Rule
runTest('Rule 5: Block/escalate when decision confidence is low', () => {
  const paymentContext = { payment_id: 'pay_test_low_conf' };
  const decision = { recommended_action: 'reminder', confidence: 'low' };

  const result = PolicyEngine.evaluate(paymentContext, decision, []);
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.reason, 'low_decision_confidence');
  assert.strictEqual(result.action, 'escalate');
});

// 6. TEST: ALLOWED Action (All Policy Checks Pass)
runTest('Success Case: Allow execution when all policy checks pass', () => {
  const freshTimestamp = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(); // 1 hour ago
  const paymentContext = { payment_id: 'pay_test_valid', timestamp: freshTimestamp, status: 'failed' };
  const decision = { recommended_action: 'reminder', confidence: 'high' };

  const result = PolicyEngine.evaluate(paymentContext, decision, []);
  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.reason, 'policy_checks_passed');
  assert.strictEqual(result.action, 'execute');
});

console.log('\n----------------------------------------------------');
console.log(`Test Results: ${passedTests}/${totalTests} Passed.`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
