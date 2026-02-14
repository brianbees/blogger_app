import { useEffect, useRef } from 'react';

/**
 * Audio visualizer that displays animated bars based on audio input
 * Uses Web Audio API to analyze audio frequencies
 */
export default function AudioVisualizer({ stream }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    setupCanvas();

    // Setup Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    const analyser = audioContext.createAnalyser();
    analyserRef.current = analyser;
    analyser.fftSize = 256;
    
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Draw visualization
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.fillStyle = 'rgb(254, 242, 242)'; // red-50
      ctx.fillRect(0, 0, width, height);

      const barCount = 40; // Number of bars to display
      const barWidth = width / barCount;
      const barSpacing = 1;

      for (let i = 0; i < barCount; i++) {
        // Sample from different parts of the frequency data
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const barHeight = (dataArray[dataIndex] / 255) * height * 0.8;

        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, 'rgb(220, 38, 38)'); // red-600
        gradient.addColorStop(1, 'rgb(239, 68, 68)'); // red-500

        ctx.fillStyle = gradient;
        
        const x = i * barWidth;
        const y = height - barHeight;

        ctx.fillRect(
          x + barSpacing / 2,
          y,
          barWidth - barSpacing,
          barHeight
        );
      }
    };

    draw();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-24 rounded-lg"
      aria-label="Audio waveform visualization"
    />
  );
}
