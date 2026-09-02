const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined
  ? import.meta.env.VITE_API_BASE_URL
  : (import.meta.env.DEV ? 'http://localhost:5000' : '');

export async function fetchHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

export async function fetchDiagnostics() {
  const res = await fetch(`${API_BASE_URL}/api/recovery/diagnostics`);
  if (!res.ok) throw new Error(`Diagnostics fetch failed: ${res.status}`);
  return res.json();
}

export async function syncRazorpayPayments() {
  const res = await fetch(`${API_BASE_URL}/api/recovery/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Sync failed: ${res.status}`);
  return data;
}

export async function analyzePayment(payload) {
  const res = await fetch(`${API_BASE_URL}/api/recovery/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Analysis failed: ${res.status}`);
  return data;
}

export async function validateEngine() {
  const res = await fetch(`${API_BASE_URL}/api/recovery/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Validation failed: ${res.status}`);
  return data;
}

export async function batchAnalyze() {
  const res = await fetch(`${API_BASE_URL}/api/recovery/batch-analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Batch analysis failed: ${res.status}`);
  return data;
}

export async function batchValidate() {
  const res = await fetch(`${API_BASE_URL}/api/recovery/batch-validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Batch validation failed: ${res.status}`);
  return data;
}

export async function simulateRecovery(payload) {
  const webhookEvent = {
    entity: 'event',
    account_id: 'acc_demo_merchant_01',
    event: 'payment.failed',
    id: `event_v2_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: payload.payment_id,
          amount: Math.round(Number(payload.amount) * 100),
          currency: payload.currency || 'INR',
          status: 'failed',
          error_reason: payload.failure_reason,
          notes: { customer_history: payload.customer_history }
        }
      }
    }
  };

  const res = await fetch(`${API_BASE_URL}/api/webhooks/razorpay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhookEvent)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Simulation failed: ${res.status}`);
  return data;
}

export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE_URL}/api/audit`);
  if (!res.ok) throw new Error(`Fetch audit logs failed: ${res.status}`);
  return res.json();
}
