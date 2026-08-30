# RECLAIM
## AI Revenue Recovery Agent for Merchants

RECLAIM helps merchants recover revenue from failed payments by analyzing failure context and historical outcomes, selecting the most appropriate recovery intervention, checking deterministic safety rules, executing the permitted action in Razorpay Test Mode, and recording an auditable decision trail.

---

## 🎯 Problem

When a customer's payment fails at checkout, traditional merchant payment gateways rely on naive, immediate retries. This creates severe inefficiencies:
- **Card Insufficiency**: Retrying immediately when a customer has insufficient funds leads to repeated failure and fee burn.
- **Expired Credentials**: Immediate retries on expired cards always fail until the customer updates their payment method.
- **Customer Frustration**: Spatially un-coordinated notification blasts cause customer churn and dispute risk.
- **Lost Revenue**: Up to 20–30% of recurring digital subscription revenue is lost to un-recovered payment failures.

---

## 💡 Solution

RECLAIM introduces an **Empirical AI Revenue Recovery Agent** that acts as an intelligent layer between payment gateway failure events and merchant recovery workflows:

1. **Empirical Probabilities**: Evaluates historical failure recovery probabilities across matching failure reasons and customer contexts rather than guessing.
2. **Expected Yield Optimization**: Evaluates candidate interventions (`REMINDER`, `RETRY_LATER`, `PAYMENT_METHOD_UPDATE`, `IMMEDIATE_RETRY`) and selects the action maximizing expected recovery yield:
   $$E = \text{Amount} \times P(\text{Recovery} \mid \text{Intervention}, \text{Reason})$$
3. **Safety & Policy Guardrails**: Enforces 5 deterministic safety rules before executing any action. If safety policies fail, RECLAIM halts automated execution (`DO NOT ACT`) and returns `STOP`, `WAIT`, or `ESCALATE`.
4. **Razorpay Test Mode Execution**: Generates real Razorpay payment links via the official Node SDK or simulated test adapter.
5. **Traceable Compliance Trail**: Logs every decision, policy state, and dispatch to an immutable audit record.

---

## ⚙️ How RECLAIM Works

```
Merchant Dashboard (React / Vite)
        ↓ POST /api/recovery/analyze
Express API Server (Node.js)
        ↓
Recovery Decision Engine (Empirical EV Maximization)
        ↓
Safety / Policy Engine (Deterministic Rule Checks)
        ↓
Razorpay Executor (Node SDK / Test-Mode Adapter)
        ↓ POST /api/webhooks/razorpay
Audit Logger (data/audit_logs.json)
```

---

## 🏗️ System Architecture

- **Merchant Console (`/frontend-v2`)**: A modern fintech dashboard built with React 18, Vite 5, and Tailwind CSS. Provides an Overview Command Center, Searchable Failed Payments Workspace, AI Decision Console, Analytics LOOCV Proof, and Audit Logs.
- **API Gateway (`src/server.js`, `src/routes/`)**: Express server providing health checks, single payment analysis, batch analysis, out-of-sample LOOCV validation, Razorpay webhooks, and audit retrieval.
- **Decision Engine (`src/engine/decisionEngine.js`)**: Computes empirical recovery probabilities from historical dataset failures (`data/payments.json`) and calculates optimal candidate expected values.
- **Safety Policy Engine (`src/engine/policyEngine.js`, `src/services/policyService.js`)**: Evaluates deterministic rules to prevent over-contacting, illegal retries, or duplicate executions.
- **Razorpay Integration (`src/services/razorpayService.js`)**: Official Node SDK client with HMAC SHA256 webhook signature verification and simulated test-mode fallback.
- **Audit Logger (`src/utils/auditLogger.js`)**: Maintains persistent, immutable records of all recovery actions in `data/audit_logs.json`.

---

## 🧠 AI / Decision Engine

For any failed payment, RECLAIM analyzes the failure context:
- `payment_id`
- `amount`
- `failure_reason` (`insufficient_funds`, `expired_card`, `bank_declined`, `network_error`)
- `customer_history` (`previously_recovered_after_reminder`, `first_time_failure`, `frequent_failed_attempts`, `active_subscriber`)

The engine computes historical success rates for all candidate recovery interventions:
- **`REMINDER`**: Dispatches notification/payment link (Optimal for `insufficient_funds` & `previously_recovered`).
- **`RETRY_LATER`**: Schedules delayed gateway retry (Optimal for `network_error` & `bank_declined`).
- **`PAYMENT_METHOD_UPDATE`**: Requests card/payment method update (Optimal for `expired_card`).
- **`IMMEDIATE_RETRY`**: Retries payment immediately.

The intervention yielding the maximum expected recovery amount is selected as the recommended action.

---

## 🛡️ Safety & Policy Rules

