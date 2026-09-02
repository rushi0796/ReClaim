# RECLAIM
## AI Revenue Recovery Agent for Merchants
### Created by RUSHIKESH.STUDIO for Razorpay AI Buildathon

RECLAIM helps merchants recover revenue from failed payments by analyzing failure context and historical outcomes using GenAI and empirical decision models, checking deterministic safety rules, executing permitted recovery actions in Razorpay Test Mode, and recording an auditable compliance decision trail.

---

## 🎯 Problem

When a customer's payment fails at checkout, traditional merchant payment gateways rely on naive, immediate retries. This creates severe inefficiencies:
- **Card Insufficiency**: Retrying immediately when a customer has insufficient funds leads to repeated failure and fee burn.
- **Expired Credentials**: Immediate retries on expired cards always fail until the customer updates their payment method.
- **Customer Frustration**: Spatially un-coordinated notification blasts cause customer churn and dispute risk.
- **Lost Revenue**: Up to 20–30% of recurring digital subscription revenue is lost to un-recovered payment failures.

---

## 💡 Solution

RECLAIM introduces an **Empirical GenAI Revenue Recovery Agent** that acts as an intelligent layer between payment gateway failure events and merchant recovery workflows:

1. **GenAI & Empirical Probability Reasoning**: Evaluates historical failure recovery probabilities across matching failure reasons and customer contexts using structured GenAI (`gemini-1.5-flash`) with safe deterministic fallback.
2. **Expected Yield Optimization**: Evaluates candidate interventions (`REMINDER`, `RETRY_LATER`, `PAYMENT_METHOD_UPDATE`, `IMMEDIATE_RETRY`) and selects the action maximizing expected recovery yield:
   $$E = \text{Amount} \times P(\text{Recovery} \mid \text{Intervention}, \text{Reason})$$
3. **Safety & Policy Guardrails**: Enforces 5 deterministic safety rules before executing any action. If safety policies fail, RECLAIM halts automated execution (`DO NOT ACT`) and returns `STOP`, `WAIT`, or `ESCALATE`.
4. **Razorpay Test Mode Execution**: Generates real Razorpay payment links via the official Node SDK or simulated test adapter.
5. **Lifecycle Event Handling**: Handles both `payment.failed` (evaluating recovery) and `payment.captured` (marking payment as captured and halting further interventions).
6. **Traceable Compliance Trail**: Logs every decision, policy state, and dispatch to an immutable audit record.

---

## ⚙️ How RECLAIM Works

```
Razorpay Webhook (payment.failed / payment.captured)
        ↓ POST /api/webhooks/razorpay
HMAC SHA256 Signature Verification & Idempotency Check
        ↓
Payment Failure Context Extraction
        ↓
GenAI Recovery Reasoning (Gemini 1.5 Flash + LOOCV Baseline)
        ↓
Deterministic Safety Policy Engine (5 Rules Enforced)
        ↓
Allowed / Wait / Stop / Escalate
        ↓
Razorpay Test Mode Action (SDK Payment Link / Simulation)
        ↓
Persistent Audit Trail Logging (data/audit_logs.json)
```

---

## 🤖 GenAI Integration & Safe Fallback Architecture

GenAI is an integral component of RECLAIM's recovery decision engine:

1. **Structured Input**: Receives structured payment failure context (`amount`, `failure_reason`, `customer_history`, `attempt_count`) and empirical historical outcome rates.
2. **Structured Recommendation**: Prompts Gemini 1.5 Flash to generate JSON containing:
   ```json
   {
     "recommended_action": "reminder",
     "confidence": 0.69,
     "reason": "Historical outcomes indicate insufficient funds recover most frequently after a friendly reminder rather than immediate retries.",
     "expected_recovery_value": 689.31
   }
   ```
