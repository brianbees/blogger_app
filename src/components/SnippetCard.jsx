import { formatTime } from '../utils/dateKey';
import { useState, useRef, useEffect } from 'react';
import { transcribeAudio } from '../services/speechToTextService';

export default function SnippetCard({ snippet, onDelete, onImageClick, onPublishClick, isSignedIn, onTranscriptUpdate }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const audioRef = useRef(null);
  
  const audioBlob = snippet.audioBlob;
  const audioUrl = audioBlob ? URL.createObjectURL(audioBlob) : null;

  // Handle image blob URL
  useEffect(() => {
    if (snippet.type === 'image' && snippet.mediaBlob) {
      const url = URL.createObjectURL(snippet.mediaBlob);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [snippet.type, snippet.mediaBlob]);

  // Reset transcribing state when transcript is received
  useEffect(() => {
    if (snippet.transcript && isTranscribing) {
      setIsTranscribing(false);
    }
  }, [snippet.transcript, isTranscribing]);

  // Auto-transcribe audio snippets without transcript
  useEffect(() => {
    const autoTranscribe = async () => {
      if (snippet.type === 'audio' && snippet.audioBlob && !snippet.transcript && !isTranscribing && isSignedIn) {
        setIsTranscribing(true);
        try {
          const result = await transcribeAudio(snippet.audioBlob);
          if (onTranscriptUpdate) {
            onTranscriptUpdate(snippet.id, result.transcript);
          }
        } catch (error) {
          console.error('Auto-transcription error:', error);
          setIsTranscribing(false);
        }
      }
    };
    
    autoTranscribe();
  }, [snippet.type, snippet.audioBlob, snippet.transcript, snippet.id, onTranscriptUpdate, isSignedIn, isTranscribing]);

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
    const message = snippet.type === 'image' ? 'Delete this image?' : 'Delete this recording?';
    if (window.confirm(message)) {
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

  const handleImageCardClick = () => {
    if (snippet.type === 'image' && imageUrl) {
      onImageClick(imageUrl);
    }
  };

  const handlePublish = () => {
    if (onPublishClick) {
      onPublishClick(snippet);
    }
  };

  const handleTranscribe = async () => {
    if (!snippet.audioBlob || isTranscribing) return;

    setIsTranscribing(true);
    try {
      const result = await transcribeAudio(snippet.audioBlob);
      if (onTranscriptUpdate) {
        onTranscriptUpdate(snippet.id, result.transcript);
      }
      // Let the parent update the snippet, which will cause a re-render
    } catch (error) {
      console.error('Transcription error:', error);
      alert(`Transcription failed: ${error.message}`);
      setIsTranscribing(false);
    }
    // Don't set isTranscribing to false here - let it show until the update completes
  };

  // Render Image Snippet
  if (snippet.type === 'image') {
    return (
      <article className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden mb-3" aria-label={`Image from ${formatTime(new Date(snippet.timestamp || snippet.createdAt))}`}>
        <div className="px-4 py-3">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <time className="text-xs text-gray-500" dateTime={new Date(snippet.timestamp || snippet.createdAt).toISOString()}>
                {formatTime(new Date(snippet.timestamp || snippet.createdAt))}
              </time>
              <span className="text-xs text-gray-400" aria-hidden="true">•</span>
              <span className="text-xs text-gray-500">
                <span aria-hidden="true">🖼️</span>
                <span className="sr-only">Image</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              {isSignedIn && onPublishClick && (
                <button
                  onClick={handlePublish}
                  className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="Publish to Blogger"
                  aria-label="Publish to Blogger"
                >
                  <span aria-hidden="true">📝</span>
                </button>
              )}
              <button
                onClick={handleDelete}
                className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Delete this image"
                aria-label="Delete this image"
              >
                <span aria-hidden="true">🗑️</span>
              </button>
            </div>
          </div>
        </div>

        {imageUrl && (
          <div 
            className="cursor-pointer relative group"
            onClick={handleImageCardClick}
          >
            <img 
              src={imageUrl} 
              alt={snippet.caption || 'Uploaded image'} 
              className="w-full h-auto max-h-[200px] object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="text-white text-4xl opacity-0 group-hover:opacity-100 transition-opacity">👁️</span>
            </div>
          </div>
        )}

        {snippet.caption && (
          <div className="px-4 py-3">
            <p className="text-sm text-gray-700">{snippet.caption}</p>
          </div>
        )}
      </article>
    );
  }

  // Render Audio Snippet (existing code)
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
        <div className="flex items-center gap-1">
          {isSignedIn && onPublishClick && (
            <button
              onClick={handlePublish}
              disabled={isTranscribing}
              className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              title={isTranscribing ? "Transcribing..." : "Publish to Blogger"}
              aria-label={isTranscribing ? "Transcribing, please wait" : "Publish to Blogger"}
            >
              <span aria-hidden="true">{isTranscribing ? '⏳' : '📝'}</span>
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Delete this recording"
            aria-label="Delete this recording"
          >
            <span aria-hidden="true">🗑️</span>
          </button>
        </div>
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
      
      {isTranscribing && (
        <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 text-purple-700">
            <span className="animate-pulse">🎤</span>
            <span className="text-sm font-medium">Transcribing audio...</span>
          </div>
        </div>
      )}
    </article>
  );
}
