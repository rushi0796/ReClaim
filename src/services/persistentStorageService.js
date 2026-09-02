const fs = require('fs');
const path = require('path');
const os = require('os');
const { getRedisClient } = require('../utils/redisClient');

const LOCAL_DATA_DIR = path.join(__dirname, '../../data');
const TMP_DATA_DIR = os.tmpdir();

class PersistentStorageService {
  /**
   * Helper to check if Upstash Redis credentials are configured.
   */
  static getKvCredentials() {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (url && token && !url.includes('your_') && !token.includes('your_')) {
      return { url, token };
    }
    return null;
  }

  /**
   * Checks if Upstash Redis cloud storage is active and initialized.
   * @returns {boolean}
   */
  static isCloudStorageActive() {
    return Boolean(this.getKvCredentials() && getRedisClient());
  }

  /**
   * Reads JSON value from Upstash Redis or local/tmp file fallback.
   * @param {string} key 
   * @param {string} localFilename 
   * @param {*} defaultValue 
   * @returns {Promise<*>}
   */
  static async getJSON(key, localFilename, defaultValue = []) {
    const redis = getRedisClient();

    if (redis) {
      try {
        console.log(`[Storage] storage_provider = upstash_redis (reading key: ${key})`);
        const result = await redis.get(key);
        if (result !== null && result !== undefined) {
          return typeof result === 'string' ? JSON.parse(result) : result;
        }
      } catch (err) {
        console.warn(`[Storage] Upstash Redis read error for key '${key}':`, err.message);
      }
    }

    // File Fallback (/tmp on serverless or local data dir)
    const pathsToTry = [
      path.join(LOCAL_DATA_DIR, localFilename),
      path.join(TMP_DATA_DIR, `reclaim_${localFilename}`)
    ];

    for (const filePath of pathsToTry) {
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.trim()) {
            return JSON.parse(content);
          }
        }
      } catch (e) {
        // Try next fallback path
      }
    }

    return defaultValue;
  }

  /**
   * Synchronous getJSON for local/fallback execution.
   */
  static getJSONSync(key, localFilename, defaultValue = []) {
    const pathsToTry = [
      path.join(LOCAL_DATA_DIR, localFilename),
      path.join(TMP_DATA_DIR, `reclaim_${localFilename}`)
    ];

    for (const filePath of pathsToTry) {
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.trim()) {
            return JSON.parse(content);
          }
        }
      } catch (e) {
        // Try next fallback path
      }
    }

    return defaultValue;
  }

  /**
   * Writes JSON value to Upstash Redis and local/tmp file fallback.
   * @param {string} key 
   * @param {string} localFilename 
   * @param {*} value 
   * @returns {Promise<boolean>}
   */
  static async setJSON(key, localFilename, value) {
    const redis = getRedisClient();

    if (redis) {
      try {
        console.log(`[Storage] storage_provider = upstash_redis (writing key: ${key})`);
        await redis.set(key, value);
      } catch (err) {
        console.warn(`[Storage] Upstash Redis write error for key '${key}':`, err.message);
      }
    }

    // Write to local file & /tmp fallback
    const jsonStr = JSON.stringify(value, null, 2);
    const targets = [
      path.join(LOCAL_DATA_DIR, localFilename),
      path.join(TMP_DATA_DIR, `reclaim_${localFilename}`)
    ];

    for (const targetPath of targets) {
      try {
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(targetPath, jsonStr, 'utf8');
      } catch (e) {
        // Fail silently if directory is read-only
      }
    }

    return true;
  }

  /**
   * Synchronous setJSON for local/fallback execution.
   */
  static setJSONSync(key, localFilename, value) {
    const jsonStr = JSON.stringify(value, null, 2);
    const targets = [
      path.join(LOCAL_DATA_DIR, localFilename),
      path.join(TMP_DATA_DIR, `reclaim_${localFilename}`)
    ];

    for (const targetPath of targets) {
      try {
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(targetPath, jsonStr, 'utf8');
      } catch (e) {
        // Ignore read-only errors
      }
    }
  }
}

module.exports = PersistentStorageService;
