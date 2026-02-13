import { openDB } from 'idb';

const TEST_DB_NAME = 'voice-journal-test';
const TEST_DB_VERSION = 1;
const TEST_STORE = 'test-store';

/**
 * Run comprehensive storage self-test
 * Tests: DB open, write, read, delete operations
 * @returns {Promise<{ok: boolean, errors: string[], operations: object}>}
 */
export async function runStorageSelfTest() {
  const result = {
    ok: true,
    errors: [],
    operations: {
      dbOpen: false,
      write: false,
      read: false,
      delete: false,
      cleanup: false,
    },
  };

  let db = null;
  const testId = `test-${Date.now()}`;
  const testRecord = {
    id: testId,
    timestamp: Date.now(),
    data: 'test-data',
  };

  try {
    db = await openDB(TEST_DB_NAME, TEST_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(TEST_STORE)) {
          db.createObjectStore(TEST_STORE, { keyPath: 'id' });
        }
      },
    });
    result.operations.dbOpen = true;
  } catch (err) {
    result.ok = false;
    result.errors.push(`DB Open failed: ${err.message}`);
    return result;
  }

  try {
    await db.put(TEST_STORE, testRecord);
    result.operations.write = true;
  } catch (err) {
    result.ok = false;
    result.errors.push(`Write failed: ${err.message}`);
  }

  try {
    const retrieved = await db.get(TEST_STORE, testId);
    if (!retrieved) {
      result.ok = false;
      result.errors.push('Read failed: Record not found');
    } else if (retrieved.data !== testRecord.data) {
      result.ok = false;
      result.errors.push('Read failed: Data mismatch');
    } else {
      result.operations.read = true;
    }
  } catch (err) {
    result.ok = false;
    result.errors.push(`Read failed: ${err.message}`);
  }

  try {
    await db.delete(TEST_STORE, testId);
    const verifyDeleted = await db.get(TEST_STORE, testId);
    if (verifyDeleted) {
      result.ok = false;
      result.errors.push('Delete failed: Record still exists');
    } else {
      result.operations.delete = true;
    }
  } catch (err) {
    result.ok = false;
    result.errors.push(`Delete failed: ${err.message}`);
  }

  try {
    db.close();
    await deleteDatabase(TEST_DB_NAME);
    result.operations.cleanup = true;
  } catch (err) {
    result.errors.push(`Cleanup warning: ${err.message}`);
  }

  return result;
}

/**
 * Delete a database completely
 */
async function deleteDatabase(dbName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Database deletion blocked'));
  });
}

/**
 * Test production database accessibility
 * @returns {Promise<{ok: boolean, error: string|null}>}
 */
export async function testProductionDB() {
  try {
    const db = await openDB('voice-journal', 2);
    const count = await db.count('snippets');
    db.close();
    return { ok: true, error: null, recordCount: count };
  } catch (err) {
    return { ok: false, error: err.message, recordCount: 0 };
  }
}
