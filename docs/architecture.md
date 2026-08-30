# RECLAIM - AI Revenue Recovery System Architecture

RECLAIM is an intelligent AI Revenue Recovery Agent designed for merchants using Razorpay. It replaces blind payment retries with data-driven intervention decisions backed by empirical historical recovery evidence and deterministic safety guardrails.

---

## 🏛️ High-Level System Architecture

```
                               ┌──────────────────────────┐
                               │   Razorpay Test Mode /   │
                               │   Failed Payment Event   │
                               └────────────┬─────────────┘
                                            │
                                            ▼
                               ┌──────────────────────────┐
                               │  POST /api/webhooks/     │
                               │        razorpay          │
                               └────────────┬─────────────┘
                                            │
                                            ▼
                               ┌──────────────────────────┐
                               │ Idempotency Verification │
                               │(data/processed_events)   │
                               └────────────┬─────────────┘
                                            │
                                            ▼
                               ┌──────────────────────────┐
                               │ Empirical Decision Engine│
                               │  (data/payments.json)    │
                               └────────────┬─────────────┘
                                            │
                                            ▼
                               ┌──────────────────────────┐
                               │ Safety & Policy Engine   │
                               │  (5 Deterministic Rules) │
                               └────────────┬─────────────┘
                                            │
                                            ▼
                               ┌──────────────────────────┐
                               │ Recovery Action Executor │
                               │ (Razorpay SDK / Adapter) │
                               └────────────┬─────────────┘
                                            │
                                            ▼
                               ┌──────────────────────────┐
                               │   Audit Logger & Store   │
                               │  (data/audit_logs.json)  │
                               └──────────────────────────┘
```

---

## 🧩 Core Subsystem Responsibilities

### 1. Application Shell (`frontend-v2/`)
- Built with **React 18** and **Vite 5**.
- Implements a Stripe/Linear-quality responsive merchant dashboard.
- Communicates asynchronously with the backend API (`http://localhost:5000`).

### 2. API Services Layer (`src/routes/` & `src/services/`)
- **Health Check (`GET /health`)**: Verifies service status.
- **Single Payment Analysis (`POST /api/recovery/analyze`)**: Computes optimal intervention probabilities for a specific payment context.
- **LOOCV Validation (`POST /api/recovery/validate`)**: Performs Leave-One-Out Cross-Validation on held-out records.
- **Batch Analysis (`POST /api/recovery/batch-analyze`)**: Runs in-sample expected value simulation across all dataset records.
- **Batch Validation (`POST /api/recovery/batch-validate`)**: Runs out-of-sample LOOCV backtesting across the dataset.
- **Razorpay Webhook (`POST /api/webhooks/razorpay`)**: Receives `payment.failed` events and dispatches automated recovery dispatches.
- **Audit Logs (`GET /api/audit`)**: Returns immutable recovery execution logs.

### 3. Empirical Decision Engine (`src/engine/decisionEngine.js`)
- Evaluates candidate interventions: `reminder`, `payment_method_update`, `retry_later`, `immediate_retry`.
- Computes empirical recovery probability $P(\text{recovered} \mid \text{failure\_reason}, \text{intervention})$ from historical records (`data/payments.json`).
- Calculates expected recovery value $E = \text{Amount} \times P$.
- Selects the intervention maximizing expected recovered yield.

### 4. Safety & Policy Engine (`src/engine/policyEngine.js` & `src/services/policyService.js`)
- Evaluates 5 deterministic safety rules before executing any recovery action:
  1. `PAYMENT_SUCCESS`: Blocks recovery if status is `captured` or `success`.
  2. `RECOVERY_WINDOW`: Blocks recovery if failure is older than 72 hours.
  3. `MAX_ATTEMPTS`: Blocks recovery if attempts $\ge 3$.
  4. `COOLDOWN`: Blocks repeated interventions within 24 hours.
  5. `LOW_CONFIDENCE`: Escalates if recovery probability confidence is insufficient.

### 5. Recovery Action Executor (`src/services/recoveryActionExecutor.js` & `razorpayService.js`)
- Interfaces with the official Razorpay Node SDK when credentials are configured (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
- Provides a simulated Test-Mode adapter producing payment URLs (`https://rzp.io/i/test_link_...`) with explicit `execution_mode: 'RAZORPAY_TEST_MODE_SIMULATED'` when using test credentials.

### 6. Audit & Idempotency Store (`src/utils/idempotency.js` & `src/utils/auditLogger.js`)
- **Idempotency**: Prevents duplicate execution of webhook events by recording processed IDs in `data/processed_events.json`.
- **Audit Logs**: Records full execution trace (`timestamp`, `payment_id`, `analysis`, `policy_evaluation`, `execution`) in `data/audit_logs.json`.
