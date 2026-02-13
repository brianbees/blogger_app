import { useState, useRef, useEffect } from 'react';

/**
 * Hook for recording audio using MediaRecorder API
 * Handles permissions, browser support, and recording state
 */
export function useMediaRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const mimeTypeRef = useRef(null);

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

    // Try to find a supported MIME type
    if (MediaRecorder.isTypeSupported) {
      const mimeTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg',
        'audio/wav',
      ];

      for (const mimeType of mimeTypes) {
        try {
          if (MediaRecorder.isTypeSupported(mimeType)) {
            mimeTypeRef.current = mimeType;
            break;
          }
        } catch (e) {
          // Continue to next MIME type
        }
      }
    }
  }, []);

  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      streamRef.current = stream;

      // Create MediaRecorder with supported MIME type
      let mediaRecorder;
      if (mimeTypeRef.current) {
        try {
          mediaRecorder = new MediaRecorder(stream, { mimeType: mimeTypeRef.current });
        } catch (e) {
          mediaRecorder = new MediaRecorder(stream);
        }
      } else {
        mediaRecorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        
        setDuration(finalDuration);
        setAudioBlob(blob);
        setBlobUrl(url);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      setTimer(0);
      startTimeRef.current = Date.now();

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setTimer(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

    } catch (err) {
      setError(err.message || 'Failed to access microphone');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Clear timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    timer,
    audioBlob,
    blobUrl,
    duration,
    error,
    isSupported,
  };
}
