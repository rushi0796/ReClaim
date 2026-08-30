# RECLAIM - Safety & Policy Engine Documentation

A autonomous revenue recovery agent must possess deterministic stopping rules. Blindly retrying failed payments damages merchant brand reputation, triggers customer complaints, and risks card network fines for excessive retries.

RECLAIM implements a dedicated **Safety & Policy Engine** (`src/engine/policyEngine.js`) that sits between the decision engine and the recovery executor to evaluate whether an action is permitted.

---

## 🛡️ The 5 Deterministic Safety Rules

```
Payment Failure Event
         ↓
Empirical Decision Engine (Determines WHAT intervention is optimal)
         ↓
Safety & Policy Engine (Determines WHETHER execution is allowed)
         │
         ├── 1. PAYMENT_SUCCESS? ────► [BLOCK] Reason: payment_already_recovered
         ├── 2. RECOVERY_WINDOW? ─────► [BLOCK] Reason: payment_expired_window (>72h)
         ├── 3. MAX_ATTEMPTS? ────────► [BLOCK] Reason: maximum_recovery_attempts_reached (>=3)
         ├── 4. COOLDOWN? ────────────► [BLOCK] Reason: recovery_cooldown_active (<24h)
         └── 5. LOW_CONFIDENCE? ──────► [BLOCK] Reason: low_decision_confidence
         │
         ▼ (All Rules Pass)
ALLOW EXECUTION
```

---

## 📋 Detailed Rule Specifications

### 1. PAYMENT_SUCCESS Rule
- **Condition**: Payment status is `captured` or `success`.
- **Action**: `stop`
- **Rationale**: Prevents accidental double charging or customer harassment when a payment has already been successfully recovered.

### 2. RECOVERY_WINDOW Rule
- **Condition**: Payment failure occurred > 72 hours ago.
- **Action**: `expire`
- **Rationale**: Stale payment failures have extremely low recovery probability and risk customer friction if retried unexpectedly.

### 3. MAX_ATTEMPTS Rule
- **Condition**: Payment has already undergone $\ge 3$ recovery attempts.
- **Action**: `escalate`
- **Rationale**: Strictly limits total retry attempts to 3 to comply with card network safety guidelines and prevent merchant rate-limiting.

### 4. COOLDOWN Rule
- **Condition**: A recovery action was attempted for this payment within the last 24 hours.
- **Action**: `wait`
- **Rationale**: Prevents repeated automatic retries or duplicate reminders from overwhelming the end customer.

### 5. LOW_CONFIDENCE Rule
- **Condition**: Empirical dataset has insufficient sample size or recovery probability confidence is tagged `low`.
- **Action**: `escalate`
- **Rationale**: Prevents the agent from taking risky automated actions when data evidence is insufficient, escalating to merchant support instead.

---

## 🚫 The "DO NOT ACT" Principle

When any safety check fails, RECLAIM explicitly decides: **"DO NOT ACT"**.
It returns a blocked status (`status: "blocked"`), logs the policy failure reason to `data/audit_logs.json`, and halts automated execution.
