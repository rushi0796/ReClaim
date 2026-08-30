const fs = require('fs');
const path = require('path');

const IDEMPOTENCY_FILE = path.join(__dirname, '../../data/processed_events.json');

/**
 * Checks if a webhook or payment event ID has already been processed.
 * @param {string} eventId 
 * @returns {boolean}
 */
function isEventProcessed(eventId) {
  if (!eventId) return false;
  try {
    if (fs.existsSync(IDEMPOTENCY_FILE)) {
      const content = fs.readFileSync(IDEMPOTENCY_FILE, 'utf8');
      if (content.trim()) {
        const processedMap = JSON.parse(content);
        return Boolean(processedMap[eventId]);
      }
    }
  } catch (error) {
    console.error('Error checking idempotency:', error.message);
  }
  return false;
}

/**
 * Records an event ID as processed to prevent duplicate recovery executions.
 * @param {string} eventId 
 * @param {Object} [metadata={}] 
 */
function markEventProcessed(eventId, metadata = {}) {
  if (!eventId) return;
  try {
    let processedMap = {};
    if (fs.existsSync(IDEMPOTENCY_FILE)) {
      const content = fs.readFileSync(IDEMPOTENCY_FILE, 'utf8');
      if (content.trim()) {
        processedMap = JSON.parse(content);
      }
    }

    processedMap[eventId] = {
      processed_at: new Date().toISOString(),
      ...metadata
    };

    fs.writeFileSync(IDEMPOTENCY_FILE, JSON.stringify(processedMap, null, 2), 'utf8');
  } catch (error) {
    console.error('Error recording processed event idempotency:', error.message);
  }
}

module.exports = {
  isEventProcessed,
  markEventProcessed
};
