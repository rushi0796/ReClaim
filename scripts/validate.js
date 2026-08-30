const ValidationEngine = require('../src/engine/validationEngine');

console.log('RECLAIM COUNTERFACTUAL VALIDATION');
console.log('---------------------------------');

const res = ValidationEngine.validate();

console.log(`Validation samples: ${res.validation_samples}\n`);

console.log('Overall:');
console.log(`Prediction MAE: ${res.metrics.mean_absolute_error}`);
console.log(`Prediction accuracy: ${res.metrics.accuracy_percentage}\n`);

console.log('Intervention:');
Object.keys(res.interventions).forEach(action => {
  const item = res.interventions[action];
  console.log(action);
  console.log(`  Predicted recovery: ${(item.predicted_recovery_rate * 100).toFixed(1)}%`);
  console.log(`  Actual recovery   : ${(item.actual_recovery_rate * 100).toFixed(1)}%`);
  console.log(`  MAE               : ${item.mean_absolute_error}`);
  console.log(`  Accuracy          : ${item.accuracy_percentage}\n`);
});

console.log('Methodology Note:');
console.log(res.methodology);
console.log(`\nNote: ${res.disclaimer}`);
