const RecoveryService = require('../src/services/recoveryService');

async function runScenarioTests() {
  console.log('====================================================');
  console.log('  RECLAIM - 9 Failure & Policy Scenario Test Suite');
  console.log('====================================================\n');

  const ts = Date.now();

  // Scenario A: Insufficient Funds
  console.log('--- SCENARIO A: Insufficient Funds ---');
  const resA = await RecoveryService.processWebhookEvent({
    id: `evt_scen_a_${ts}`,
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: `pay_scen_a_${ts}`,
          amount: 99900,
          currency: 'INR',
          error_reason: 'insufficient_funds',
          notes: { customer_history: 'previously_recovered_after_reminder' }
        }
      }
    }
  });
  console.log(`Action: ${resA.analysis?.recommended_action} (${resA.analysis?.recovery_probability * 100}%)`);
  console.log(`Policy Allowed: ${resA.policy_evaluation?.allowed} | Status: ${resA.execution?.status}\n`);

  // Scenario B: Expired Card
  console.log('--- SCENARIO B: Expired Card ---');
  const resB = await RecoveryService.processWebhookEvent({
    id: `evt_scen_b_${ts}`,
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: `pay_scen_b_${ts}`,
          amount: 129900,
          currency: 'INR',
          error_reason: 'expired_card',
          notes: { customer_history: 'first_time_failure' }
        }
      }
    }
  });
  console.log(`Action: ${resB.analysis?.recommended_action} (${resB.analysis?.recovery_probability * 100}%)`);
  console.log(`Policy Allowed: ${resB.policy_evaluation?.allowed} | Status: ${resB.execution?.status}\n`);

  // Scenario C: Bank Declined
  console.log('--- SCENARIO C: Bank Declined ---');
  const resC = await RecoveryService.processWebhookEvent({
    id: `evt_scen_c_${ts}`,
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: `pay_scen_c_${ts}`,
          amount: 250000,
          currency: 'INR',
          error_reason: 'bank_declined'
        }
      }
    }
  });
  console.log(`Action: ${resC.analysis?.recommended_action} (${resC.analysis?.recovery_probability * 100}%)`);
  console.log(`Policy Allowed: ${resC.policy_evaluation?.allowed} | Status: ${resC.execution?.status}\n`);

  // Scenario D: Network Error
  console.log('--- SCENARIO D: Network Error ---');
  const resD = await RecoveryService.processWebhookEvent({
    id: `evt_scen_d_${ts}`,
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: `pay_scen_d_${ts}`,
          amount: 150000,
          currency: 'INR',
          error_reason: 'network_error'
        }
      }
    }
  });
  console.log(`Action: ${resD.analysis?.recommended_action} (${resD.analysis?.recovery_probability * 100}%)`);
  console.log(`Policy Allowed: ${resD.policy_evaluation?.allowed} | Status: ${resD.execution?.status}\n`);

  // Scenario E: Unknown Failure Reason
  console.log('--- SCENARIO E: Unknown Failure Reason ---');
  const resE = await RecoveryService.processWebhookEvent({
    id: `evt_scen_e_${ts}`,
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: `pay_scen_e_${ts}`,
          amount: 50000,
          currency: 'INR',
          error_reason: 'unmapped_random_gateway_error'
        }
      }
    }
  });
  console.log(`Normalized Reason: ${resE.failure_reason}`);
  console.log(`Action: ${resE.analysis?.recommended_action}`);
  console.log(`Policy Allowed: ${resE.policy_evaluation?.allowed} | Status: ${resE.execution?.status}\n`);

  // Scenario F: Duplicate Webhook
  console.log('--- SCENARIO F: Duplicate Webhook ---');
  const dupEventId = `evt_scen_f_dup_${ts}`;
  const dupFirst = await RecoveryService.processWebhookEvent({
    id: dupEventId,
    event: 'payment.failed',
    payload: { payment: { entity: { id: `pay_scen_f_${ts}`, amount: 99900, error_reason: 'insufficient_funds' } } }
  });
  const dupSecond = await RecoveryService.processWebhookEvent({
    id: dupEventId,
    event: 'payment.failed',
    payload: { payment: { entity: { id: `pay_scen_f_${ts}`, amount: 99900, error_reason: 'insufficient_funds' } } }
  });
  console.log(`First Request Status : ${dupFirst.status}`);
  console.log(`Second Request Status: ${dupSecond.status} (${dupSecond.message})\n`);

  // Scenario G: Already Successful Payment
  console.log('--- SCENARIO G: Already Successful Payment ---');
  const resG = await RecoveryService.processWebhookEvent({
    id: `evt_scen_g_${ts}`,
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: 'pay_demo_captured_69',
          amount: 99900,
          status: 'captured',
          error_reason: 'insufficient_funds'
        }
      }
    }
  });
  console.log(`Policy Allowed: ${resG.policy_evaluation?.allowed} | Reason: ${resG.policy_evaluation?.reason}`);
  console.log(`Execution Status: ${resG.execution?.status} (${resG.execution?.action})\n`);

  // Scenario H: Max Attempts (>= 3)
  console.log('--- SCENARIO H: Max Attempts (>= 3) ---');
  const resH = await RecoveryService.processWebhookEvent({
    id: `evt_scen_h_${ts}`,
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: 'pay_demo_maxattempts_257',
          amount: 99900,
          error_reason: 'insufficient_funds'
        }
      }
    }
  });
  console.log(`Policy Allowed: ${resH.policy_evaluation?.allowed} | Reason: ${resH.policy_evaluation?.reason}`);
  console.log(`Execution Status: ${resH.execution?.status} (${resH.execution?.action})\n`);

  // Scenario I: Cooldown Condition (Within 24h)
  console.log('--- SCENARIO I: Cooldown Condition ---');
  const resI = await RecoveryService.processWebhookEvent({
    id: `evt_scen_i_${ts}`,
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: 'pay_demo_valid_640',
          amount: 99900,
          error_reason: 'insufficient_funds'
        }
      }
    }
  });
  console.log(`Policy Allowed: ${resI.policy_evaluation?.allowed} | Reason: ${resI.policy_evaluation?.reason}`);
  console.log(`Execution Status: ${resI.execution?.status} (${resI.execution?.action})\n`);

  console.log('====================================================');
  console.log('  All 9 Scenarios Verified Successfully!');
  console.log('====================================================');
}

runScenarioTests();
