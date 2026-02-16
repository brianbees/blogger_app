import { useState, useRef, useEffect, useCallback } from 'react';
import { transcribeAudio } from '../services/speechToTextService';

/**
 * @typedef {Object} AudioChunk
 * @property {string} id - Unique chunk ID
 * @property {number} index - Sequential chunk index (0-based)
 * @property {number} startTime - Recording start time (ms since epoch)
 * @property {number} endTime - Recording end time (ms since epoch)
 * @property {Blob|null} blob - Audio blob data (null after successful transcription to save memory)
 * @property {'pending'|'transcribing'|'done'|'failed'} status - Chunk processing status
 * @property {string} transcript - Transcribed text
 * @property {number|null} confidence - Transcription confidence (0-1)
 * @property {string|null} error - Error message if failed
 * @property {number} retryCount - Number of retry attempts (for exponential backoff)
 */

/**
 * COST AWARENESS:
 * - Each chunk = 1 Speech-to-Text API call
 * - At 25s per chunk: ~2.4 calls/minute, ~14 calls/5 minutes
 * - Chunk duration chosen to stay safely under 30s API timeout
 * - Longer chunks = fewer API calls but higher risk of timeout
 * - Current setting balances cost, reliability, and UX
 */

/**
 * Hook for continuous audio recording with automatic chunking and transcription
 * 
 * Features:
 * - Sequential transcription queue (no parallel API calls)
 * - Exponential backoff retry logic (1s → 2s → 4s → 8s)
 * - Memory-safe blob cleanup after successful transcription
 * - Auto-save draft transcript every 10 seconds
 * - Defensive state guards for browser stability
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.chunkDuration - Duration of each chunk in seconds (default: 25)
 * @param {boolean} options.autoTranscribe - Auto-transcribe chunks as they arrive (default: true)
 * @param {string} options.languageCode - Language code for transcription (default: 'en-GB')
 * @param {Function} options.onAutoSave - Callback for auto-saving draft transcript
 * @param {Function} options.onRecordingComplete - Callback when recording stops with all data
 * @returns {Object} Recording state and controls
 */
