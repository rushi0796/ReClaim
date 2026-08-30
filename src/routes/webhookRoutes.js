const express = require('express');
const router = express.Router();
const RecoveryService = require('../services/recoveryService');
const RazorpayService = require('../services/razorpayService');

/**
 * POST /api/webhooks/razorpay
 * Endpoint to receive Razorpay Test Mode webhook events (e.g. payment.failed).
 */
router.post('/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Verify signature if secret and header signature are present
  if (webhookSecret && signature) {
    const rawBody = JSON.stringify(req.body);
    const isValid = RazorpayService.verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.warn('Webhook signature verification failed for incoming request.');
      return res.status(400).json({
        error: 'Invalid webhook signature.'
      });
    }
  }

  try {
    const result = await RecoveryService.processWebhookEvent(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      error: 'Failed to process Razorpay webhook event.',
      details: error.message
    });
  }
});

module.exports = router;
