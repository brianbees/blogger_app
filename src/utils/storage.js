import { openDB } from 'idb';

const DB_NAME = 'voice-journal';
const DB_VERSION = 3;
const SNIPPETS_STORE = 'snippets';
const DATA_VERSION = 1;

class StorageError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Initialize and get the IndexedDB database
 */
async function getDB() {
  try {
    return await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
          const store = db.createObjectStore(SNIPPETS_STORE, { keyPath: 'id' });
          store.createIndex('dayKey', 'dayKey', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        if (oldVersion < 2) {
          const store = transaction.objectStore(SNIPPETS_STORE);
          if (!store.indexNames.contains('dataVersion')) {
            store.createIndex('dataVersion', 'dataVersion', { unique: false });
          }
        }
        
        if (oldVersion < 3) {
          const store = transaction.objectStore(SNIPPETS_STORE);
          // Add timestamp index for image snippets
          if (!store.indexNames.contains('timestamp')) {
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
          // Add type index for filtering by snippet type
          if (!store.indexNames.contains('type')) {
            store.createIndex('type', 'type', { unique: false });
          }
        }
      },
    });
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      throw new StorageError(
        'Storage quota exceeded. Please free up space or export your data.',
        'QUOTA_EXCEEDED',
        err
      );
    }
    throw new StorageError(
      'Failed to open database. Please check browser settings.',
      'DB_OPEN_FAILED',
      err
    );
  }
}

/**
 * Check if storage quota is available
 */
export async function checkStorageQuota() {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const percentUsed = (estimate.usage / estimate.quota) * 100;
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percentUsed,
        available: estimate.quota - estimate.usage,
        isLow: percentUsed > 90,
      };
    } catch (err) {
      return null;
    }
  }
  return null;
}

/**
 * Save a snippet to IndexedDB
 * Supports both audio and image snippets
 * Ensures audioBlob or mediaBlob is stored as a Blob object
 */
export async function saveSnippet(snippet) {
  try {
    const db = await getDB();
    
    // Validate that at least one blob is present
    // Snippets can now have both audio AND image (combined posts)
    const hasAudio = snippet.audioBlob && snippet.audioBlob instanceof Blob;
    const hasImage = snippet.mediaBlob && snippet.mediaBlob instanceof Blob;
    
    if (!hasAudio && !hasImage) {
      throw new StorageError('Snippet must have at least audioBlob or mediaBlob', 'INVALID_DATA');
    }
    
    // Validate blob types
    if (snippet.audioBlob && !(snippet.audioBlob instanceof Blob)) {
      throw new StorageError('audioBlob must be a Blob object', 'INVALID_DATA');
    }
    if (snippet.mediaBlob && !(snippet.mediaBlob instanceof Blob)) {
      throw new StorageError('mediaBlob must be a Blob object', 'INVALID_DATA');
    }
    
    const snippetWithVersion = {
      ...snippet,
      dataVersion: DATA_VERSION,
    };
    
    await db.put(SNIPPETS_STORE, snippetWithVersion);
  } catch (err) {
    console.error('Error in saveSnippet:', err);
    if (err instanceof StorageError) {
      throw err;
    }
    if (err.name === 'QuotaExceededError') {
      throw new StorageError(
        'Storage quota exceeded. Cannot save snippet.',
        'QUOTA_EXCEEDED',
        err
      );
    }
    const errorMessage = err.message || 'Unknown error';
    throw new StorageError(`Failed to save snippet: ${errorMessage}`, 'SAVE_FAILED', err);
  }
}

/**
 * Get all snippets from IndexedDB
 * Returns array sorted by createdAt (newest first)
 */
export async function getAllSnippets() {
  try {
    const db = await getDB();
    const snippets = await db.getAllFromIndex(SNIPPETS_STORE, 'createdAt');
    return snippets.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    if (err instanceof StorageError) {
      throw err;
    }
    throw new StorageError('Failed to load snippets', 'LOAD_FAILED', err);
  }
}

/**
 * Get snippets for a specific date
 * Returns array sorted by createdAt (newest first)
 */
export async function getSnippetsByDate(dayKey) {
  try {
    const db = await getDB();
    const snippets = await db.getAllFromIndex(SNIPPETS_STORE, 'dayKey', dayKey);
    return snippets.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    if (err instanceof StorageError) {
      throw err;
    }
    throw new StorageError('Failed to load snippets by date', 'LOAD_FAILED', err);
  }
}

