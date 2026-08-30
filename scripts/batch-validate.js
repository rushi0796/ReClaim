const BatchValidationService = require('../src/services/batchValidationService');

console.log('RECLAIM OUT-OF-SAMPLE BATCH VALIDATION');
console.log('--------------------------------------');

const res = BatchValidationService.validateBatch();

console.log(`Validation samples: ${res.validation_samples}\n`);

console.log('RECLAIM');
console.log(`Predicted recovery: ${res.reclaim.predicted_recovery_rate_percentage}`);
console.log(`Actual recovery   : ${res.reclaim.actual_recovery_rate_percentage}`);
console.log(`MAE               : ${res.reclaim.mae}\n`);

console.log('BASELINE');
console.log(`Actual recovery   : ${res.baseline.actual_recovery_rate_percentage}\n`);

console.log('OUT-OF-SAMPLE LIFT');
console.log(`${res.comparison.actual_recovery_lift} percentage points (${res.comparison.actual_recovery_lift_percentage} relative lift)\n`);

console.log('Methodology Note:');
console.log(res.disclaimer);
