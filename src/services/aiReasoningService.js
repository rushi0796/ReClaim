const DecisionEngine = require('../engine/decisionEngine');

class AiReasoningService {
  /**
   * Analyzes payment failure context using GenAI structured reasoning,
   * with guaranteed safe fallback to empirical LOOCV decision engine.
   * 
   * @param {Object} paymentContext - Context containing amount, failure_reason, customer_history, etc.
   * @param {Object} empiricalAnalysis - Baseline empirical historical outcome analysis from DecisionEngine
   * @returns {Promise<Object>} Structured recovery analysis result
   */
  static async analyzePaymentWithAI(paymentContext, empiricalAnalysis) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // Default empirical baseline
    const baseline = empiricalAnalysis || DecisionEngine.analyze(paymentContext);
    const validActions = ['reminder', 'retry_later', 'payment_method_update', 'immediate_retry'];

    if (!apiKey) {
      // Deterministic Safe Fallback when GenAI key is not configured
      return {
        ...baseline,
        ai_status: 'FALLBACK_DETERMINISTIC',
        ai_engine: 'LOOCV_EMPIRICAL_ENGINE',
        is_ai_generated: false,
        ai_message: 'GenAI provider key not set. Used safe deterministic LOOCV empirical decision engine.'
      };
    }

    try {
      const promptText = `You are RECLAIM AI Revenue Recovery Agent.
Analyze this failed payment context and historical empirical outcomes to recommend the optimal recovery action.

PAYMENT CONTEXT:
- Payment ID: ${paymentContext.payment_id || 'unknown'}
- Amount: ₹${paymentContext.amount || 0} ${paymentContext.currency || 'INR'}
- Failure Reason: ${paymentContext.failure_reason || 'insufficient_funds'}
- Customer History: ${paymentContext.customer_history || 'first_time_failure'}

HISTORICAL OUTCOME EMPIRICAL BENCHMARKS:
${baseline.alternatives ? baseline.alternatives.map(a => `- Action '${a.action}': Predicted Recovery ${(a.recovery_probability * 100).toFixed(1)}%, Expected Value ₹${a.expected_recovered_amount.toFixed(2)}`).join('\n') : ''}
- Recommended Empirical Action: '${baseline.analysis.recommended_action}' (${(baseline.analysis.recovery_probability * 100).toFixed(1)}% prob, expected ₹${baseline.analysis.expected_recovered_amount.toFixed(2)})

INSTRUCTIONS:
Select the best recovery action strictly from: ["reminder", "retry_later", "payment_method_update", "immediate_retry"].
Return strictly valid JSON matching this exact structure:
{
  "recommended_action": "reminder",
  "confidence": 0.69,
  "reason": "Clear concise explanation connecting failure reason and customer history to empirical recovery rate.",
  "expected_recovery_value": 689.31
}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout for safety

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        })
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Gemini API HTTP ${res.status}`);
      }

      const rawJson = await res.json();
      const textResponse = rawJson.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) {
        throw new Error('Empty response content from GenAI provider');
      }

      // Clean & parse JSON response
      const cleanedText = textResponse.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      const aiParsed = JSON.parse(cleanedText);

      // Validate schema compliance
      if (
        !aiParsed.recommended_action ||
        !validActions.includes(aiParsed.recommended_action) ||
        typeof aiParsed.confidence !== 'number'
      ) {
        throw new Error('GenAI output schema validation failed: invalid action or confidence format');
      }

      const selectedAction = aiParsed.recommended_action;
      const confidenceVal = Math.min(Math.max(Number(aiParsed.confidence) || 0, 0), 1);
      const expectedVal = typeof aiParsed.expected_recovery_value === 'number'
        ? aiParsed.expected_recovery_value
        : (paymentContext.amount * confidenceVal);

      // Re-map analysis structure preserving empirical alternatives
      return {
        payment_id: paymentContext.payment_id,
        amount: paymentContext.amount,
        currency: paymentContext.currency || 'INR',
        analysis: {
          recommended_action: selectedAction,
          recovery_probability: confidenceVal,
          expected_recovered_amount: Number(expectedVal.toFixed(2)),
          confidence: confidenceVal >= 0.6 ? 'high' : (confidenceVal >= 0.4 ? 'medium' : 'low'),
          reason: aiParsed.reason || `GenAI recommended '${selectedAction}' based on failure context.`
        },
        alternatives: baseline.alternatives,
        ai_status: 'ACTIVE_GENAI',
        ai_engine: 'GEMINI_1_5_FLASH',
        is_ai_generated: true
      };

    } catch (err) {
      console.warn('GenAI reasoning warning (falling back safely to deterministic LOOCV decision engine):', err.message);
      
      // Deterministic Safe Fallback on any GenAI exception or timeout
      return {
        ...baseline,
        ai_status: 'FALLBACK_DETERMINISTIC',
        ai_engine: 'LOOCV_EMPIRICAL_ENGINE',
        is_ai_generated: false,
        ai_message: `GenAI execution skipped (${err.message}). Safe deterministic LOOCV empirical decision engine used.`
      };
    }
  }
}

module.exports = AiReasoningService;