The Decision Engine recommends *what is likely to work*; the Safety & Policy Engine decides *whether execution is allowed*.

RECLAIM enforces 5 deterministic safety rules:

1. **`PAYMENT_SUCCESS`**: If payment status is `captured` or `success`, block all further recovery actions (`reason: payment_already_recovered`, `action: stop`).
2. **`RECOVERY_WINDOW`**: If payment failure is older than 72 hours, block recovery (`reason: payment_expired_window`, `action: stop`).
3. **`MAX_ATTEMPTS`**: If recovery attempts $\ge 3$, block automated recovery (`reason: maximum_recovery_attempts_reached`, `action: escalate`).
4. **`COOLDOWN`**: Block repeated recovery actions within a 24-hour window (`reason: recovery_cooldown_active`, `action: wait`).
5. **`LOW_CONFIDENCE`**: If decision probability confidence is insufficient, block automated dispatch (`reason: low_decision_confidence`, `action: escalate`).

> [!IMPORTANT]
> **DO NOT ACT Rationale**: When a safety rule triggers, RECLAIM explicitly halts automated execution (`DO NOT ACT`), preventing spam, duplicate charges, or customer harassment.

---

## 💳 Razorpay Integration & Security

- **Server-Side Credentials Only**: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are stored strictly on the server in environment variables (`.env`). Frontend client code **NEVER** receives private API keys or secrets.
- **HMAC SHA256 Webhook Verification**: `POST /api/webhooks/razorpay` verifies incoming request signatures using `crypto.createHmac('sha256', secret)` on header `x-razorpay-signature`.
- **Test Mode & Simulation Adapter**: When valid Razorpay credentials are present, the server uses official `razorpay` SDK `client.paymentLink.create(...)`. When using test defaults, the server uses a simulated Test Mode adapter formatting test URLs (`https://rzp.io/i/test_link_...`).

> [!WARNING]
> **Test Mode Disclaimer**: Payment links generated during demos operate in Razorpay Test Mode or Simulation. Generating a payment link does **NOT** mean the customer has paid, and no real money is charged.

---

## 🔄 Idempotency

RECLAIM checks `data/processed_events.json` prior to processing any webhook event. If a duplicate webhook event ID is received:
- Processing is skipped (`status: "already_processed"`).
- Duplicate Razorpay action dispatches are prevented.
- UI button states automatically disable after execution to prevent duplicate user clicks.

---

## 📊 Out-of-Sample Validation & Statistical Proof

RECLAIM uses **Leave-One-Out Cross-Validation (LOOCV)** backtesting to prevent in-sample selection bias. Each payment record is sequentially held out from the training set, trained on the remaining $N-1$ samples, and evaluated against held-out actual outcomes.

### Verified Benchmark Results (54 Dataset Records):

- **Dataset Size**: **54** historical failed payment records.
- **Primary Out-of-Sample LOOCV Recovery Rate**: **50.0%** actual recovery on held-out samples.
- **Baseline Naive Recovery Rate** (Always Immediate Retry): **15.7%** actual recovery.
- **Net Out-of-Sample Lift**: **+34.3 percentage points** (217.6% relative lift over naive retry).
- **Prediction MAE**: **0.505** Mean Absolute Error.
- **Secondary In-Sample Expected Value Rate**: **79.1%** expected recovery yield ($₹54,584$ expected recovery of $₹68,046$ revenue at risk).

> [!NOTE]
> **Demo Data Disclaimer**: Evaluated on synthetic historical payment dataset (`data/payments.json`) for Buildathon prototype demonstration. Does not represent live Razorpay production metrics.

---

## 🎬 11-Step Buildathon Demo Flow

1. **Open Dashboard**: Navigate to `http://localhost:5174`.
2. **Review Overview KPIs**: View `₹68,046` Revenue at Risk, `₹54,584` Expected Recovery, `54` Failed Payments, and `+34.3 pts` Lift.
3. **Select Failed Payment**: Click any row in **Payments Needing Recovery** (e.g. `pay_demo_001` - `₹999` `insufficient_funds`).
4. **Inspect AI Decision Console**: View the 3-step visual flow (`FAILED` $\rightarrow$ `ANALYZING` $\rightarrow$ `RECOVERY ACTION`).
5. **View Recommendation**: See `REMINDER` recommended action, `69.0%` recovery probability, and `₹689.31` expected yield.
6. **Review Rationale**: Read empirical reason (*"9 of 13 similar historical reminder attempts recovered"*).
7. **Inspect Alternatives**: See candidate interventions with `BEST OPTION` badge.
8. **Check Safety Rules**: Verify 5 green safety check marks (`✓ Payment not recovered`, `✓ Recovery window <72h`, `✓ Cooldown >24h`, `✓ Attempts <3`, `✓ Confidence acceptable`).
9. **Click Execute Recovery**: Click `[ EXECUTE RECOVERY ]`.
10. **View Execution Timeline**: Watch live lifecycle dispatches (`✓ Decision made` $\rightarrow$ `✓ Recovery action dispatched` $\rightarrow$ `✓ Razorpay test-mode action created` $\rightarrow$ `✓ Audit event recorded`) and copy test payment link.
11. **Verify Audit & Analytics**: Click `[ View Audit Log ]` to inspect the compliance trail, then open **Analytics** to view LOOCV validation proof.

