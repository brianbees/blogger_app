/**
 * Detect MIME type from Blob data by reading file signature (magic bytes)
 * Useful for images stored without MIME type metadata in IndexedDB
 */
export async function detectImageMimeType(blob) {
  if (!blob) return null;

  // If Blob already has a valid MIME type, use it
  if (blob.type && blob.type.startsWith('image/')) {
    return blob.type;
  }

  try {
    // Read first 12 bytes to check file signature
    const arrayBuffer = await blob.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Check for PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (bytes.length >= 8 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4E &&
        bytes[3] === 0x47) {
      return 'image/png';
    }

    // Check for JPEG/JPG signature: FF D8 FF
    if (bytes.length >= 3 &&
        bytes[0] === 0xFF &&
        bytes[1] === 0xD8 &&
        bytes[2] === 0xFF) {
      return 'image/jpeg';
    }

    // Check for WebP signature: RIFF....WEBP
    if (bytes.length >= 12 &&
        bytes[0] === 0x52 && // R
        bytes[1] === 0x49 && // I
        bytes[2] === 0x46 && // F
        bytes[3] === 0x46 && // F
        bytes[8] === 0x57 && // W
        bytes[9] === 0x45 && // E
        bytes[10] === 0x42 && // B
        bytes[11] === 0x50) { // P
      return 'image/webp';
    }

    // Check for GIF signature: GIF87a or GIF89a
    if (bytes.length >= 6 &&
        bytes[0] === 0x47 && // G
        bytes[1] === 0x49 && // I
        bytes[2] === 0x46) { // F
      return 'image/gif';
    }

    console.warn('[imageUtils] Could not detect image MIME type from signature');
    return null;
  } catch (err) {
    console.error('[imageUtils] Error detecting MIME type:', err);
    return null;
  }
}

/**
 * Ensure a Blob has the correct MIME type
 * Creates a new Blob with explicit MIME type if needed
 */
export async function ensureBlobMimeType(blob, storedMimeType = null) {
  if (!blob) return null;

  // If stored MIME type is provided and Blob lacks it, use stored type
  if (storedMimeType && (!blob.type || blob.type === '')) {
    console.log('[imageUtils] Recreating Blob with stored MIME type:', storedMimeType);
    return new Blob([blob], { type: storedMimeType });
  }

  // If Blob already has a valid MIME type, return as-is
  if (blob.type && blob.type.startsWith('image/')) {
    return blob;
  }

  // Otherwise, try to detect MIME type from file signature
  const detectedType = await detectImageMimeType(blob);
  if (detectedType) {
    console.log('[imageUtils] Recreating Blob with detected MIME type:', detectedType);
    return new Blob([blob], { type: detectedType });
  }

  // Fallback: assume JPEG if all else fails (most common format)
  console.warn('[imageUtils] Could not determine MIME type, defaulting to image/jpeg');
  return new Blob([blob], { type: 'image/jpeg' });
}
