import { useState, useRef, useEffect, useCallback } from 'react';
import { transcribeAudio } from '../services/speechToTextService';

/**
 * @typedef {Object} AudioChunk
 * @property {string} id - Unique chunk ID
 * @property {number} index - Sequential chunk index (0-based)
 * @property {number} startTime - Recording start time (ms since epoch)
 * @property {number} endTime - Recording end time (ms since epoch)
 * @property {Blob|null} blob - Audio blob data
 * @property {'pending'|'transcribing'|'done'|'failed'} status - Chunk processing status
 * @property {string} transcript - Transcribed text
 * @property {number|null} confidence - Transcription confidence (0-1)
 * @property {string|null} error - Error message if failed
 */

/**
 * Hook for continuous audio recording with automatic chunking and transcription
 * 
 * Automatically splits long recordings into chunks (20-30s) and transcribes each chunk
 * progressively, stitching results into a single transcript.
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.chunkDuration - Duration of each chunk in seconds (default: 25)
 * @param {boolean} options.autoTranscribe - Auto-transcribe chunks as they arrive (default: true)
 * @param {string} options.languageCode - Language code for transcription (default: 'en-GB')
 * @returns {Object} Recording state and controls
 */
export function useContinuousRecorder(options = {}) {
  const {
    chunkDuration = 25, // 25 seconds per chunk (safe for 30s API limit)
    autoTranscribe = true,
    languageCode = 'en-GB',
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [chunks, setChunks] = useState(/** @type {AudioChunk[]} */ ([]));
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const chunkIndexRef = useRef(0);
  const currentChunkStartRef = useRef(null);
  const mimeTypeRef = useRef(null);
  const isStoppingRef = useRef(false);

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
   * Transcribe a single chunk
   */
  const transcribeChunk = useCallback(async (chunk) => {
    if (!chunk.blob) return;

    try {
      // Update status to transcribing
      setChunks(prev => prev.map(c =>
        c.id === chunk.id ? { ...c, status: 'transcribing' } : c
      ));

      const result = await transcribeAudio(chunk.blob, languageCode);

      // Update with transcript
      setChunks(prev => prev.map(c =>
        c.id === chunk.id
          ? {
              ...c,
              status: 'done',
              transcript: result.transcript || '',
              confidence: result.confidence,
              error: null,
            }
          : c
      ));
    } catch (err) {
      console.error(`Failed to transcribe chunk ${chunk.id}:`, err);
      
      // Update with error
      setChunks(prev => prev.map(c =>
        c.id === chunk.id
          ? {
              ...c,
              status: 'failed',
              error: err.message || 'Transcription failed',
            }
          : c
      ));
    }
  }, [languageCode]);

  /**
   * Manually retry transcription for a failed chunk
   */
  const retryChunk = useCallback(async (chunkId) => {
    const chunk = chunks.find(c => c.id === chunkId);
    if (!chunk || !chunk.blob) return;

    await transcribeChunk(chunk);
  }, [chunks, transcribeChunk]);

  /**
   * Start continuous recording
   */
  const startRecording = async () => {
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

      // Handle data available - fires for each chunk
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && !isStoppingRef.current) {
          const chunkEndTime = Date.now();
          const chunkIndex = chunkIndexRef.current;
          const chunkStartTime = currentChunkStartRef.current || startTimeRef.current;

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
          };

          // Add chunk to state
          setChunks(prev => [...prev, newChunk]);

          // Auto-transcribe if enabled
          if (autoTranscribe) {
            // Use setTimeout to ensure state is updated first
            setTimeout(() => transcribeChunk(newChunk), 0);
          }

          // Prepare for next chunk
          chunkIndexRef.current++;
          currentChunkStartRef.current = chunkEndTime;
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
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

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setTimer(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

    } catch (err) {
      setError(err.message || 'Failed to access microphone');
      console.error('Recording error:', err);
    }
  };

  /**
   * Stop continuous recording
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      isStoppingRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      // Clear timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  /**
   * Pause recording (if supported)
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      if (typeof mediaRecorderRef.current.pause === 'function') {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      }
    }
  }, [isRecording, isPaused]);

  /**
   * Resume recording (if paused)
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      if (typeof mediaRecorderRef.current.resume === 'function') {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        
        // Restart timer
        timerIntervalRef.current = setInterval(() => {
          setTimer(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
      }
    }
  }, [isRecording, isPaused]);

  /**
   * Get the full stitched transcript
   */
  const getFullTranscript = useCallback(() => {
    // Sort chunks by index to ensure correct order
    const sortedChunks = [...chunks].sort((a, b) => a.index - b.index);
    
    // Join transcripts with proper spacing
    const transcripts = sortedChunks
      .filter(chunk => chunk.transcript && chunk.status === 'done')
      .map(chunk => chunk.transcript.trim())
      .filter(text => text.length > 0);

    // Join with space and clean up
    let fullText = transcripts.join(' ');
    
    // Clean up multiple spaces
    fullText = fullText.replace(/\s+/g, ' ').trim();
    
    // Ensure proper sentence spacing (optional enhancement)
    fullText = fullText.replace(/([.!?])\s*([A-Z])/g, '$1 $2');
    
    return fullText;
  }, [chunks]);

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
   */
  const getFinalBlob = useCallback(() => {
    const sortedChunks = [...chunks].sort((a, b) => a.index - b.index);
    const blobs = sortedChunks.map(chunk => chunk.blob).filter(Boolean);
    
    if (blobs.length === 0) return null;
    
    return new Blob(blobs, { type: mimeTypeRef.current || 'audio/webm' });
  }, [chunks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
