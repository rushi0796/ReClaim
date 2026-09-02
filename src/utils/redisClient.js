const { Redis } = require('@upstash/redis');
require('dotenv').config();

let redisInstance = null;

/**
 * Initializes and returns a reusable server-side Upstash Redis client.
 * Uses environment variables UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN.
 * @returns {Redis|null}
 */
function getRedisClient() {
  if (redisInstance) return redisInstance;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && token && !url.includes('your_') && !token.includes('your_')) {
    try {
      redisInstance = new Redis({
        url: url.trim(),
        token: token.trim()
      });
      return redisInstance;
    } catch (err) {
      console.warn('[Redis] Initialization error:', err.message);
    }
  }

  return null;
}

/**
 * Executes a simple SET and GET test operation against Upstash Redis database.
 * @returns {Promise<Object>} Test result summary
 */
async function testRedisConnection() {
  const redis = getRedisClient();

  if (!redis) {
    return {
      status: 'error',
      success: false,
      message: 'Redis client not initialized. UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are missing or unconfigured.'
    };
  }

  const testKey = 'reclaim-db:connection-test';
  const testValue = `test-success-${Date.now()}`;

  try {
    // 1. Execute SET
    await redis.set(testKey, testValue);

    // 2. Execute GET
    const retrievedValue = await redis.get(testKey);

    const isMatch = retrievedValue === testValue;

    return {
      status: isMatch ? 'ok' : 'mismatch',
      success: isMatch,
      key: testKey,
      set_value: testValue,
      get_value: retrievedValue,
      message: isMatch ? 'Upstash Redis SET and GET test succeeded!' : 'Retrieved value did not match set value.'
    };
  } catch (error) {
    console.error('[Redis] SET/GET test error:', error.message);
    return {
      status: 'error',
      success: false,
      error: error.message,
      message: `Upstash Redis connection error: ${error.message}`
    };
  }
}

module.exports = {
  getRedisClient,
  testRedisConnection
};