export function useContinuousRecorder(options = {}) {
  const {
    chunkDuration = 25, // 25 seconds per chunk (safe for 30s API limit)
    autoTranscribe = true,
    languageCode = 'en-GB',
    onAutoSave = null, // Callback for periodic auto-save
    onRecordingComplete = null, // Callback when recording stops
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [chunks, setChunks] = useState(/** @type {AudioChunk[]} */ ([]));
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  // Refs for recording state
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const autoSaveIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const chunkIndexRef = useRef(0);
  const currentChunkStartRef = useRef(null);
  const mimeTypeRef = useRef(null);
  const isStoppingRef = useRef(false);

  // Refs for transcription queue management
  const transcriptionQueueRef = useRef([]); // Queue of chunk IDs waiting to be transcribed
  const isProcessingQueueRef = useRef(false); // Flag to prevent parallel processing
  const processedChunkIdsRef = useRef(new Set()); // Track which chunks have been transcribed to prevent duplicates

  // Retry configuration
  const MAX_RETRIES = 3; // Maximum retry attempts per chunk
  const BASE_RETRY_DELAY = 1000; // 1 second base delay
  const MAX_RETRY_DELAY = 8000; // 8 seconds maximum delay

  // Check browser support on mount
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
      setError('MediaRecorder is not supported in this browser');
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      setIsSupported(false);
      setError('MediaRecorder is not supported in this browser');
      return;
    }

    // Find supported MIME type
    if (MediaRecorder.isTypeSupported) {
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];

      for (const mimeType of mimeTypes) {
        try {
          if (MediaRecorder.isTypeSupported(mimeType)) {
            mimeTypeRef.current = mimeType;
            break;
          }
        } catch (e) {
          // Continue
        }
      }
    }
  }, []);

  /**
   * Calculate exponential backoff delay
   * @param {number} retryCount - Current retry attempt (0-based)
   * @returns {number} Delay in milliseconds
   */
  const getRetryDelay = (retryCount) => {
    const delay = BASE_RETRY_DELAY * Math.pow(2, retryCount);
    return Math.min(delay, MAX_RETRY_DELAY);
  };

  /**
   * Sleep utility for retry delays
   */
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Transcribe a single chunk with retry logic
   * This function is called sequentially by the transcription queue processor
   * 
   * @param {AudioChunk} chunk - Chunk to transcribe
   * @returns {Promise<boolean>} - True if successful, false if failed after all retries
   */
  const transcribeChunkWithRetry = async (chunk) => {
    // Prevent duplicate transcription
    if (processedChunkIdsRef.current.has(chunk.id)) {
      console.log(`[Transcription] Skipping already processed chunk ${chunk.index}`);
      return true;
    }

    if (!chunk.blob) {
      console.warn(`[Transcription] No blob for chunk ${chunk.index}`);
      return false;
    }

    const maxRetries = chunk.retryCount || 0;
    let currentRetry = 0;

    while (currentRetry <= MAX_RETRIES) {
      try {
        console.log(`[Transcription] Processing chunk ${chunk.index} (attempt ${currentRetry + 1}/${MAX_RETRIES + 1})`);

        // Update status to transcribing
        setChunks(prev => prev.map(c =>
          c.id === chunk.id ? { ...c, status: 'transcribing' } : c
        ));

        // Call Speech-to-Text API
        const result = await transcribeAudio(chunk.blob, languageCode);

        console.log(`[Transcription] Chunk ${chunk.index} succeeded, transcript length: ${result.transcript?.length || 0}`);

        // Update with transcript and mark as done
        setChunks(prev => prev.map(c =>
          c.id === chunk.id
            ? {
                ...c,
                status: 'done',
                transcript: result.transcript || '',
                confidence: result.confidence,
                error: null,
                retryCount: currentRetry,
                // MEMORY MANAGEMENT: Release blob after successful transcription
                // The blob data is no longer needed since we have the transcript
                // This prevents memory growth during long recording sessions
                blob: null,
              }
            : c
        ));

        // Mark as processed to prevent duplicate transcription
        processedChunkIdsRef.current.add(chunk.id);
        
        return true; // Success

      } catch (err) {
        console.error(`[Transcription] Chunk ${chunk.index} attempt ${currentRetry + 1} failed:`, err.message);

        currentRetry++;

        if (currentRetry <= MAX_RETRIES) {
          // Calculate backoff delay
          const delay = getRetryDelay(currentRetry - 1);
          console.log(`[Transcription] Retrying chunk ${chunk.index} after ${delay}ms`);
          
          // Wait before retry
          await sleep(delay);
        } else {
          // All retries exhausted
          console.error(`[Transcription] Chunk ${chunk.index} failed after ${MAX_RETRIES + 1} attempts`);
          
          // Update with error
          setChunks(prev => prev.map(c =>
            c.id === chunk.id
              ? {
                  ...c,
                  status: 'failed',
                  error: err.message || 'Transcription failed after multiple retries',
                  retryCount: currentRetry,
                }
              : c
          ));
          
          return false; // Failed
        }
      }
    }

    return false;
  };

  /**
   * Process transcription queue sequentially
   * Ensures chunks are transcribed in order, one at a time
   * This prevents parallel API calls and maintains transcript ordering
   */
  const processTranscriptionQueue = useCallback(async () => {
    // Prevent concurrent queue processing
    if (isProcessingQueueRef.current) {
      return;
    }

    if (transcriptionQueueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;

    try {
      while (transcriptionQueueRef.current.length > 0) {
        const chunkId = transcriptionQueueRef.current[0]; // Peek first item
        
        // Find chunk in current state
        const chunk = chunks.find(c => c.id === chunkId);
        
        if (!chunk) {
          // Chunk not found, remove from queue
          transcriptionQueueRef.current.shift();
          continue;
        }

        // Skip if already processed
        if (processedChunkIdsRef.current.has(chunk.id)) {
          transcriptionQueueRef.current.shift();
          continue;
        }

        // Transcribe the chunk (with retry logic)
        await transcribeChunkWithRetry(chunk);
        
        // Remove from queue after processing (success or failure)
        transcriptionQueueRef.current.shift();
      }
    } finally {
      isProcessingQueueRef.current = false;
    }
  }, [chunks, languageCode]);

  /**
   * Add chunk to transcription queue
   * Called when a new chunk is created
   */
  const enqueueChunkForTranscription = useCallback((chunkId) => {
    if (!autoTranscribe) return;
    
    // Add to queue if not already present
    if (!transcriptionQueueRef.current.includes(chunkId)) {
      transcriptionQueueRef.current.push(chunkId);
      console.log(`[Queue] Added chunk to transcription queue (queue length: ${transcriptionQueueRef.current.length})`);
      
      // Start processing
      processTranscriptionQueue();
    }
  }, [autoTranscribe, processTranscriptionQueue]);

  /**
   * Manually retry transcription for a failed chunk
   * Adds the chunk back to the queue for reprocessing
   */
  const retryChunk = useCallback(async (chunkId) => {
    const chunk = chunks.find(c => c.id === chunkId);
    if (!chunk) return;

    console.log(`[Retry] Manual retry requested for chunk ${chunk.index}`);

    // Remove from processed set to allow reprocessing
    processedChunkIdsRef.current.delete(chunkId);

    // Reset chunk status
    setChunks(prev => prev.map(c =>
      c.id === chunkId ? { ...c, status: 'pending', error: null } : c
    ));

    // Add to queue
    enqueueChunkForTranscription(chunkId);
  }, [chunks, enqueueChunkForTranscription]);

  /**
   * Auto-save draft transcript periodically
   * Prevents data loss if browser closes mid-recording
   */
  const performAutoSave = useCallback(() => {
    if (!onAutoSave) return;

    const transcript = getFullTranscript();
    console.log(`[Continuous] 💾 performAutoSave - transcript length: ${transcript.length}, chunks: ${chunks.length}`);
    if (transcript.length > 0) {
      console.log(`[Auto-Save] Saving draft transcript (${transcript.length} chars)`);
      onAutoSave(transcript, chunks);
    }
  }, [onAutoSave, chunks, getFullTranscript]);

  /**
   * Get the full stitched transcript with duplicate prevention
   * Ensures stable ordering even with retries
   */
  const getFullTranscript = useCallback(() => {
    // Sort chunks by index to ensure correct order
    const sortedChunks = [...chunks].sort((a, b) => a.index - b.index);
    
    // Only include chunks that are done and have transcripts
    // This prevents duplicates during retries
    const transcripts = sortedChunks
      .filter(chunk => chunk.status === 'done' && chunk.transcript)
      .map(chunk => chunk.transcript.trim())
      .filter(text => text.length > 0);

    // Join with space and clean up whitespace
    let fullText = transcripts.join(' ');
    
    // Clean up multiple spaces (including tabs, newlines, etc.)
    fullText = fullText.replace(/\s+/g, ' ').trim();
    
    // Ensure proper sentence spacing
    fullText = fullText.replace(/([.!?])\s*([A-Z])/g, '$1 $2');
    
    return fullText;
  }, [chunks]);

  /**
   * Start continuous recording with defensive state guards
   */
  const startRecording = async () => {
    // Defensive guard: prevent starting if already recording
    if (isRecording) {
      console.warn('[Recording] Already recording, ignoring start request');
      return;
    }

    // Defensive guard: check MediaRecorder support
    if (!isSupported) {
      setError('MediaRecorder is not supported in this browser');
      return;
    }

    try {
      isStoppingRef.current = false;
      
      // Get selected microphone from localStorage (if any)
      const selectedMicId = localStorage.getItem('selectedMicrophoneId');

      // Request microphone permission
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1, // Mono for voice
        },
      };

      if (selectedMicId && selectedMicId !== 'default') {
        constraints.audio.deviceId = { exact: selectedMicId };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Handle microphone track ending (e.g., device disconnected)
      stream.getTracks().forEach(track => {
        track.onended = () => {
          console.warn('[Recording] Microphone track ended unexpectedly');
          setError('Microphone connection lost');
          stopRecording();
        };
      });

      // Create MediaRecorder with timeslice for automatic chunking
      let mediaRecorder;
      const options = {
        audioBitsPerSecond: 128000, // 128 kbps for good quality
      };

      if (mimeTypeRef.current) {
        try {
          options.mimeType = mimeTypeRef.current;
          mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
          mediaRecorder = new MediaRecorder(stream);
        }
      } else {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      chunkIndexRef.current = 0;
      setChunks([]);
      
      // Reset transcription queue state
      transcriptionQueueRef.current = [];
      isProcessingQueueRef.current = false;
      processedChunkIdsRef.current.clear();

      // Handle data available - fires for each chunk
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && !isStoppingRef.current) {
          const chunkEndTime = Date.now();
          const chunkIndex = chunkIndexRef.current;
          const chunkStartTime = currentChunkStartRef.current || startTimeRef.current;

          console.log(`[Recording] Chunk ${chunkIndex} created (${event.data.size} bytes)`);

          // Create chunk object
          const newChunk = {
            id: `chunk-${chunkIndex}-${chunkEndTime}`,
            index: chunkIndex,
            startTime: chunkStartTime,
            endTime: chunkEndTime,
            blob: event.data,
            status: 'pending',
            transcript: '',
            confidence: null,
            error: null,
            retryCount: 0,
          };

          // Add chunk to state
          setChunks(prev => [...prev, newChunk]);

          // Add to transcription queue (sequential processing)
          if (autoTranscribe) {
            // Use setTimeout to ensure state is updated first
            setTimeout(() => enqueueChunkForTranscription(newChunk.id), 0);
          }

          // Prepare for next chunk
          chunkIndexRef.current++;
          currentChunkStartRef.current = chunkEndTime;
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        console.log('[Recording] MediaRecorder stopped');
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('[Recording] MediaRecorder error:', event.error);
        setError(event.error?.message || 'Recording error occurred');
        stopRecording();
      };

      // Start recording with timeslice (in milliseconds)
      const timesliceMs = chunkDuration * 1000;
      mediaRecorder.start(timesliceMs);

      setIsRecording(true);
      setError(null);
      setTimer(0);
      startTimeRef.current = Date.now();
      currentChunkStartRef.current = Date.now();

      console.log(`[Recording] Started with ${chunkDuration}s chunks (${timesliceMs}ms timeslice)`);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setTimer(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Start auto-save interval (every 10 seconds)
      if (onAutoSave) {
        autoSaveIntervalRef.current = setInterval(() => {
          performAutoSave();
        }, 10000); // 10 seconds
        console.log('[Auto-Save] Enabled (every 10 seconds)');
      }

    } catch (err) {
      console.error('[Recording] Start failed:', err);
      setError(err.message || 'Failed to access microphone');
      
      // Cleanup on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  /**
   * Stop continuous recording with defensive state guards
   */
  const stopRecording = useCallback(() => {
    // Defensive guard: prevent stopping if not recording
    if (!isRecording) {
      console.warn('[Recording] Not recording, ignoring stop request');
      return;
    }

    console.log('[Continuous] 🛑 STOP RECORDING CALLED, chunks.length:', chunks.length);

    // Defensive guard: check recorder state before stopping
    if (mediaRecorderRef.current) {
      const state = mediaRecorderRef.current.state;
      
      if (state === 'recording' || state === 'paused') {
        console.log(`[Recording] Stopping recorder (state: ${state})`);
        isStoppingRef.current = true;
        mediaRecorderRef.current.stop();
      } else {
        console.warn(`[Recording] MediaRecorder in unexpected state: ${state}`);
      }
    }

    setIsRecording(false);
    setIsPaused(false);

    // Clear timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Clear auto-save interval
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
      console.log('[Auto-Save] Disabled');
    }

    // Perform final auto-save
    if (onAutoSave) {
      const transcript = getFullTranscript();
      console.log('[Continuous] 📞 Calling onAutoSave callback, transcript length:', transcript.length, 'chunks:', chunks.length);
      performAutoSave();
    }

    // Notify parent that recording is complete with all data
    if (onRecordingComplete && chunks.length > 0) {
      const finalBlob = getFinalBlob();
      const fullTranscript = getFullTranscript();
      const recordingData = {
        chunks: chunks,
        blob: finalBlob,
        transcript: fullTranscript,
        duration: timer,
        chunkMetadata: {
          totalChunks: chunks.length,
          successfulChunks: chunks.filter(c => c.status === 'done').length,
          failedChunks: chunks.filter(c => c.status === 'failed').length,
        },
      };
      console.log('[Continuous] 📣 Calling onRecordingComplete with blob size:', finalBlob?.size, 'transcript length:', fullTranscript?.length);
      // Use setTimeout to ensure state updates have propagated
      setTimeout(() => onRecordingComplete(recordingData), 0);
    }
  }, [isRecording, onAutoSave, performAutoSave, chunks, getFullTranscript, getFinalBlob, timer, onRecordingComplete]);

  /**
   * Pause recording (if supported) with defensive guards
   */
  const pauseRecording = useCallback(() => {
    if (!isRecording || isPaused) {
      console.warn('[Recording] Cannot pause: not recording or already paused');
      return;
    }

    if (mediaRecorderRef.current && typeof mediaRecorderRef.current.pause === 'function') {
      const state = mediaRecorderRef.current.state;
      
      if (state === 'recording') {
        console.log('[Recording] Pausing');
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
          autoSaveIntervalRef.current = null;
        }
      }
    }
  }, [isRecording, isPaused]);

  /**
   * Resume recording (if paused) with defensive guards
   */
  const resumeRecording = useCallback(() => {
    if (!isRecording || !isPaused) {
      console.warn('[Recording] Cannot resume: not recording or not paused');
      return;
    }

    if (mediaRecorderRef.current && typeof mediaRecorderRef.current.resume === 'function') {
      const state = mediaRecorderRef.current.state;
      
      if (state === 'paused') {
        console.log('[Recording] Resuming');
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        
        // Restart timer
        timerIntervalRef.current = setInterval(() => {
          setTimer(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        
        // Restart auto-save
        if (onAutoSave) {
          autoSaveIntervalRef.current = setInterval(() => {
            performAutoSave();
          }, 10000);
        }
      }
    }
  }, [isRecording, isPaused, onAutoSave, performAutoSave]);

  /**
   * Get statistics about chunks
   */
  const getChunkStats = useCallback(() => {
    const total = chunks.length;
    const done = chunks.filter(c => c.status === 'done').length;
    const pending = chunks.filter(c => c.status === 'pending').length;
    const transcribing = chunks.filter(c => c.status === 'transcribing').length;
    const failed = chunks.filter(c => c.status === 'failed').length;
    
    return { total, done, pending, transcribing, failed };
  }, [chunks]);

  /**
   * Get the final recording blob (all chunks combined)
   * Note: Blobs are released after transcription for memory efficiency
   * Only chunks that still have blobs will be included
   */
  const getFinalBlob = useCallback(() => {
    const sortedChunks = [...chunks].sort((a, b) => a.index - b.index);
    const blobs = sortedChunks.map(chunk => chunk.blob).filter(Boolean);
    
    if (blobs.length === 0) {
      console.warn('[Blob] No blobs available (may have been released for memory)');
      return null;
    }
    
    return new Blob(blobs, { type: mimeTypeRef.current || 'audio/webm' });
  }, [chunks]);

  // Cleanup on unmount - ensures all resources are released
  useEffect(() => {
    return () => {
      console.log('[Cleanup] Component unmounting, releasing resources');
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Clear transcription queue
      transcriptionQueueRef.current = [];
      processedChunkIdsRef.current.clear();
    };
  }, []);

  // Trigger queue processing when chunks change
  useEffect(() => {
    if (autoTranscribe && transcriptionQueueRef.current.length > 0) {
      processTranscriptionQueue();
    }
  }, [chunks, autoTranscribe, processTranscriptionQueue]);

  return {
    // State
    isRecording,
    isPaused,
    timer,
    chunks,
    error,
    isSupported,
    stream: streamRef.current,
    
    // Controls
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    retryChunk,
    
    // Utilities
    getFullTranscript,
    getChunkStats,
    getFinalBlob,
  };
}
