import { formatTime } from '../utils/dateKey';
import { useState, useRef, useEffect } from 'react';
import { transcribeAudio } from '../services/speechToTextService';
import { ensureBlobMimeType, detectImageMimeType } from '../utils/imageUtils';

export default function SnippetCard({ snippet, onDelete, onImageClick, onPublishClick, isSignedIn, onTranscriptUpdate, onAttachImage, onShowToast, onShowConfirm }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Debug log to track component state
  useEffect(() => {
    if (snippet.audioBlob) {
      console.log('[SnippetCard] Audio snippet render state:', {
        id: snippet.id,
        type: snippet.type,
        isTranscribing,
        hasTranscript: !!snippet.transcript,
        transcriptLength: snippet.transcript?.length,
        isSignedIn
      });
    }
  });
  
  const audioBlob = snippet.audioBlob;
  const audioUrl = audioBlob ? URL.createObjectURL(audioBlob) : null;

  // Handle image blob URL (for image snippets OR audio snippets with attached image)
  useEffect(() => {
    let mounted = true;
    let createdUrl = null; // Track URL created in THIS effect run
    
    const createImageUrl = async () => {
      if (snippet.mediaBlob) {
        try {
          // Ensure Blob has correct MIME type for mobile compatibility (S21, etc.)
          const blob = await ensureBlobMimeType(snippet.mediaBlob, snippet.mimeType);
          if (mounted) {
            createdUrl = URL.createObjectURL(blob);
            setImageUrl(createdUrl);
          }
        } catch (err) {
          console.error('[SnippetCard] Failed to create image URL:', err);
          if (mounted) {
            setImageUrl(null);
          }
        }
      } else {
        if (mounted) {
          setImageUrl(null);
        }
      }
    };

    createImageUrl();

    return () => {
      mounted = false;
      // Revoke URL created in THIS effect run to prevent memory leaks
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [snippet.mediaBlob, snippet.mimeType]);

  // Reset transcribing state when transcript is received
  useEffect(() => {
    if (snippet.transcript && isTranscribing) {
      console.log('[SnippetCard] Transcript received, resetting isTranscribing:', {
        id: snippet.id,
        transcriptLength: snippet.transcript?.length
      });
      setIsTranscribing(false);
    }
  }, [snippet.transcript, isTranscribing, snippet.id]);

  // Auto-transcribe audio snippets without transcript
  useEffect(() => {
    const autoTranscribe = async () => {
      // Check for audioBlob (works for both type='audio' and combined audio+image)
      if (snippet.audioBlob && !snippet.transcript && !isTranscribing && isSignedIn) {
        console.log('[SnippetCard] ✓ AUTO-TRANSCRIBE STARTING:', {
          id: snippet.id,
          hasAudio: !!snippet.audioBlob,
          hasTranscript: !!snippet.transcript,
          isSignedIn
        });
        setIsTranscribing(true);
        
        // Safety timeout: reset after 60 seconds regardless of outcome
        const timeoutId = setTimeout(() => {
          console.warn('[SnippetCard] Transcription timeout - resetting state');
          setIsTranscribing(false);
        }, 60000);
        
        try {
          const result = await transcribeAudio(snippet.audioBlob);
          clearTimeout(timeoutId);
          console.log('[SnippetCard] ✓ TRANSCRIPTION COMPLETE:', {
            id: snippet.id,
            transcriptLength: result.transcript?.length,
            transcriptPreview: result.transcript?.substring(0, 100)
          });
          if (onTranscriptUpdate) {
            await onTranscriptUpdate(snippet.id, result.transcript);
          }
          // Will be reset by the useEffect watching snippet.transcript
        } catch (error) {
          clearTimeout(timeoutId);
          console.error('[SnippetCard] ❌ AUTO-TRANSCRIPTION ERROR:', error);
          setIsTranscribing(false);
        }
      } else {
        console.log('[SnippetCard] Auto-transcribe check:', {
          id: snippet.id,
          hasAudio: !!snippet.audioBlob,
          hasTranscript: !!snippet.transcript,
          isTranscribing,
          isSignedIn,
          reason: !snippet.audioBlob ? 'no audio blob' : snippet.transcript ? 'already has transcript' : !isSignedIn ? 'not signed in' : isTranscribing ? 'already transcribing' : 'unknown'
        });
      }
    };
    
    autoTranscribe();
  }, [snippet.audioBlob, snippet.transcript, snippet.id, onTranscriptUpdate, isSignedIn, isTranscribing]);

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
    if (onShowConfirm) {
      onShowConfirm({
        title: snippet.type === 'image' ? 'Delete Image?' : 'Delete Recording?',
        message: message,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        dangerous: true,
        onConfirm: () => {
          onDelete(snippet.id);
        }
      });
    } else {
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
    console.log('[SnippetCard] Publish clicked:', {
      id: snippet.id,
      hasTranscript: !!snippet.transcript,
      transcriptLength: snippet.transcript?.length,
      isTranscribing,
      isPublished: !!snippet.publishedAt,
      blogPostUrl: snippet.blogPostUrl
    });
    
    // If already published, open the blog post
    if (snippet.publishedAt && snippet.blogPostUrl) {
      // Use anchor element for better mobile compatibility
      const a = document.createElement('a');
      a.href = snippet.blogPostUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    
    // Otherwise, start the publish flow
    if (onPublishClick) {
      onPublishClick(snippet);
    }
  };

  const handleAttachImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size first (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      if (onShowToast) {
        onShowToast('Image must be less than 10MB', 'error');
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file type - check both MIME type and extension for mobile compatibility
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const fileName = file.name?.toLowerCase() || '';
    const hasValidExtension = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png');
    const hasValidMimeType = file.type && allowedTypes.includes(file.type);

    // On some mobile devices (like Samsung), file.type might be empty or incorrect
    // Accept if either MIME type is valid OR extension is valid
    if (!hasValidMimeType && !hasValidExtension) {
      if (onShowToast) {
        onShowToast('Please select a JPG or PNG image', 'error');
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // If MIME type is missing but extension is valid, detect from file content
    if (!file.type || file.type === '' || file.type === 'application/octet-stream') {
      try {
        const detectedType = await detectImageMimeType(file);
        if (!detectedType) {
          if (onShowToast) {
            onShowToast('Could not verify image format', 'error');
          }
          // Reset input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
        console.log('[SnippetCard] Detected MIME type for file:', detectedType);
      } catch (err) {
        console.error('[SnippetCard] Failed to detect image type:', err);
        // Still allow if extension is valid - let backend handle it
      }
    }

    if (onAttachImage) {
      onAttachImage(snippet.id, file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    if (onShowConfirm) {
      onShowConfirm({
        title: 'Remove Image?',
        message: 'Are you sure you want to remove the attached image?',
        confirmText: 'Remove',
        cancelText: 'Cancel',
        dangerous: true,
        onConfirm: () => {
          if (onAttachImage) {
            onAttachImage(snippet.id, null);
          }
        }
      });
    } else if (onAttachImage) {
      onAttachImage(snippet.id, null);
    }
  };

  const handleTranscribe = async () => {
    if (!snippet.audioBlob || isTranscribing) return;

    setIsTranscribing(true);
    
    // Safety timeout
    const timeoutId = setTimeout(() => {
      console.warn('[SnippetCard] Manual transcription timeout');
      setIsTranscribing(false);
    }, 60000);
    
    try {
      const result = await transcribeAudio(snippet.audioBlob);
      clearTimeout(timeoutId);
      if (onTranscriptUpdate) {
        await onTranscriptUpdate(snippet.id, result.transcript);
      }
      // Will be reset by the useEffect watching snippet.transcript
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Transcription error:', error);
      if (onShowToast) {
        onShowToast(`Transcription failed: ${error.message}`, 'error');
      }
      setIsTranscribing(false);
    }
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
                  className={`p-3 rounded-xl transition-all min-w-[56px] min-h-[56px] flex items-center justify-center shadow-md border-2 ${
                    snippet.publishedAt
                      ? 'bg-blue-500 text-white border-blue-600'
                      : 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 border-green-600 scale-110'
                  }`}
                  title={
                    snippet.publishedAt
                      ? `✓ Published to blog ${new Date(snippet.publishedAt).toLocaleString()}`
                      : "✓ Ready to publish image!"
                  }
                  aria-label={
                    snippet.publishedAt
                      ? "Already published - click to view blog post"
                      : "Ready to publish image to Blogger"
                  }
                >
                  <span aria-hidden="true" className="text-3xl font-bold">
                    {snippet.publishedAt ? '✓' : '→'}
                  </span>
                </button>
              )}
              
              {!isSignedIn && (
                <div className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl min-w-[56px] min-h-[56px] flex items-center justify-center">
                  <span className="text-2xl" title="Sign in to publish">🔒</span>
                </div>
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
        
        {snippet.publishedAt ? (
          <div className="px-4 pb-3">
            <div className="p-4 bg-blue-100 rounded-lg border-2 border-blue-300 shadow-sm">
              <div className="flex items-center gap-3 text-blue-800">
                <span className="text-4xl font-bold">✓</span>
                <div className="flex-1">
                  <span className="text-base font-bold">Published!</span>
                  <p className="text-sm text-blue-700 mt-1">
                    {snippet.blogPostUrl ? 'Click the ✓ button above to view your blog post' : `Published on ${new Date(snippet.publishedAt).toLocaleString()}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : isSignedIn && (
          <div className="px-4 pb-3">
            <div className="p-4 bg-green-100 rounded-lg border-2 border-green-300 shadow-sm">
              <div className="flex items-center gap-3 text-green-800">
                <span className="text-4xl font-bold">✓</span>
                <div className="flex-1">
                  <span className="text-base font-bold">Ready to publish!</span>
                  <p className="text-sm text-green-700 mt-1">Click the → button above to publish to your blog</p>
                </div>
              </div>
            </div>
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
          {(() => {
            // Debug log for button state
            const isReady = !snippet.audioBlob || snippet.transcript;
            const isPublished = !!snippet.publishedAt;
            const buttonState = isPublished ? 'published' : (!snippet.audioBlob ? 'image-ready' : (isTranscribing ? 'transcribing' : (snippet.transcript ? 'audio-ready' : 'waiting')));
            console.log('[SnippetCard] Button state:', {
              id: snippet.id,
              hasAudio: !!snippet.audioBlob,
              hasTranscript: !!snippet.transcript,
              isTranscribing,
              isSignedIn,
              isPublished,
              buttonState,
              isReady
            });
            return null;
          })()}
          
          {isSignedIn && onPublishClick && (
            <button
              onClick={handlePublish}
              disabled={snippet.audioBlob && (isTranscribing || !snippet.transcript)}
              className={`p-3 rounded-xl transition-all min-w-[56px] min-h-[56px] flex items-center justify-center shadow-md border-2 ${
                snippet.publishedAt
                  ? 'bg-blue-500 text-white border-blue-600'
                  : ((!snippet.audioBlob || snippet.transcript) && !isTranscribing
                    ? 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 border-green-600 scale-110' 
                    : 'bg-white text-gray-400 border-gray-300 cursor-not-allowed')
              }`}
              title={
                snippet.publishedAt
                  ? `✓ Published to blog ${new Date(snippet.publishedAt).toLocaleString()}`
                  : !snippet.audioBlob
                    ? "✓ Ready to publish image!"
                    : isTranscribing 
                      ? "Transcribing audio..." 
                      : snippet.transcript 
                        ? "✓ Ready to publish to your blog!" 
                        : "○ Waiting for transcription..."
              }
              aria-label={
                snippet.publishedAt
                  ? "Already published - click to view blog post"
                  : !snippet.audioBlob
                    ? "Ready to publish image to Blogger"
                    : isTranscribing 
                      ? "Transcribing, please wait" 
                      : snippet.transcript 
                        ? "Ready to publish to Blogger" 
                        : "Waiting for transcription"
              }
            >
              <span aria-hidden="true" className="text-3xl font-bold">
                {snippet.publishedAt ? '✓' : (!snippet.audioBlob ? '→' : (isTranscribing ? '...' : (snippet.transcript ? '→' : '○')))}
              </span>
            </button>
          )}
          
          {!isSignedIn && (
            <div className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl min-w-[56px] min-h-[56px] flex items-center justify-center">
              <span className="text-2xl" title="Sign in to publish">🔒</span>
            </div>
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

      {/* Image attachment section */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileSelect}
        className="hidden"
      />

      {imageUrl ? (
        <div className="mt-3 relative group">
          <img 
            src={imageUrl} 
            alt="Attached to recording" 
            className="w-full h-auto max-h-[200px] object-cover rounded-lg"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg opacity-90 hover:opacity-100 transition-opacity"
            title="Remove image"
            aria-label="Remove attached image"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      ) : (
        onAttachImage && (
          <button
            onClick={handleAttachImageClick}
            className="mt-3 w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600 flex items-center justify-center gap-2"
            title="Attach image to this recording"
            aria-label="Attach image to this recording"
          >
            <span aria-hidden="true" className="text-xl font-bold">+</span>
            <span className="text-sm font-medium">Add Image</span>
          </button>
        )
      )}
      
      {isTranscribing && (
        <div className="mt-3 p-4 bg-purple-100 rounded-lg border-2 border-purple-300 shadow-sm">
          <div className="flex items-center gap-3 text-purple-800">
            <span className="animate-pulse text-4xl font-bold">⋯</span>
            <div className="flex-1">
              <span className="text-base font-bold">Transcribing audio...</span>
              <p className="text-sm text-purple-700 mt-1">Please wait while we convert speech to text</p>
            </div>
          </div>
        </div>
      )}
      
      {snippet.publishedAt ? (
        <div className="mt-3 p-4 bg-blue-100 rounded-lg border-2 border-blue-300 shadow-sm">
          <div className="flex items-center gap-3 text-blue-800">
            <span className="text-4xl font-bold">✓</span>
            <div className="flex-1">
              <span className="text-base font-bold">Published!</span>
              <p className="text-sm text-blue-700 mt-1">
                {snippet.blogPostUrl ? 'Click the ✓ button above to view your blog post' : `Published on ${new Date(snippet.publishedAt).toLocaleString()}`}
              </p>
            </div>
          </div>
        </div>
      ) : (
        !isTranscribing && snippet.transcript && (
          <div className="mt-3 p-4 bg-green-100 rounded-lg border-2 border-green-300 shadow-sm">
            <div className="flex items-center gap-3 text-green-800">
              <span className="text-4xl font-bold">✓</span>
              <div className="flex-1">
                <span className="text-base font-bold">Transcript ready!</span>
                <p className="text-sm text-green-700 mt-1">Click the → button above to publish to your blog</p>
              </div>
            </div>
          </div>
        )
      )}
    </article>
  );
}
