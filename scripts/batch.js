const BatchRecoveryService = require('../src/services/batchRecoveryService');

console.log('RECLAIM BATCH RECOVERY ANALYSIS');
console.log('---------------------------------');

const res = BatchRecoveryService.analyzeBatch();

console.log(`Payments analyzed: ${res.total_payments}`);
console.log(`Revenue at risk: ₹${res.total_revenue_at_risk.toLocaleString('en-IN')}`);
console.log(`RECLAIM expected recovery: ₹${res.total_expected_recovery.toLocaleString('en-IN')}`);
console.log(`Expected recovery rate: ${res.expected_recovery_rate_percentage}\n`);

console.log('BASELINE');
console.log(`Expected recovery: ₹${res.comparison.baseline_expected_recovery.toLocaleString('en-IN')}\n`);

console.log('RECLAIM');
console.log(`Expected recovery: ₹${res.comparison.reclaim_expected_recovery.toLocaleString('en-IN')}\n`);

console.log('EXPECTED LIFT');
console.log(`+₹${res.comparison.expected_recovery_lift.toLocaleString('en-IN')} / +${res.comparison.expected_recovery_lift_percentage}\n`);

console.log('ACTION DISTRIBUTION');
Object.keys(res.action_distribution).forEach(action => {
  const count = res.action_distribution[action];
  const pct = res.total_payments > 0 ? ((count / res.total_payments) * 100).toFixed(1) : 0;
  console.log(`  ${action.padEnd(23)}: ${count} (${pct}%)`);
});

console.log('\nMethodology Note:');
console.log(res.disclaimer);
