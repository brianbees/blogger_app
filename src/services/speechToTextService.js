/**
 * Google Cloud Speech-to-Text Service
 * 
 * Transcribes audio recordings using Google Cloud Speech-to-Text API.
 * Supports WebM audio from MediaRecorder API.
 * 
 * API Reference: https://cloud.google.com/speech-to-text/docs/reference/rest/v1/speech/recognize
 */

import { ensureValidToken } from './googleAuth';

const SPEECH_API_URL = 'https://speech.googleapis.com/v1/speech:recognize';

/**
 * Convert audio blob to base64 string
 */
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Detect audio encoding from MIME type
 */
function getAudioEncoding(mimeType) {
  if (mimeType.includes('webm')) {
    return 'WEBM_OPUS';
  } else if (mimeType.includes('ogg')) {
    return 'OGG_OPUS';
  } else if (mimeType.includes('mp3')) {
    return 'MP3';
  } else if (mimeType.includes('wav')) {
    return 'LINEAR16';
  }
  return 'WEBM_OPUS'; // default for Chrome MediaRecorder
}

/**
 * Transcribe audio blob to text
 * 
 * @param {Blob} audioBlob - Audio blob from MediaRecorder
 * @param {string} languageCode - BCP-47 language code (default: 'en-GB')
 * @returns {Promise<{transcript: string, confidence: number}>}
 */
export async function transcribeAudio(audioBlob, languageCode = 'en-GB') {
  try {
    const token = await ensureValidToken();
    const base64Audio = await blobToBase64(audioBlob);
    const encoding = getAudioEncoding(audioBlob.type);

    const requestBody = {
      config: {
        encoding: encoding,
        sampleRateHertz: 48000, // Standard for WebM Opus
        languageCode: languageCode,
        enableAutomaticPunctuation: true,
        model: 'default',
        useEnhanced: false, // set to true for premium model (higher cost)
        maxAlternatives: 1,
      },
      audio: {
        content: base64Audio,
      },
    };

    const response = await fetch(`${SPEECH_API_URL}?key=${import.meta.env.VITE_GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Speech-to-Text API request failed');
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return {
        transcript: '',
        confidence: 0,
      };
    }

    // Concatenate all results (API may split long audio into multiple results)
    const transcripts = [];
    let totalConfidence = 0;

    for (const result of data.results) {
      if (result.alternatives && result.alternatives.length > 0) {
        const alternative = result.alternatives[0];
        transcripts.push(alternative.transcript || '');
        totalConfidence += alternative.confidence || 0;
      }
    }

    const fullTranscript = transcripts.join(' ').trim();
    const avgConfidence = data.results.length > 0 ? totalConfidence / data.results.length : 0;

    return {
      transcript: fullTranscript,
      confidence: avgConfidence,
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}

/**
 * Transcribe audio with progress callback for long recordings
 * Uses streaming API for audio longer than 60 seconds
 * 
 * @param {Blob} audioBlob - Audio blob from MediaRecorder
 * @param {Function} progressCallback - Called with progress updates
 * @param {string} languageCode - BCP-47 language code
 * @returns {Promise<{transcript: string, confidence: number}>}
 */
export async function transcribeAudioWithProgress(audioBlob, progressCallback, languageCode = 'en-GB') {
  // For now, use simple recognize API
  // TODO: Implement streaming API for long audio files
  
  if (progressCallback) {
    progressCallback({ status: 'starting', progress: 0 });
  }

  try {
    if (progressCallback) {
      progressCallback({ status: 'uploading', progress: 30 });
    }

    const result = await transcribeAudio(audioBlob, languageCode);

    if (progressCallback) {
      progressCallback({ status: 'complete', progress: 100 });
    }

    return result;
  } catch (error) {
    if (progressCallback) {
      progressCallback({ status: 'error', progress: 0, error: error.message });
    }
    throw error;
  }
}

/**
 * Batch transcribe multiple audio snippets
 * 
 * @param {Array<{id: string, audioBlob: Blob}>} snippets - Array of snippets to transcribe
 * @param {Function} progressCallback - Called after each snippet
 * @returns {Promise<Array<{id: string, transcript: string, confidence: number}>>}
 */
export async function batchTranscribe(snippets, progressCallback) {
  const results = [];
  let completed = 0;

  for (const snippet of snippets) {
    try {
      const result = await transcribeAudio(snippet.audioBlob);
      results.push({
        id: snippet.id,
        transcript: result.transcript,
        confidence: result.confidence,
      });
    } catch (error) {
      console.error(`Failed to transcribe snippet ${snippet.id}:`, error);
      results.push({
        id: snippet.id,
        transcript: '',
        confidence: 0,
        error: error.message,
      });
    }

    completed++;
    if (progressCallback) {
      progressCallback({
        completed,
        total: snippets.length,
        progress: (completed / snippets.length) * 100,
      });
    }
  }

  return results;
}
