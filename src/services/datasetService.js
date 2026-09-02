const fs = require('fs');
const path = require('path');
const PersistentStorageService = require('./persistentStorageService');

const HISTORICAL_DATA_FILE = path.join(__dirname, '../../data/payments.json');

// In-memory cache fallback for live webhook payments
const inMemoryLivePayments = new Map();

/**
 * Service to load historical dataset and persist live Razorpay Test Mode failed payments.
 */
class DatasetService {
  /**
   * Loads all historical synthetic payment outcome records (used for LOOCV validation mathematics).
   * @returns {Array<Object>} List of historical payment outcome objects
   */
  static getHistoricalPayments() {
    try {
      if (fs.existsSync(HISTORICAL_DATA_FILE)) {
        const content = fs.readFileSync(HISTORICAL_DATA_FILE, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Error loading payment dataset:', error.message);
    }
    return [];
  }

  /**
   * Loads all live Razorpay Test Mode failed payment records.
   * @returns {Array<Object>} List of live payment objects
   */
  static getLivePayments() {
    const list = Array.from(inMemoryLivePayments.values());
    try {
      const storedRecords = PersistentStorageService.getJSONSync('reclaim:live_payments', 'live_payments.json', []);
      if (Array.isArray(storedRecords)) {
        const fileMap = new Map();
        storedRecords.forEach(r => fileMap.set(r.payment_id, r));
        inMemoryLivePayments.forEach((r, id) => fileMap.set(id, r));
        return Array.from(fileMap.values());
      }
    } catch (error) {
      console.error('Error reading live payments:', error.message);
    }
    return list;
  }

  /**
   * Saves or updates a live Razorpay Test Mode failed payment record.
   * Idempotent based on payment_id.
   * @param {Object} paymentRecord 
   * @returns {Object} Saved payment record
   */
  static saveLivePayment(paymentRecord) {
    if (!paymentRecord || !paymentRecord.payment_id) return paymentRecord;

    const existingList = this.getLivePayments();
    const existingIndex = existingList.findIndex(p => p.payment_id === paymentRecord.payment_id);

    const fullRecord = {
      ...(existingIndex >= 0 ? existingList[existingIndex] : {}),
      ...paymentRecord,
      is_live_test_mode: true,
      is_real_razorpay: true,
      updated_at: new Date().toISOString()
    };

    if (!fullRecord.created_at) {
      fullRecord.created_at = new Date().toISOString();
    }

    inMemoryLivePayments.set(paymentRecord.payment_id, fullRecord);

    try {
      let updatedList = [];
      if (existingIndex >= 0) {
        updatedList = [...existingList];
        updatedList[existingIndex] = fullRecord;
      } else {
        updatedList = [fullRecord, ...existingList];
      }

      PersistentStorageService.setJSONSync('reclaim:live_payments', 'live_payments.json', updatedList);
    } catch (error) {
      // In-memory map serves as immediate runtime cache
    }

    return fullRecord;
  }

  /**
   * Returns combined list of payments: live Razorpay payments first, followed by historical synthetic records.
   * @returns {Array<Object>}
   */
  static getAllPayments() {
    const live = this.getLivePayments();
    const historical = this.getHistoricalPayments();
    return [...live, ...historical];
  }

  /**
   * Filters payment records by failure reason and optional customer history.
   * @param {string} failureReason 
   * @param {string} [customerHistory] 
   * @returns {Array<Object>}
   */
  static filterOutcomes(failureReason, customerHistory) {
    const dataset = this.getHistoricalPayments();
    return dataset.filter(item => {
      const matchReason = item.failure_reason === failureReason;
      if (!customerHistory) return matchReason;
      return matchReason && item.customer_history === customerHistory;
    });
  }
}

module.exports = DatasetService;