3. **Schema Validation**: Output is strictly schema-validated before passing to policy checks.
4. **Deterministic Safe Fallback**: If the GenAI API is un-configured, times out (>4s), returns invalid JSON, or fails, RECLAIM seamlessly falls back to the deterministic LOOCV empirical decision engine (`DecisionEngine.analyze`) to prevent risky or unguided executions.
5. **Safety Engine Gatekeeper**: GenAI recommendations **NEVER** execute directly. They must pass through the 5 deterministic safety policy rules (`PAYMENT_SUCCESS`, `RECOVERY_WINDOW`, `MAX_ATTEMPTS`, `COOLDOWN`, `LOW_CONFIDENCE`) before any recovery link is dispatched.

---

## 🛡️ Safety & Policy Engine Rules

| Policy Rule | Rule Rationale | Trigger Condition | System Action |
| :--- | :--- | :--- | :--- |
| **1. `PAYMENT_SUCCESS`** | Payment already captured/recovered | Status is `captured` or `success` | `STOP` execution |
| **2. `RECOVERY_WINDOW`** | Payment failure too old | Failure occurred $>72\text{h}$ ago | `STOP` execution |
| **3. `MAX_ATTEMPTS`** | Excessive contact prevention | Prior recovery attempts $\ge 3$ | `ESCALATE` to merchant |
| **4. `COOLDOWN`** | Customer contact fatigue | Action dispatched within past $24\text{h}$ | `WAIT` (active cooldown) |
| **5. `LOW_CONFIDENCE`** | Decision uncertainty | Recommendation probability $< 30\%$ | `ESCALATE` to human operator |

---

## 💳 Razorpay Test Mode Setup & Environment Variables

### Required Environment Variables (`.env`)

```env
PORT=5000
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here
VITE_API_BASE_URL=http://localhost:5000
GEMINI_API_KEY=your_gemini_api_key_here
```

### Webhook Configuration

- **Webhook Endpoint**: `POST /api/webhooks/razorpay`
- **Supported Events**:
  - `payment.failed`: Triggers RECLAIM AI recovery pipeline.
  - `payment.captured`: Marks payment as recovered, halts future recovery actions.

---

## 🧪 Testing Commands

```bash
# 1. Run Webhook Pipeline & Safety Engine Scenarios
npm test

# 2. Run Comprehensive Automated Integration Test Suite (19 Tests)
node tests/integration.test.js

# 3. Run LOOCV Counterfactual Validation (54 Samples)
npm run validate

# 4. Run Batch Recovery Yield Analysis
npm run batch

# 5. Run Out-of-Sample LOOCV Batch Backtesting
npm run batch-validate

# 6. Run Safety Policy Engine Unit Tests
node tests/policy.test.js

# 7. Run 9 Failure & Policy Scenario Tests
node scripts/verify-9-scenarios.js

# 8. Run Production Bundle Build
npx vite build --config frontend-v2/vite.config.js frontend-v2
```

---

## 🔒 Security & Idempotency

- **Zero Exposed Secrets**: Server-side credentials (`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) reside strictly in `.env`. Zero secrets are exposed in frontend code, browser bundles, git commits, or API responses.
- **HMAC SHA256 Webhook Verification**: `x-razorpay-signature` headers are verified using timing-safe buffer comparison.
- **Idempotency**: Duplicate webhook payloads with identical event IDs return `status: "already_processed"` to guarantee zero double dispatches.

---

## 🚀 Public Live Deployment

- **Live Frontend Application**: [https://reclaim-bay.vercel.app/](https://reclaim-bay.vercel.app/)
- **GitHub Repository**: [https://github.com/rushi0796/ReClaim.git](https://github.com/rushi0796/ReClaim.git)

---

## ⚠️ Test Mode & Demo Data Disclaimer

- **RECLAIM** operates in **RAZORPAY TEST MODE** and uses synthetic historical payment datasets for prototype demonstration.
- No real customer money is charged or moved. All generated Payment Links are test mode links (`https://rzp.io/i/...`).
