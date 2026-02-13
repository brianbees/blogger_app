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
    <article className="rounded-xl bg-white shadow-sm border border-gray-100 px-4 py-3 mb-3" aria-label={`Voice recording from ${formatTime(new Date(snippet.createdAt))}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <time className="text-xs text-gray-500" dateTime={new Date(snippet.createdAt).toISOString()}>
            {formatTime(new Date(snippet.createdAt))}
          </time>
          <span className="text-xs text-gray-400" aria-hidden="true">•</span>
          <span className="text-xs text-gray-500">
            <span aria-hidden="true">🎙️</span>
            <span className="sr-only">Voice recording</span>
          </span>
        </div>
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Delete this recording"
          aria-label="Delete this recording"
        >
          <span aria-hidden="true">🗑️</span>
        </button>
      </div>
      
      {audioUrl && (
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={handlePlayPause}
            className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            aria-label={isPlaying ? 'Pause audio playback' : 'Play audio recording'}
            aria-pressed={isPlaying}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress} aria-label="Playback progress">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-100" style={{ width: `${progress}%` }}></div>
          </div>
          <time className="text-xs text-gray-500 font-medium tabular-nums min-w-[32px] text-right">{snippet.duration}s</time>
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
