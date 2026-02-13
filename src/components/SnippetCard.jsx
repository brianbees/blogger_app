import { formatTime } from '../utils/dateKey';
import { useState, useRef, useEffect } from 'react';

export default function SnippetCard({ snippet, onDelete }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const audioUrl = snippet.audioBlob 
    ? URL.createObjectURL(snippet.audioBlob)
    : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [audioUrl]);

  const handleDelete = () => {
    if (window.confirm('Delete this recording?')) {
      onDelete(snippet.id);
    }
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 px-4 py-3 mb-3">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{formatTime(new Date(snippet.createdAt))}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">🎙️ Voice</span>
        </div>
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors"
          title="Delete recording"
          aria-label="Delete recording"
        >
          🗑️
        </button>
      </div>
      
      {audioUrl && (
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handlePlayPause}
            className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-xs text-gray-500">{snippet.duration}s</span>
        </div>
      )}

      {/* Hidden actual audio element */}
      {audioUrl && (
        <audio 
          ref={audioRef}
          className="hidden"
          preload="metadata"
        >
          <source src={audioUrl} type="audio/webm" />
        </audio>
      )}
      
      {snippet.transcript && (
        <p className="mt-3 text-sm text-gray-700">
          {snippet.transcript}
        </p>
      )}
    </div>
  );
}
