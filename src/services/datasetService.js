const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/payments.json');

/**
 * Service to load and query historical payment outcome records.
 */
class DatasetService {
  /**
   * Loads all historical payment outcome records.
   * @returns {Array<Object>} List of historical payment outcome objects
   */
  static getHistoricalPayments() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Error loading payment dataset:', error.message);
    }
    return [];
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
