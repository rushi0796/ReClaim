const fs = require('fs');
const path = require('path');
const os = require('os');

const LOCAL_DATA_DIR = path.join(__dirname, '../../data');
const TMP_DATA_DIR = os.tmpdir();

class PersistentStorageService {
  /**
   * Helper to check if Upstash Redis or Vercel KV REST environment variables are available.
   */
  static getKvCredentials() {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      return { url, token };
    }
    return null;
  }

  /**
   * Reads JSON value from KV REST API or local file fallback.
   * @param {string} key 
   * @param {string} localFilename 
   * @param {*} defaultValue 
   * @returns {Promise<*>}
   */
  static async getJSON(key, localFilename, defaultValue = []) {
    const kv = this.getKvCredentials();

    if (kv) {
      try {
        const res = await fetch(`${kv.url}/get/${key}`, {
          headers: { Authorization: `Bearer ${kv.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.result) {
            return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          }
        }
      } catch (err) {
        console.warn(`[Storage] KV REST read error for key '${key}':`, err.message);
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
   * Writes JSON value to KV REST API and local/tmp file fallback.
   * @param {string} key 
   * @param {string} localFilename 
   * @param {*} value 
   * @returns {Promise<boolean>}
   */
  static async setJSON(key, localFilename, value) {
    const kv = this.getKvCredentials();
    const jsonStr = JSON.stringify(value, null, 2);

    if (kv) {
      try {
        await fetch(`${kv.url}/set/${key}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${kv.token}`,
            'Content-Type': 'application/json'
          },
          body: jsonStr
        });
      } catch (err) {
        console.warn(`[Storage] KV REST write error for key '${key}':`, err.message);
      }
    }

    // Write to local file & /tmp fallback
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