---

## 💻 Tech Stack

- **Backend**: Node.js, Express 5, Razorpay Node SDK, `dotenv`, `cors`.
- **Frontend**: React 18, Vite 5, Tailwind CSS 3, Inter font family.
- **Data Persistence**: JSON file storage (`data/payments.json`, `data/audit_logs.json`, `data/processed_events.json`).

---

## 📂 Project Structure

```
reclaim/
├── data/
│   ├── payments.json            # 54 historical payment failure records
│   ├── audit_logs.json          # Persistent audit trail log
│   └── processed_events.json    # Idempotency event tracking
├── docs/
│   ├── architecture.md          # Architecture documentation
│   ├── demo-flow.md              # 90-second demo script
│   ├── safety.md                # Safety rules & policy engine docs
│   └── evaluation.md            # LOOCV validation mathematics docs
├── frontend-v2/                 # Production RECLAIM Merchant Dashboard
│   ├── src/
│   │   ├── components/          # Reusable SaaS UI components
│   │   ├── pages/               # Overview, Payments, Recovery, Analytics, Audit
│   │   ├── services/api.js      # Backend API client
│   │   ├── App.jsx              # Application shell & router
│   │   └── main.jsx             # Entry point
│   ├── package.json
│   └── vite.config.js
├── scripts/
│   ├── demo.js                  # Policy scenario demo script
│   ├── validate.js              # LOOCV single-payment validation script
│   ├── batch.js                 # Batch expected recovery script
│   ├── batch-validate.js        # LOOCV batch backtesting script
│   └── verify-9-scenarios.js    # 9 failure & policy scenario test script
├── src/
│   ├── engine/                  # Decision Engine & Policy Engine
│   ├── routes/                  # Health, Recovery, & Webhook routes
│   ├── services/                # Recovery, Razorpay, Validation services
│   ├── utils/                   # Audit Logger & Helper utilities
│   └── server.js                # Express Server entry point
├── tests/                       # Unit tests (policy.test.js)
├── .env.example                 # Environment variable template
├── .gitignore                   # Git exclusion rules
├── package.json                 # Project dependencies & scripts
└── README.md                    # Product documentation
```

---

## 🛠️ Local Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/reclaim.cmd.git
cd reclaim

# Install backend dependencies
npm install

# Install frontend-v2 dependencies
cd frontend-v2
npm install
cd ..
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` if using real Razorpay Test Mode credentials:
```env
PORT=5000
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
VITE_API_BASE_URL=http://localhost:5000
```
*(If left as defaults, RECLAIM operates in simulated Test Mode adapter format).*

### 3. Start Application

#### Terminal 1: Express Backend (Port 5000)
```bash
npm start
```

#### Terminal 2: V2 Merchant Dashboard (Port 5174)
```bash
npm run frontend-v2
```

Open dashboard in browser: **`http://localhost:5174`**

---

## 🧪 Testing & Verification Commands

RECLAIM includes a complete verification test suite using the exact project scripts:

```bash
# 1. Run Policy & Webhook Pipeline Demo Suite
npm test

# 2. Run LOOCV Single-Payment Validation
npm run validate

# 3. Run Batch Recovery Expected Value Analysis
npm run batch

# 4. Run Out-of-Sample LOOCV Batch Backtest
npm run batch-validate

# 5. Run Policy Engine Unit Tests
node tests/policy.test.js

# 6. Run 9 Failure & Policy Scenario Integration Test
node scripts/verify-9-scenarios.js

# 7. Build Production Frontend-V2 Bundle
npx vite build --config frontend-v2/vite.config.js frontend-v2
```

---

## ⚠️ Limitations & Future Roadmap

- **Dataset Scale**: Currently evaluated on a 54-sample synthetic historical failure dataset for Buildathon prototype demonstration.
- **Production Gateways**: Currently interfaces with Razorpay Node SDK Test Mode. Production deployment requires webhooks connected to live Merchant ID webhooks.
- **Machine Learning Extensions**: Future iterations can integrate dynamic bandit algorithms (e.g. LinUCB / Thompson Sampling) to continuously learn optimal interventions as live merchant recovery volume scales.
