const RazorpayService = require('./razorpayService');

class RecoveryActionExecutor {
  /**
   * Executes the chosen recovery intervention using Razorpay Test Mode / Simulation Adapters.
   * Decides HOW an action is executed based on the decision engine's output.
   * @param {string} action - The selected intervention ('immediate_retry', 'retry_later', 'reminder', 'payment_method_update')
   * @param {Object} context - Failed payment context details
   * @returns {Promise<Object>} Execution result object with status, mode, and details
   */
  static async execute(action, context) {
    const timestamp = new Date().toISOString();
    const paymentId = context.payment_id;
    const amount = context.amount;

    switch (action) {
      case 'immediate_retry':
        return {
          action: 'immediate_retry',
          status: 'executed',
          execution_mode: 'RAZORPAY_TEST_MODE_SIMULATED',
          is_simulated: true,
          timestamp,
          details: {
            payment_id: paymentId,
            message: 'Immediate retry attempt dispatched to Razorpay Test Gateway API [TEST MODE - SIMULATED].',
            retry_attempt: 1
          }
        };

      case 'retry_later':
        const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        return {
          action: 'retry_later',
          status: 'scheduled',
          execution_mode: 'RAZORPAY_TEST_MODE_SCHEDULED',
          is_simulated: true,
          timestamp,
          details: {
            payment_id: paymentId,
            scheduled_for: scheduledTime,
            message: `Delayed retry scheduled for ${scheduledTime} [TEST MODE - SCHEDULED].`
          }
        };

      case 'reminder':
        const paymentLinkResult = await RazorpayService.createPaymentLink({
          amount: amount,
          currency: context.currency || 'INR',
          description: `RECLAIM Payment Recovery Reminder for Payment #${paymentId}`,
          customer: context.customer || null
        });

        return {
          action: 'reminder',
          status: 'executed',
          execution_mode: paymentLinkResult.execution_mode,
          is_simulated: paymentLinkResult.is_simulated,
          timestamp,
          details: {
            payment_id: paymentId,
            payment_link_id: paymentLinkResult.link_id,
            payment_url: paymentLinkResult.short_url,
            message: `Razorpay Test Mode Payment Link generated and reminder dispatched [${paymentLinkResult.is_simulated ? 'SIMULATED' : 'TEST MODE'}].`
          }
        };

      case 'payment_method_update':
        const updateLinkId = `update_link_test_${Date.now()}`;
        return {
          action: 'payment_method_update',
          status: 'executed',
          execution_mode: 'RAZORPAY_TEST_MODE_SIMULATED',
          is_simulated: true,
          timestamp,
          details: {
            payment_id: paymentId,
            update_link_id: updateLinkId,
            update_url: `https://rzp.io/i/update_method_${updateLinkId}`,
            message: 'Payment method update request generated for customer [TEST MODE - SIMULATED].'
          }
        };

      default:
        return {
          action: action || 'unknown',
          status: 'failed',
          execution_mode: 'NONE',
          is_simulated: true,
          timestamp,
          details: {
            message: `Unknown recovery intervention action: ${action}`
          }
        };
    }
  }
}

module.exports = RecoveryActionExecutor;
