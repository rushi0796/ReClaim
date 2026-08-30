const express = require('express');
const router = express.Router();
const RecoveryService = require('../services/recoveryService');
const { getAuditLogs } = require('../utils/auditLogger');

/**
 * GET /api/recovery/audit
 * Returns persistent audit log history.
 */
router.get('/audit', (req, res) => {
  try {
    const logs = getAuditLogs();
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

/**
 * POST /api/recovery/analyze
 * Main recovery decision engine endpoint analyzing failed payment context.
 */
router.post('/analyze', (req, res) => {
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
    const analysisResult = RecoveryService.analyzeRecovery(req.body);
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
 * POST /api/recovery/batch-analyze
 * Batch analysis endpoint processing all historical payment failures.
 */
router.post('/batch-analyze', (req, res) => {
  try {
    const batchResult = RecoveryService.analyzeBatchRecovery();
    return res.json(batchResult);
  } catch (error) {
    console.error('Error executing batch recovery analysis:', error);
    return res.status(500).json({
      error: 'Internal server error during batch recovery analysis.',
      details: error.message
    });
  }
});

/**
 * POST /api/recovery/batch-validate
 * Out-of-sample LOOCV batch backtesting endpoint preventing selection bias.
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
