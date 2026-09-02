const express = require('express');
const router = express.Router();
const RecoveryService = require('../services/recoveryService');
const DatasetService = require('../services/datasetService');
const PersistentStorageService = require('../services/persistentStorageService');
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
 * GET /api/recovery/diagnostics
 * Non-sensitive production system metadata for storage and integration status.
 */
router.get('/diagnostics', async (req, res) => {
  try {
    const isCloudActive = PersistentStorageService.isCloudStorageActive();
    const livePayments = await DatasetService.getLivePaymentsAsync();
    const logs = await getAuditLogs();

    return res.json({
      environment: process.env.NODE_ENV || 'production',
      storage_provider: isCloudActive ? 'upstash_redis' : 'local_tmp_fallback',
      cloud_storage_configured: isCloudActive,
      razorpay_credentials_configured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      webhook_secret_configured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
      gemini_configured: Boolean(process.env.GEMINI_API_KEY),
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
