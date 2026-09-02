const crypto = require('crypto');
const Razorpay = require('razorpay');

class RazorpayService {
  /**
   * Helper to retrieve Razorpay Key ID from environment with alias fallbacks.
   * @returns {string|null}
   */
  static getKeyId() {
    const raw = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY || process.env.RAZORPAY_ID || '';
    const trimmed = raw.trim();
    return (trimmed && !trimmed.includes('your_') && !trimmed.includes('dummy')) ? trimmed : null;
  }

  /**
   * Helper to retrieve Razorpay Key Secret from environment with alias fallbacks.
   * @returns {string|null}
   */
  static getKeySecret() {
    const raw = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || '';
    const trimmed = raw.trim();
    return (trimmed && !trimmed.includes('your_') && !trimmed.includes('dummy')) ? trimmed : null;
  }

  /**
   * Helper to retrieve Razorpay Webhook Secret from environment with alias fallbacks.
   * @returns {string|null}
   */
  static getWebhookSecret() {
    const raw = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK || process.env.WEBHOOK_SECRET || '';
    const trimmed = raw.trim();
    return (trimmed && !trimmed.includes('your_') && !trimmed.includes('dummy')) ? trimmed : null;
  }

  /**
   * Initializes Razorpay SDK instance if keys are available in environment.
   */
  static getClient() {
    const keyId = this.getKeyId();
    const keySecret = this.getKeySecret();

    if (keyId && keySecret) {
      try {
        return new Razorpay({
          key_id: keyId,
          key_secret: keySecret
        });
      } catch (err) {
        console.warn('Razorpay SDK initialization warning:', err.message);
      }
    }
    return null;
  }

  /**
   * Fetches failed Test Mode payments directly from Razorpay API.
   * @param {Object} [options={ count: 20 }] 
   * @returns {Promise<Array<Object>>}
   */
  static async fetchFailedPayments({ count = 20 } = {}) {
    const client = this.getClient();
    if (client) {
      try {
        const response = await client.payments.all({
          count: count,
          status: 'failed'
        });
        return response.items || response || [];
      } catch (error) {
        console.warn('Razorpay SDK fetch failed payments warning:', error.message);
        throw error;
      }
    }
    return [];
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
            contact: customer?.contact || '+919999999999'
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
          execution_mode: 'RAZORPAY_TEST_MODE_SDK',
          payment_url: link.short_url
        };
      } catch (error) {
        console.warn('Razorpay SDK Payment Link creation warning (falling back to simulated test link):', error.message);
      }
    }

    // Simulation Adapter Fallback for Test Mode
    const simulatedId = `plink_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const shortUrl = `https://rzp.io/i/test_link_${simulatedId}`;
    return {
      link_id: simulatedId,
      short_url: shortUrl,
      payment_url: shortUrl,
      status: 'created',
      amount_in_inr: amount,
      description: description || 'RECLAIM Recovery Link [SIMULATED TEST MODE]',
      is_simulated: true,
      execution_mode: 'RAZORPAY_TEST_MODE_SIMULATED'
    };
  }

  /**
   * Verifies Razorpay Webhook Signature using HMAC SHA256.
   * Accepts either raw Buffer, stringified JSON, or parsed object body.
   * @param {string|Buffer} body 
   * @param {string} signature - Header x-razorpay-signature
   * @param {string} [secret] - Webhook secret from environment
   * @returns {boolean}
   */
  static verifyWebhookSignature(body, signature, secret) {
    const effectiveSecret = secret || this.getWebhookSecret();
    if (!signature || !effectiveSecret) return false;
    try {
      const payloadString = Buffer.isBuffer(body)
        ? body.toString('utf8')
        : (typeof body === 'string' ? body : JSON.stringify(body));

      const expectedSignature = crypto
        .createHmac('sha256', effectiveSecret)
        .update(payloadString)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignature);
      const sigBuf = Buffer.from(signature);

      if (expectedBuf.length !== sigBuf.length) {
        return false;
      }
      return crypto.timingSafeEqual(expectedBuf, sigBuf);
    } catch (error) {
      console.error('Webhook signature verification error:', error.message);
      return false;
    }
  }
}

module.exports = RazorpayService;
