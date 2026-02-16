import { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import BottomBar from './components/BottomBar';
import RecordPanel from './components/RecordPanel';
import ContinuousRecordPanel from './components/ContinuousRecordPanel';
import DailyFeed from './components/DailyFeed';
import DataManager from './components/DataManager';
import ImagePreviewSheet from './components/ImagePreviewSheet';
import ImageViewer from './components/ImageViewer';
import Toast from './components/Toast';
import CloudSync from './components/CloudSync';
import PublishModal from './components/PublishModal';
import MicrophoneSelector from './components/MicrophoneSelector';
import { useMediaRecorder } from './hooks/useMediaRecorder';
import { useContinuousRecorder } from './hooks/useContinuousRecorder';
import { generateId } from './utils/id';
import { getDayKey } from './utils/dateKey';
import { saveSnippet, getAllSnippets, deleteSnippet, StorageError } from './utils/storage';
import { initGoogleServices, isSignedIn as checkSignedIn } from './services/googleAuth';

// Image validation constants
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

function App() {
  const [snippets, setSnippets] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [storageError, setStorageError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [viewerImageUrl, setViewerImageUrl] = useState(null);
  const [toast, setToast] = useState(null);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [publishSnippet, setPublishSnippet] = useState(null);
  const [selectedBlogId, setSelectedBlogId] = useState(null);
  const [selectedBlogUrl, setSelectedBlogUrl] = useState(null);
  const [isMicSelectorOpen, setIsMicSelectorOpen] = useState(false);
  const lastSavedBlobRef = useRef(null);
  const lastSavedContinuousRef = useRef(null); // Track continuous recordings
  const draftTranscriptRef = useRef(null); // Store draft transcript for recovery
  
  // Recording mode: 'simple' or 'continuous'
  const [recordingMode, setRecordingMode] = useState(() => {
    return localStorage.getItem('recordingMode') || 'continuous'; // Default to continuous
  });

  // Auto-save callback for continuous recorder
  const handleAutoSave = useCallback((transcript, chunks) => {
    // Save draft to localStorage for recovery in case of browser crash
    draftTranscriptRef.current = transcript;
    try {
      localStorage.setItem('draftTranscript', transcript);
      localStorage.setItem('draftTimestamp', Date.now().toString());
      console.log('[App] Draft auto-saved:', transcript.length, 'chars');
    } catch (err) {
      console.error('[App] Failed to auto-save draft:', err);
    }
  }, []);

  const handleContinuousRecordingComplete = useCallback((recordingData) => {
    console.log('[App] 🎉 handleContinuousRecordingComplete called with:', {
      blobSize: recordingData.blob?.size,
      transcriptLength: recordingData.transcript?.length,
      chunks: recordingData.chunks.length,
      duration: recordingData.duration
    });

    if (!recordingData.blob) {
      console.error('[App] No audio data in recording');
      return;
    }

    const now = new Date();
    const snippet = {
      id: generateId(),
      type: 'audio',
      createdAt: now.getTime(),
      dayKey: getDayKey(now),
      duration: recordingData.duration,
      audioBlob: recordingData.blob,
      transcript: recordingData.transcript || null,
      syncStatus: 'local',
      chunkMetadata: recordingData.chunkMetadata,
    };

    // OPTIMISTIC UI: Add to state immediately
    console.log('[App] ➕ Adding continuous snippet optimistically, ID:', snippet.id);
    setSnippets(prev => [snippet, ...prev]);
    setRefreshTrigger(prev => prev + 1);

    // Save to IndexedDB in background
    saveSnippet(snippet)
      .then(() => {
        console.log('[App] Continuous recording saved to IndexedDB');
        // Clear draft transcript after successful save
        localStorage.removeItem('draftTranscript');
        localStorage.removeItem('draftTimestamp');
        draftTranscriptRef.current = null;
      })
      .catch(err => {
        console.error('[App] Failed to save continuous recording:', err);
        if (err instanceof StorageError) {
          setStorageError(err.message);
          if (err.code === 'QUOTA_EXCEEDED') {
            alert('Storage quota exceeded! Please export your data and free up space.');
          }
        } else {
          setStorageError('Failed to save recording');
        }
      });
  }, []);

  // Simple recorder (original)
  const simpleRecorder = useMediaRecorder();

  // Continuous recorder (new) with auto-save
  const continuousRecorder = useContinuousRecorder({
    chunkDuration: 25, // 25 seconds per chunk
    autoTranscribe: isSignedIn, // Only auto-transcribe if signed in
    languageCode: 'en-GB',
    onAutoSave: handleAutoSave, // Enable auto-save
    onRecordingComplete: (blob) => {
      if (blob && blob.size > 0) {
        const id = Date.now();
        console.log('[Snippet] Saved snippet', { id, sizeBytes: blob.size, mime: blob.type });
      }
      handleContinuousRecordingComplete(blob);
    }, // Direct callback when recording stops
  });

  // Use the active recorder based on mode
  const activeRecorder = recordingMode === 'continuous' ? continuousRecorder : simpleRecorder;
  const {
    startRecording,
    stopRecording,
    isRecording,
    timer,
    error,
    isSupported,
    stream,
  } = activeRecorder;

  // Get audioBlob and duration from appropriate recorder
  const audioBlob = recordingMode === 'simple' ? simpleRecorder.audioBlob : null;
  const duration = recordingMode === 'simple' ? simpleRecorder.duration : 0;

  useEffect(() => {
    loadSnippets();
    // Load saved blog ID and URL from localStorage
    const savedBlogId = localStorage.getItem('selectedBlogId');
    const savedBlogUrl = localStorage.getItem('selectedBlogUrl');
    if (savedBlogId) {
      setSelectedBlogId(savedBlogId);
    }
    if (savedBlogUrl) {
      setSelectedBlogUrl(savedBlogUrl);
    }
    
    // Initialize Google services and check auth state
    initializeGoogleAuth();
    
    // Check for draft transcript from interrupted recording
    checkForDraftRecovery();
  }, []);

  const checkForDraftRecovery = () => {
    try {
      const draftTranscript = localStorage.getItem('draftTranscript');
      const draftTimestamp = localStorage.getItem('draftTimestamp');
      
      if (draftTranscript && draftTimestamp) {
        const ageMinutes = (Date.now() - parseInt(draftTimestamp)) / 1000 / 60;
        
        // Only offer recovery if draft is less than 30 minutes old
        if (ageMinutes < 30) {
          const shouldRecover = confirm(
            `Found unsaved recording transcript from ${Math.round(ageMinutes)} minutes ago. ` +
            `Would you like to recover it?\n\n` +
            `Preview: "${draftTranscript.substring(0, 100)}..."`
          );
          
          if (shouldRecover) {
            // Create a snippet from the draft
            handleRecoverDraft(draftTranscript);
          } else {
            // Clear draft
            localStorage.removeItem('draftTranscript');
            localStorage.removeItem('draftTimestamp');
          }
        } else {
          // Draft too old, clear it
          localStorage.removeItem('draftTranscript');
          localStorage.removeItem('draftTimestamp');
        }
      }
    } catch (err) {
      console.error('[App] Failed to check draft recovery:', err);
    }
  };

  const handleRecoverDraft = async (transcript) => {
    try {
      const now = new Date();
      const snippet = {
        id: generateId(),
        type: 'audio',
        createdAt: now.getTime(),
        dayKey: getDayKey(now),
        duration: 0, // Unknown duration
        audioBlob: null, // No audio blob (transcript only)
        transcript: transcript,
        syncStatus: 'local',
        recovered: true, // Flag to indicate this was recovered
      };

      // OPTIMISTIC UI: Add to state immediately
      setSnippets(prev => [snippet, ...prev]);
      setRefreshTrigger(prev => prev + 1);
      
      // Save to IndexedDB in background
      await saveSnippet(snippet);
      
      showToast('Draft transcript recovered!', 'success');
      
      // Clear draft after successful recovery
      localStorage.removeItem('draftTranscript');
      localStorage.removeItem('draftTimestamp');
    } catch (err) {
      console.error('[App] Failed to recover draft:', err);
      showToast('Failed to recover draft', 'error');
    }
  };

  const initializeGoogleAuth = async () => {
    try {
      await initGoogleServices();
      // Check if user is already signed in
      const signedIn = checkSignedIn();
      setIsSignedIn(signedIn);
    } catch (err) {
      console.error('Failed to initialize Google services:', err);
      // Non-critical error, user can still sign in via CloudSync
    }
  };

  useEffect(() => {
    if (audioBlob && !isRecording && audioBlob !== lastSavedBlobRef.current) {
      console.log('[App] Saving simple recording, audioBlob size:', audioBlob.size);
      handleSaveSnippet();
    }
  }, [audioBlob, isRecording]);

  // Note: continuous recording completion is handled via direct callback
  // (handleContinuousRecordingComplete).

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  const loadSnippets = async () => {
    try {
      const allSnippets = await getAllSnippets();
      console.log('[App] 📋 loadSnippets - About to setSnippets, count:', allSnippets.length, 'last ID:', allSnippets[allSnippets.length-1]?.id);
      setSnippets(allSnippets);
      setStorageError(null);
    } catch (err) {
      if (err instanceof StorageError) {
        setStorageError(err.message);
      } else {
        setStorageError('Failed to load recordings');
      }
    }
  };

  const handleSaveSnippet = async () => {
    if (!audioBlob || audioBlob === lastSavedBlobRef.current) {
      console.log('[App] handleSaveSnippet - Early return:', { hasAudioBlob: !!audioBlob, alreadySaved: audioBlob === lastSavedBlobRef.current });
      return;
    }

    console.log('[App] handleSaveSnippet - Starting save...');
    setIsSaving(true);
    setStorageError(null);
    lastSavedBlobRef.current = audioBlob;

    try {
      const now = new Date();
      const snippet = {
        id: generateId(),
        type: 'audio',
        createdAt: now.getTime(),
        dayKey: getDayKey(now),
        duration,
        audioBlob,
        transcript: null,
        syncStatus: 'local',
      };

      // OPTIMISTIC UI: Add to state immediately
      console.log('[App] ➕ Adding snippet optimistically, ID:', snippet.id);
      setSnippets(prev => [snippet, ...prev]);
      setRefreshTrigger(prev => prev + 1);

      // Save to IndexedDB in background
      await saveSnippet(snippet);
      console.log('[App] handleSaveSnippet - Save complete!');
    } catch (err) {
      console.error('[App] handleSaveSnippet - Error:', err);
      if (err instanceof StorageError) {
        setStorageError(err.message);
        if (err.code === 'QUOTA_EXCEEDED') {
          alert('Storage quota exceeded! Please export your data and free up space.');
        }
      } else {
        setStorageError('Failed to save recording');
      }
    } finally {
      setIsSaving(false);
    }
  };


  const handleSaveContinuousRecording = async () => {
    if (isSaving || continuousRecorder.chunks.length === 0) {
      console.log('[App] handleSaveContinuousRecording - Early return:', { isSaving, chunksLength: continuousRecorder.chunks.length });
      return;
    }

    console.log('[App] handleSaveContinuousRecording - Starting save...');
    setIsSaving(true);
    setStorageError(null);

    try {
      const now = new Date();
      const fullTranscript = continuousRecorder.getFullTranscript();
      const finalBlob = continuousRecorder.getFinalBlob();
      
      if (!finalBlob) {
        throw new Error('No audio data to save');
      }

      console.log('[App] Created final blob, size:', finalBlob.size, 'transcript length:', fullTranscript?.length || 0);

      // Calculate total duration from chunks
      const totalDuration = Math.floor(
        (continuousRecorder.chunks[continuousRecorder.chunks.length - 1]?.endTime - 
         continuousRecorder.chunks[0]?.startTime) / 1000
      );

      const snippet = {
        id: generateId(),
        type: 'audio',
        createdAt: now.getTime(),
        dayKey: getDayKey(now),
        duration: totalDuration || timer,
        audioBlob: finalBlob,
        transcript: fullTranscript || null,
        syncStatus: 'local',
        // Store chunk metadata for debugging/retry
        chunkMetadata: {
          totalChunks: continuousRecorder.chunks.length,
          successfulChunks: continuousRecorder.chunks.filter(c => c.status === 'done').length,
          failedChunks: continuousRecorder.chunks.filter(c => c.status === 'failed').length,
        },
      };

      // OPTIMISTIC UI: Add to state immediately
      console.log('[App] ➕ Adding snippet optimistically, ID:', snippet.id);
      setSnippets(prev => [snippet, ...prev]);
      setRefreshTrigger(prev => prev + 1);

      // Save to IndexedDB in background
      await saveSnippet(snippet);
      
      // Clear draft transcript after successful save
      localStorage.removeItem('draftTranscript');
      localStorage.removeItem('draftTimestamp');
      draftTranscriptRef.current = null;
      
      console.log('[App] handleSaveContinuousRecording - Save complete!');
      
      // Show success message
      const stats = continuousRecorder.getChunkStats();
      if (stats.failed > 0) {
        showToast(`Saved! ${stats.failed} chunk(s) failed to transcribe.`, 'warning');
      } else if (fullTranscript) {
        showToast('Recording saved with transcript!', 'success');
      }
    } catch (err) {
      console.error('[App] handleSaveContinuousRecording - Error:', err);
      if (err instanceof StorageError) {
        setStorageError(err.message);
        if (err.code === 'QUOTA_EXCEEDED') {
          alert('Storage quota exceeded! Please export your data and free up space.');
        }
      } else {
        setStorageError('Failed to save recording');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRecordingMode = () => {
    if (isRecording) {
      showToast('Stop recording before changing mode', 'error');
      return;
    }
    
    const newMode = recordingMode === 'simple' ? 'continuous' : 'simple';
    setRecordingMode(newMode);
    localStorage.setItem('recordingMode', newMode);
    
    const modeLabel = newMode === 'continuous' ? 'Continuous (auto-split)' : 'Simple';
    showToast(`Recording mode: ${modeLabel}`, 'success');
  };

  const handleImageSelect = (file) => {
    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showToast('Please select a JPG or PNG image', 'error');
      return;
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      showToast('Image is too large. Maximum size is 10MB', 'error');
      return;
    }

    setSelectedImageFile(file);
  };

  const handleImageSave = async (imageFile, caption) => {
    setIsSaving(true);
    setStorageError(null);

    try {
      const now = new Date();
      
      const snippet = {
        id: generateId(),
        type: 'image',
        timestamp: now.getTime(),
        createdAt: now.getTime(),
        dayKey: getDayKey(now),
        mediaBlob: imageFile, // File is a subtype of Blob
        caption: caption,
        dataVersion: 1,
        syncStatus: 'local',
      };
      
      // OPTIMISTIC UI: Add to state immediately
      setSnippets(prev => [snippet, ...prev]);
      setRefreshTrigger(prev => prev + 1);
      setSelectedImageFile(null);
      
      // Save to IndexedDB in background
      await saveSnippet(snippet);
      // Don't show success toast, just close the sheet
    } catch (err) {
      console.error('Failed to save image:', err);
      if (err instanceof StorageError) {
        const errorMsg = err.message || 'Unknown storage error';
        setStorageError(errorMsg);
        if (err.code === 'QUOTA_EXCEEDED') {
          showToast('Storage quota exceeded! Please free up space', 'error');
        } else {
          showToast(errorMsg, 'error');
        }
      } else {
        const errorMsg = err.message || 'Unknown error';
        setStorageError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageCancel = () => {
    setSelectedImageFile(null);
  };

  const handleImageViewerOpen = (imageUrl) => {
    setViewerImageUrl(imageUrl);
  };

  const handleImageViewerClose = () => {
    setViewerImageUrl(null);
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleDataChange = () => {
    loadSnippets();
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteSnippet = async (id) => {
    try {
      // OPTIMISTIC UI: Remove from state immediately
      setSnippets(prev => prev.filter(s => s.id !== id));
      setRefreshTrigger(prev => prev + 1);
      
      // Delete from IndexedDB in background
      await deleteSnippet(id);
    } catch (err) {
      if (err instanceof StorageError) {
        setStorageError(err.message);
      } else {
        setStorageError('Failed to delete recording');
      }
    }
  };

  const handleAttachImage = async (snippetId, file) => {
    try {
      // Find the snippet
      const snippet = snippets.find(s => s.id === snippetId);
      if (!snippet) {
        showToast('Snippet not found', 'error');
        return;
      }

      let updatedSnippet;
      if (file) {
        // Add/replace image
        updatedSnippet = {
          ...snippet,
          mediaBlob: file,
          caption: snippet.caption || null,
        };
      } else {
        // Remove image
        updatedSnippet = { ...snippet };
        delete updatedSnippet.mediaBlob;
        delete updatedSnippet.caption;
      }

      // OPTIMISTIC UI: Update state immediately
      setSnippets(prev => prev.map(s => s.id === snippetId ? updatedSnippet : s));
      setRefreshTrigger(prev => prev + 1);

      // Save to IndexedDB in background
      await saveSnippet(updatedSnippet);
    } catch (err) {
      console.error('Failed to attach image:', err);
      showToast('Failed to attach image', 'error');
    }
  };

  const handleTranscriptUpdate = async (id, transcript) => {
    console.log('[App] handleTranscriptUpdate called:', {
      snippetId: id,
      transcriptLength: transcript?.length || 0,
      transcriptPreview: transcript?.substring(0, 50)
    });

    try {
      // Find the snippet BEFORE updating state
      const snippet = snippets.find(s => s.id === id);
      if (!snippet) {
        console.error('[App] Snippet not found:', id);
        return;
      }

      // Create updated snippet with transcript
      const updatedSnippet = { ...snippet, transcript };
      
      // Save to storage FIRST
      console.log('[App] Saving updated snippet to storage:', {
        id: updatedSnippet.id,
        hasTranscript: !!updatedSnippet.transcript,
        transcriptPreview: updatedSnippet.transcript?.substring(0, 50)
      });
      await saveSnippet(updatedSnippet);
      console.log('[App] Snippet saved successfully to storage');
      
      // Then update state
      const updatedSnippets = snippets.map(s => 
        s.id === id ? updatedSnippet : s
      );
      setSnippets(updatedSnippets);
      console.log('[App] State updated with transcript');
      
    } catch (err) {
      console.error('Failed to save transcript:', err);
      showToast('Failed to save transcription', 'error');
    }
  };

  const handleCloudSyncOpen = () => {
    setIsCloudSyncOpen(true);
  };

  const handleCloudSyncClose = () => {
    setIsCloudSyncOpen(false);
    // Reload blog selection when modal closes
    const savedBlogId = localStorage.getItem('selectedBlogId');
    const savedBlogUrl = localStorage.getItem('selectedBlogUrl');
    if (savedBlogId) {
      setSelectedBlogId(savedBlogId);
    }
    if (savedBlogUrl) {
      setSelectedBlogUrl(savedBlogUrl);
    }
  };

  const handleSignInChange = (signedIn) => {
    setIsSignedIn(signedIn);
    if (signedIn) {
      // Reload blog ID after sign-in
      const savedBlogId = localStorage.getItem('selectedBlogId');
      const savedBlogUrl = localStorage.getItem('selectedBlogUrl');
      if (savedBlogId) {
        setSelectedBlogId(savedBlogId);
      }
      if (savedBlogUrl) {
        setSelectedBlogUrl(savedBlogUrl);
      }
    } else {
      setSelectedBlogId(null);
      setSelectedBlogUrl(null);
    }
  };

  const handlePublishClick = (snippet) => {
    console.log('[App] handlePublishClick called with snippet:', {
      id: snippet.id,
      type: snippet.type,
      hasTranscript: !!snippet.transcript,
      transcriptLength: snippet.transcript?.length || 0,
      transcriptPreview: snippet.transcript?.substring(0, 50)
    });

    if (!isSignedIn) {
      showToast('Please sign in to Google to publish', 'error');
      setIsCloudSyncOpen(true);
      return;
    }
    if (!selectedBlogId) {
      showToast('Please select a blog in Cloud Sync settings', 'error');
      setIsCloudSyncOpen(true);
      return;
    }
    setPublishSnippet(snippet);
  };

  const handlePublishSuccess = async (result) => {
    // Mark snippet as published and save
    console.log('[App] Published successfully:', result.url);
    
    try {
      const updatedSnippet = {
        ...publishSnippet,
        publishedAt: Date.now(),
        blogPostUrl: result.url,
      };
      
      // OPTIMISTIC UI: Update state immediately
      setSnippets(prev => prev.map(s => s.id === publishSnippet.id ? updatedSnippet : s));
      setRefreshTrigger(prev => prev + 1);
      
      // Save to IndexedDB in background
      await saveSnippet(updatedSnippet);
    } catch (err) {
      console.error('[App] Failed to mark snippet as published:', err);
    }
    
    setPublishSnippet(null);
  };

  const handlePublishClose = () => {
    setPublishSnippet(null);
  };

  const handleMicSettingsOpen = () => {
    setIsMicSelectorOpen(true);
  };

  const handleMicSettingsClose = () => {
    setIsMicSelectorOpen(false);
  };

  const handleMicDeviceSelect = (deviceId) => {
    // Device is already saved in localStorage by MicrophoneSelector
    showToast('Microphone changed. Try recording again.', 'success');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50" style={{ minHeight: '100dvh' }} role="application">
      <Header 
        onCloudSyncClick={handleCloudSyncOpen} 
        isSignedIn={isSignedIn} 
        blogUrl={selectedBlogUrl} 
      />
      <DataManager onDataChange={handleDataChange} onModalChange={setIsModalOpen} />
      
      {/* Recording mode toggle button */}
      {!isRecording && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <button
            onClick={handleToggleRecordingMode}
            className="text-xs px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors shadow-sm"
            title="Switch recording mode"
          >
            {recordingMode === 'continuous' ? '🎙️ Continuous Mode (auto-split)' : '⏺️ Simple Mode'}
          </button>
        </div>
      )}
      
      <main className="flex-1 overflow-y-auto" role="main">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-32">
          {storageError && (
            <div 
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 shadow-sm"
              role="alert"
              aria-live="assertive"
            >
              <p className="font-semibold">Storage Error</p>
              <p className="text-sm">{storageError}</p>
            </div>
          )}
          
          {recordingMode === 'simple' ? (
            <RecordPanel
              isRecording={isRecording}
              timer={timer}
              isSaving={isSaving}
              error={error}
              isSupported={isSupported}
              onStopRecording={stopRecording}
              stream={stream}
            />
          ) : (
            <ContinuousRecordPanel
              isRecording={isRecording}
              timer={timer}
              error={error}
              isSupported={isSupported}
              onStopRecording={stopRecording}
              stream={stream}
              chunks={continuousRecorder.chunks}
              fullTranscript={continuousRecorder.getFullTranscript()}
              chunkStats={continuousRecorder.getChunkStats()}
              onRetryChunk={continuousRecorder.retryChunk}
            />
          )}
          
          <DailyFeed 
            snippets={snippets} 
            refreshTrigger={refreshTrigger}
            onDeleteSnippet={handleDeleteSnippet}
            onImageClick={handleImageViewerOpen}
            onPublishClick={handlePublishClick}
            onTranscriptUpdate={handleTranscriptUpdate}
            onAttachImage={handleAttachImage}
            isSignedIn={isSignedIn}
          />
        </div>
      </main>

      <BottomBar
        onRecordClick={handleRecordClick}
        isRecording={isRecording}
        isDisabled={!isSupported || isSaving}
        isModalOpen={isModalOpen}
        onImageSelect={handleImageSelect}
      />

      {selectedImageFile && (
        <ImagePreviewSheet
          imageFile={selectedImageFile}
          onSave={handleImageSave}
          onCancel={handleImageCancel}
        />
      )}

      {viewerImageUrl && (
        <ImageViewer
          imageUrl={viewerImageUrl}
          onClose={handleImageViewerClose}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      <CloudSync
        isOpen={isCloudSyncOpen}
        onClose={handleCloudSyncClose}
        onSignInChange={handleSignInChange}
      />

      {publishSnippet && (
        <PublishModal
          isOpen={true}
          onClose={handlePublishClose}
          snippet={publishSnippet}
          blogId={selectedBlogId}
          onSuccess={handlePublishSuccess}
        />
      )}

      <MicrophoneSelector
        isOpen={isMicSelectorOpen}
        onClose={handleMicSettingsClose}
        onDeviceSelect={handleMicDeviceSelect}
      />
    </div>
  );
}

export default App;