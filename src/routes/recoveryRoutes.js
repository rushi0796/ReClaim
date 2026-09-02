const express = require('express');
const router = express.Router();
const RecoveryService = require('../services/recoveryService');
const DatasetService = require('../services/datasetService');
const PersistentStorageService = require('../services/persistentStorageService');
const RazorpayService = require('../services/razorpayService');
const { getAuditLogs } = require('../utils/auditLogger');

/**
 * GET /api/recovery/audit
 * Returns persistent audit log history.
 */
router.get('/audit', async (req, res) => {
  try {
    const logs = await getAuditLogs();
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

/**
 * GET /api/recovery/env-check
 * SAFE diagnostic endpoint reporting ONLY boolean presence and state flags.
 * NEVER returns secret values, partial values, or string lengths.
 */
router.get('/env-check', (req, res) => {
  const checkKey = (keyName) => {
    const val = process.env[keyName];
    return {
      is_defined: val !== undefined && val !== null,
      is_non_empty: Boolean(val && typeof val === 'string' && val.trim().length > 0),
      is_placeholder: Boolean(val && typeof val === 'string' && (val.includes('your_') || val.includes('dummy'))),
      is_valid_prefix: Boolean(val && typeof val === 'string' && val.trim().startsWith('rzp_'))
    };
  };

  return res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'production',
    razorpay_key_id: checkKey('RAZORPAY_KEY_ID'),
    razorpay_key_secret: checkKey('RAZORPAY_KEY_SECRET'),
    razorpay_webhook_secret: checkKey('RAZORPAY_WEBHOOK_SECRET'),
    upstash_url: checkKey('UPSTASH_REDIS_REST_URL'),
    upstash_token: checkKey('UPSTASH_REDIS_REST_TOKEN'),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/recovery/diagnostics
 * Safe production system metadata reporting boolean environment variable presence.
 */
router.get('/diagnostics', async (req, res) => {
  try {
    const isCloudActive = PersistentStorageService.isCloudStorageActive();
    const livePayments = await DatasetService.getLivePaymentsAsync();
    const logs = await getAuditLogs();

    const keyId = RazorpayService.getKeyId();
    const keySecret = RazorpayService.getKeySecret();
    const webhookSecret = RazorpayService.getWebhookSecret();
    const redisCreds = PersistentStorageService.getKvCredentials();

    const hasRazorpayKeyId = Boolean(keyId);
    const hasRazorpayKeySecret = Boolean(keySecret);
    const hasRazorpayWebhookSecret = Boolean(webhookSecret);
    const hasUpstashUrl = Boolean(redisCreds && redisCreds.url);
    const hasUpstashToken = Boolean(redisCreds && redisCreds.token);

    return res.json({
      environment: process.env.NODE_ENV || 'production',
      storage_provider: isCloudActive ? 'upstash_redis' : 'local_tmp_fallback',
      cloud_storage_configured: isCloudActive,
      razorpay_credentials_configured: Boolean(hasRazorpayKeyId && hasRazorpayKeySecret),
      webhook_secret_configured: hasRazorpayWebhookSecret,
      gemini_configured: Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_')),
      has_razorpay_key_id: hasRazorpayKeyId,
      has_razorpay_key_secret: hasRazorpayKeySecret,
      has_razorpay_webhook_secret: hasRazorpayWebhookSecret,
      has_upstash_url: hasUpstashUrl,
      has_upstash_token: hasUpstashToken,
      persisted_live_payments_count: livePayments.length,
      audit_logs_count: logs.length,
      last_audit_event: logs[0] ? { timestamp: logs[0].timestamp, event_type: logs[0].event_type, payment_id: logs[0].payment_id } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: 'Diagnostics fetch error', details: error.message });
  }
});

/**
 * POST /api/recovery/sync
 * Securely synchronizes failed Test Mode payments directly from Razorpay API.
 */
router.post('/sync', async (req, res) => {
  try {
    const syncResult = await RecoveryService.syncRazorpayFailedPayments();
    return res.json(syncResult);
  } catch (error) {
    console.error('Error synchronizing Razorpay payments:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to synchronize Razorpay failed payments',
      details: error.message
    });
  }
});

/**
 * POST /api/recovery/analyze
 * Main recovery decision engine endpoint analyzing failed payment context.
 */
router.post('/analyze', async (req, res) => {
  const { payment_id, amount, failure_reason } = req.body;

  if (!payment_id || amount === undefined || amount === null || !failure_reason) {
    return res.status(400).json({
      error: 'Invalid input. Required fields: payment_id, amount, and failure_reason.'
    });
  }

  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      error: 'Invalid input. Field "amount" must be a positive number.'
    });
  }

  try {
    const analysisResult = await RecoveryService.analyzeRecovery(req.body);
    return res.json(analysisResult);
  } catch (error) {
    console.error('Error executing recovery analysis:', error);
    return res.status(500).json({
      error: 'Internal server error during recovery analysis.',
      details: error.message
    });
  }
});

/**
 * POST /api/recovery/validate
 * Counterfactual validation endpoint (Leave-One-Out Cross-Validation).
 */
router.post('/validate', (req, res) => {
  try {
    const validationResult = RecoveryService.validateEngine();
    return res.json(validationResult);
  } catch (error) {
    console.error('Error executing counterfactual validation:', error);
    return res.status(500).json({
      error: 'Internal server error during counterfactual validation.',
      details: error.message
    });
  }
});

/**
 * GET & POST /api/recovery/batch-analyze
 * Batch analysis endpoint processing live Razorpay payments and historical data.
 */
const handleBatchAnalyze = async (req, res) => {
  try {
    const batchResult = await RecoveryService.analyzeBatchRecovery();
    return res.json(batchResult);
  } catch (error) {
    console.error('Error executing batch recovery analysis:', error);
    return res.status(500).json({
      error: 'Internal server error during batch recovery analysis.',
      details: error.message
    });
  }
};

router.get('/batch-analyze', handleBatchAnalyze);
router.post('/batch-analyze', handleBatchAnalyze);

/**
 * POST /api/recovery/batch-validate
 * Out-of-sample LOOCV batch backtesting endpoint.
 */
router.post('/batch-validate', (req, res) => {
  try {
    const batchValidationResult = RecoveryService.validateBatchRecovery();
    return res.json(batchValidationResult);
  } catch (error) {
    console.error('Error executing batch validation:', error);
    return res.status(500).json({
      error: 'Internal server error during batch validation.',
      details: error.message
    });
  }
});

/**
 * POST /api/recovery/decide
 * Preserved endpoint for basic recovery decisions.
 */
router.post('/decide', (req, res) => {
  const { payment_id, amount, failure_reason } = req.body;

  if (!payment_id || !amount || !failure_reason) {
    return res.status(400).json({
      error: 'payment_id, amount and failure_reason are required'
    });
  }

  try {
    const result = RecoveryService.makeDecision(req.body);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error during decision generation.'
    });
  }
});

module.exports = router;
