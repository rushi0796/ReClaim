const crypto = require('crypto');
const Razorpay = require('razorpay');

class RazorpayService {
  /**
   * Initializes Razorpay SDK instance if keys are available in environment.
   */
  static getClient() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret && !keyId.includes('dummy')) {
      return new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
    }
    return null;
  }

  /**
   * Creates a Razorpay Payment Link in Test Mode, falling back to a simulation adapter if using test dummy keys.
   * @param {Object} options 
   * @returns {Promise<Object>} Created Payment Link details
   */
  static async createPaymentLink({ amount, currency = 'INR', description, customer }) {
    const client = this.getClient();
    const amountInPaise = Math.round(amount * 100);

    if (client) {
      try {
        const link = await client.paymentLink.create({
          amount: amountInPaise,
          currency: currency,
          accept_partial: false,
          description: description || 'RECLAIM Automated Payment Recovery Link [TEST MODE]',
          customer: {
            name: customer?.name || 'Valued Customer',
            email: customer?.email || 'customer@example.com',
            contact: customer?.contact || '+919876543210'
          },
          notify: {
            sms: true,
            email: true
          },
          reminder_enable: true,
          notes: {
            source: 'RECLAIM_AI_RECOVERY_AGENT',
            environment: 'RAZORPAY_TEST_MODE'
          }
        });

        return {
          link_id: link.id,
          short_url: link.short_url,
          status: link.status,
          is_simulated: false,
          execution_mode: 'RAZORPAY_TEST_MODE_SDK'
        };
      } catch (error) {
        console.warn('Razorpay SDK Payment Link creation warning (falling back to simulated test link):', error.message);
      }
    }

    // Simulation Adapter Fallback for Test Mode
    const simulatedId = `plink_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return {
      link_id: simulatedId,
      short_url: `https://rzp.io/i/test_link_${simulatedId}`,
      status: 'created',
      amount_in_inr: amount,
      description: description || 'RECLAIM Recovery Link [SIMULATED TEST MODE]',
      is_simulated: true,
      execution_mode: 'RAZORPAY_TEST_MODE_SIMULATED'
    };
  }

  /**
   * Verifies Razorpay Webhook Signature using HMAC SHA256.
   * @param {string} bodyString - Raw JSON body string
   * @param {string} signature - Header x-razorpay-signature
   * @param {string} secret - Webhook secret from environment
   * @returns {boolean}
   */
  static verifyWebhookSignature(bodyString, signature, secret) {
    if (!signature || !secret) return false;
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(bodyString)
        .digest('hex');
      return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
    } catch (error) {
      console.error('Webhook signature verification failed:', error.message);
      return false;
    }
  }
}

module.exports = RazorpayService;