/**
 * Delete a snippet by ID
 */
export async function deleteSnippet(id) {
  try {
    const db = await getDB();
    await db.delete(SNIPPETS_STORE, id);
  } catch (err) {
    if (err instanceof StorageError) {
      throw err;
    }
    throw new StorageError('Failed to delete snippet', 'DELETE_FAILED', err);
  }
}

/**
 * Export all data to JSON format
 * Converts Blobs to base64 for serialization
 * Handles both audio and image snippets
 */
export async function exportAllData() {
  try {
    const snippets = await getAllSnippets();
    const exportData = await Promise.all(
      snippets.map(async (snippet) => {
        if (snippet.type === 'image' && snippet.mediaBlob) {
          const mediaBase64 = await blobToBase64(snippet.mediaBlob);
          return {
            ...snippet,
            mediaBlob: mediaBase64,
            // Use stored mimeType property or fallback to blob type
            mediaBlobType: snippet.mimeType || snippet.mediaBlob.type || 'image/jpeg',
          };
        } else if (snippet.audioBlob) {
          const audioBase64 = await blobToBase64(snippet.audioBlob);
          return {
            ...snippet,
            audioBlob: audioBase64,
            audioBlobType: snippet.audioBlob.type || 'audio/webm',
          };
        }
        return snippet;
      })
    );
    
    return {
      version: DATA_VERSION,
      exportedAt: new Date().toISOString(),
      snippetsCount: exportData.length,
      snippets: exportData,
    };
  } catch (err) {
    if (err instanceof StorageError) {
      throw err;
    }
    throw new StorageError('Failed to export data', 'EXPORT_FAILED', err);
  }
}

/**
 * Import data from exported JSON
 * Converts base64 back to Blobs
 * Handles both audio and image snippets
 */
export async function importData(exportedData) {
  try {
    if (!exportedData || !exportedData.snippets) {
      throw new StorageError('Invalid import data format', 'INVALID_DATA');
    }
    
    const db = await getDB();
    const tx = db.transaction(SNIPPETS_STORE, 'readwrite');
    const store = tx.objectStore(SNIPPETS_STORE);
    
    let imported = 0;
    let skipped = 0;
    
    for (const snippet of exportedData.snippets) {
      try {
        const existing = await store.get(snippet.id);
        if (existing) {
          skipped++;
          continue;
        }
        
        const snippetToImport = { ...snippet, dataVersion: DATA_VERSION };
        
        if (snippet.type === 'image' && snippet.mediaBlob) {
          const mimeType = snippet.mediaBlobType || snippet.mimeType || 'image/jpeg';
          const mediaBlob = base64ToBlob(snippet.mediaBlob, mimeType);
          snippetToImport.mediaBlob = mediaBlob;
          snippetToImport.mimeType = mimeType; // Store MIME type for mobile compatibility
          delete snippetToImport.mediaBlobType;
        } else if (snippet.audioBlob) {
          const audioBlob = base64ToBlob(snippet.audioBlob, snippet.audioBlobType || 'audio/webm');
          snippetToImport.audioBlob = audioBlob;
          delete snippetToImport.audioBlobType;
        }
        
        await store.put(snippetToImport);
        imported++;
      } catch (err) {
        skipped++;
      }
    }
    
    await tx.done;
    
    return { imported, skipped, total: exportedData.snippets.length };
  } catch (err) {
    if (err instanceof StorageError) {
      throw err;
    }
    if (err.name === 'QuotaExceededError') {
      throw new StorageError(
        'Storage quota exceeded during import',
        'QUOTA_EXCEEDED',
        err
      );
    }
    throw new StorageError('Failed to import data', 'IMPORT_FAILED', err);
  }
}

/**
 * Clear all data from the database
 */
export async function clearAllData() {
  try {
    const db = await getDB();
    const tx = db.transaction(SNIPPETS_STORE, 'readwrite');
    await tx.objectStore(SNIPPETS_STORE).clear();
    await tx.done;
  } catch (err) {
    throw new StorageError('Failed to clear data', 'CLEAR_FAILED', err);
  }
}

/**
 * Convert Blob to base64 string
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(base64, type = 'audio/webm') {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
}

export { StorageError };
