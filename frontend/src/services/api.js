const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Checks server health status.
 */
export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  return response.json();
}

/**
 * Executes empirical recovery decision analysis for a failed payment context.
 * @param {Object} payload 
 */
export async function analyzePayment(payload) {
  const response = await fetch(`${API_BASE_URL}/api/recovery/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Analysis request failed with status ${response.status}`);
  }
  return data;
}

/**
 * Runs Leave-One-Out counterfactual validation across historical dataset.
 */
export async function validateEngine() {
  const response = await fetch(`${API_BASE_URL}/api/recovery/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Validation request failed with status ${response.status}`);
  }
  return data;
}

/**
 * Runs batch analysis across all historical payment failure records.
 */
export async function batchAnalyze() {
  const response = await fetch(`${API_BASE_URL}/api/recovery/batch-analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Batch analysis failed with status ${response.status}`);
  }
  return data;
}

/**
 * Runs Leave-One-Out Cross-Validation (LOOCV) batch backtesting preventing selection bias.
 */
export async function batchValidate() {
  const response = await fetch(`${API_BASE_URL}/api/recovery/batch-validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Batch validation failed with status ${response.status}`);
  }
  return data;
}

/**
 * Triggers test-mode recovery action execution / simulation via Razorpay webhook pipeline.
 * @param {Object} payload 
 */
export async function simulateRecovery(payload) {
  const webhookEvent = {
    entity: 'event',
    account_id: 'acc_demo_merchant_01',
    event: 'payment.failed',
    id: `event_ui_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: payload.payment_id,
          amount: Math.round(Number(payload.amount) * 100), // convert to paise if number
          currency: payload.currency || 'INR',
          status: 'failed',
          error_reason: payload.failure_reason,
          notes: {
            customer_history: payload.customer_history
          }
        }
      }
    }
  };

  const response = await fetch(`${API_BASE_URL}/api/webhooks/razorpay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(webhookEvent)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Simulation request failed with status ${response.status}`);
  }
  return data;
}
