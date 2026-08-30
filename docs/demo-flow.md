# RECLAIM - 90-Second Buildathon Demo Flow

This document details the exact 90-second demonstration script for presenting RECLAIM at the Razorpay AI Buildathon.

---

## ⏱️ 90-Second Demo Sequence

```
[0:00 - 0:15] OVERVIEW COMMAND CENTER
• Open RECLAIM V2 Dashboard at http://localhost:5174.
• Highlight Top KPI Strip:
  - ₹68,046 Revenue at Risk across 54 failed payments.
  - ₹54,128 Expected Recovery Yield.
  - +34.3 pts Out-of-Sample Lift benchmarked via Leave-One-Out Cross-Validation.
• Point out live status: "Test environment • Razorpay connected".

[0:15 - 0:35] FAILED PAYMENT INSPECTION
• Click on payment pay_demo_001 in the Recovery Queue.
• Amount: ₹999 | Failure Reason: Insufficient Funds.
• Explain: "Instead of retrying immediately—which causes 0% recovery for insufficient funds—RECLAIM analyzes historical recovery evidence."

[0:35 - 0:50] EMPIRICAL DECISION & RATIONALE
• Inspect the Decision Panel:
  - Recommended Action: REMINDER
  - Recovery Probability: 69.0%
  - Expected Yield: ₹689.31
  - Historical Rationale: "9 of 13 similar historical attempts recovered after a reminder."
  - Alternatives Evaluated: Retry Later (38%), Payment Update (25%), Immediate Retry (0%).

[0:50 - 1:10] AUTOMATED RECOVERY DISPATCH & WEBHOOK PIPELINE
• Click [ Execute Recovery Action ].
• Show instant execution pipeline:
  1. Safety & Policy Engine checks pass (Not recovered, attempts < 3, no cooldown).
  2. Action Dispatched: Razorpay Payment Link generated (https://rzp.io/i/test_link_...).
  3. Audit Logged: Immutable record saved to data/audit_logs.json.
• Demonstrate Idempotency: Click button again—notice action is locked and duplicate webhooks return already_processed status.

[1:10 - 1:30] VALIDATION & EVALUATION PROOF
• Navigate to Analytics & Validation page.
• Show Out-of-Sample LOOCV Backtesting:
  - Actual Historical Recovery: 50.0% vs Baseline (15.7%).
  - Net Lift: +34.3 percentage points (+217.6% relative improvement).
  - Prediction MAE: 0.505.
• Highlight statistical integrity: "We strictly distinguish out-of-sample backtesting from in-sample expected value simulation to prevent selection bias."
```
