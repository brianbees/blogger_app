/**
 * Google Drive Service
 * 
 * Upload images and backup app data to Google Drive.
 * Uses Google Drive API v3 with multipart upload.
 * 
 * API Reference: https://developers.google.com/drive/api/v3/reference
 */

import { ensureValidToken } from './googleAuth';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

const APP_FOLDER_NAME = 'Voice Journal Backups';

/**
 * Make a Drive file publicly readable
 */
async function makeFilePublic(fileId) {
  const token = await ensureValidToken();
  
  const response = await fetch(`${DRIVE_API_URL}/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  });
  
  if (!response.ok) {
    console.warn('Failed to make file public:', await response.text());
  }
}

/**
 * Find or create app folder in Google Drive
 */
async function getAppFolder() {
  const token = await ensureValidToken();

  // Search for existing folder
  const searchResponse = await fetch(
    `${DRIVE_API_URL}/files?q=name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!searchResponse.ok) {
    throw new Error('Failed to search for app folder');
  }

  const searchData = await searchResponse.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if it doesn't exist
  const createResponse = await fetch(`${DRIVE_API_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: APP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createResponse.ok) {
    throw new Error('Failed to create app folder');
  }

  const createData = await createResponse.json();
  return createData.id;
}

/**
 * Upload image to Google Drive
 * 
 * @param {Blob} imageBlob - Image blob to upload
 * @param {string} fileName - Name for the file in Drive
 * @param {string} description - Optional description
 * @returns {Promise<{id: string, name: string, webViewLink: string}>}
 */
export async function uploadImage(imageBlob, fileName, description = '') {
  try {
    const token = await ensureValidToken();
    const folderId = await getAppFolder();

    // Create multipart request body
    const metadata = {
      name: fileName,
      description: description,
      parents: [folderId],
      mimeType: imageBlob.type,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', imageBlob);

    const response = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id,name,webViewLink,webContentLink`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload image to Drive');
    }

    const data = await response.json();
    
    // Make file publicly readable so it can be embedded in blog
    await makeFilePublic(data.id);
    
    // Get direct link for embedding
    const directLink = `https://drive.google.com/uc?export=view&id=${data.id}`;
    
    return {
      id: data.id,
      name: data.name,
      webViewLink: data.webViewLink,
      webContentLink: data.webContentLink,
      directLink: directLink,
    };
  } catch (error) {
    console.error('Drive upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Upload JSON backup to Google Drive
 * 
 * @param {Object} backupData - JSON data to backup
 * @param {string} fileName - Name for the backup file
 * @returns {Promise<{id: string, name: string, createdTime: string}>}
 */
export async function uploadBackup(backupData, fileName = null) {
  try {
    const token = await ensureValidToken();
    const folderId = await getAppFolder();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const finalFileName = fileName || `voice-journal-backup-${timestamp}.json`;

    const metadata = {
      name: finalFileName,
      description: 'Voice Journal app data backup',
      parents: [folderId],
      mimeType: 'application/json',
    };

    const jsonBlob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', jsonBlob);

    const response = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id,name,createdTime`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload backup to Drive');
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      createdTime: data.createdTime,
    };
  } catch (error) {
    console.error('Backup upload error:', error);
    throw new Error(`Failed to upload backup: ${error.message}`);
  }
}

/**
 * List all backups in app folder
 * 
 * @returns {Promise<Array<{id: string, name: string, createdTime: string, size: number}>>}
 */
export async function listBackups() {
  try {
    const token = await ensureValidToken();
    const folderId = await getAppFolder();

    const response = await fetch(
      `${DRIVE_API_URL}/files?q='${folderId}' in parents and mimeType='application/json' and trashed=false&orderBy=createdTime desc&fields=files(id,name,createdTime,size)`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to list backups');
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('List backups error:', error);
    throw new Error(`Failed to list backups: ${error.message}`);
  }
}

/**
 * Download backup file from Google Drive
 * 
 * @param {string} fileId - Drive file ID
 * @returns {Promise<Object>} - Parsed JSON backup data
 */
export async function downloadBackup(fileId) {
  try {
    const token = await ensureValidToken();

    const response = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download backup');
    }

    return await response.json();
  } catch (error) {
    console.error('Download backup error:', error);
    throw new Error(`Failed to download backup: ${error.message}`);
  }
}

/**
 * Delete file from Google Drive
 * 
 * @param {string} fileId - Drive file ID to delete
 * @returns {Promise<void>}
 */
export async function deleteFile(fileId) {
  try {
    const token = await ensureValidToken();

    const response = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  } catch (error) {
    console.error('Delete file error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Get storage quota information
 * 
 * @returns {Promise<{usage: number, limit: number, usageInDrive: number}>}
 */
export async function getStorageInfo() {
  try {
    const token = await ensureValidToken();

    const response = await fetch(`${DRIVE_API_URL}/about?fields=storageQuota`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get storage info');
    }

    const data = await response.json();
    const quota = data.storageQuota;

    return {
      usage: parseInt(quota.usage) || 0,
      limit: parseInt(quota.limit) || 0,
      usageInDrive: parseInt(quota.usageInDrive) || 0,
    };
  } catch (error) {
    console.error('Storage info error:', error);
    throw new Error(`Failed to get storage info: ${error.message}`);
  }
}
