const fs = require('fs');
const path = require('path');

const IDEMPOTENCY_FILE = path.join(__dirname, '../../data/processed_events.json');

// In-memory cache fallback for serverless environments
const inMemoryProcessedEvents = new Map();

/**
 * Checks if a webhook or payment event ID has already been processed.
 * @param {string} eventId 
 * @returns {boolean}
 */
function isEventProcessed(eventId) {
  if (!eventId) return false;
  if (inMemoryProcessedEvents.has(eventId)) return true;
  try {
    if (fs.existsSync(IDEMPOTENCY_FILE)) {
      const content = fs.readFileSync(IDEMPOTENCY_FILE, 'utf8');
      if (content.trim()) {
        const processedMap = JSON.parse(content);
        if (processedMap[eventId]) {
          inMemoryProcessedEvents.set(eventId, processedMap[eventId]);
          return true;
        }
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
  const eventRecord = {
    processed_at: new Date().toISOString(),
    ...metadata
  };
  inMemoryProcessedEvents.set(eventId, eventRecord);
  try {
    let processedMap = {};
    if (fs.existsSync(IDEMPOTENCY_FILE)) {
      const content = fs.readFileSync(IDEMPOTENCY_FILE, 'utf8');
      if (content.trim()) {
        processedMap = JSON.parse(content);
      }
    }

    processedMap[eventId] = eventRecord;
    fs.writeFileSync(IDEMPOTENCY_FILE, JSON.stringify(processedMap, null, 2), 'utf8');
  } catch (error) {
    // In serverless read-only environment, inMemoryProcessedEvents handles runtime idempotency
  }
}

module.exports = {
  isEventProcessed,
  markEventProcessed
};
