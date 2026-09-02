const PersistentStorageService = require('../services/persistentStorageService');

// In-memory cache fallback for serverless environments
const inMemoryProcessedEvents = new Map();

/**
 * Checks if a webhook or payment event ID has already been processed.
 * @param {string} eventId 
 * @returns {Promise<boolean>}
 */
async function isEventProcessed(eventId) {
  if (!eventId) return false;
  if (inMemoryProcessedEvents.has(eventId)) return true;
  try {
    const processedMap = await PersistentStorageService.getJSON('reclaim:processed_events', 'processed_events.json', {});
    if (processedMap && typeof processedMap === 'object' && processedMap[eventId]) {
      inMemoryProcessedEvents.set(eventId, processedMap[eventId]);
      return true;
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
async function markEventProcessed(eventId, metadata = {}) {
  if (!eventId) return;
  const eventRecord = {
    processed_at: new Date().toISOString(),
    ...metadata
  };
  inMemoryProcessedEvents.set(eventId, eventRecord);
  try {
    const processedMap = await PersistentStorageService.getJSON('reclaim:processed_events', 'processed_events.json', {});
    const updatedMap = (processedMap && typeof processedMap === 'object') ? { ...processedMap } : {};
    updatedMap[eventId] = eventRecord;
    await PersistentStorageService.setJSON('reclaim:processed_events', 'processed_events.json', updatedMap);
  } catch (error) {
    // In-memory map handles runtime deduplication
  }
}

module.exports = {
  isEventProcessed,
  markEventProcessed
};
