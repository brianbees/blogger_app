import { useState, useEffect, useRef } from 'react';
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

  // Simple recorder (original)
  const simpleRecorder = useMediaRecorder();

  // Continuous recorder (new) with auto-save
  const continuousRecorder = useContinuousRecorder({
    chunkDuration: 25, // 25 seconds per chunk
    autoTranscribe: isSignedIn, // Only auto-transcribe if signed in
    languageCode: 'en-GB',
    onAutoSave: handleAutoSave, // Enable auto-save
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

  // For simple recorder
  const audioBlob = simpleRecorder.audioBlob;
  const duration = simpleRecorder.duration;

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

      await saveSnippet(snippet);
      await loadSnippets();
      setRefreshTrigger(prev => prev + 1);
      
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
      handleSaveSnippet();
    }
  }, [audioBlob, isRecording]);

  // Handle continuous recording completion
  useEffect(() => {
    if (recordingMode === 'continuous' && !continuousRecorder.isRecording && continuousRecorder.chunks.length > 0) {
      handleSaveContinuousRecording();
    }
  }, [recordingMode, continuousRecorder.isRecording, continuousRecorder.chunks.length]);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  const loadSnippets = async () => {
    try {
      const allSnippets = await getAllSnippets();
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
    if (!audioBlob || audioBlob === lastSavedBlobRef.current) return;

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

      await saveSnippet(snippet);
      
      await loadSnippets();
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
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
    if (isSaving || continuousRecorder.chunks.length === 0) return;

    setIsSaving(true);
    setStorageError(null);

    try {
      const now = new Date();
      const fullTranscript = continuousRecorder.getFullTranscript();
      const finalBlob = continuousRecorder.getFinalBlob();
      
      if (!finalBlob) {
        throw new Error('No audio data to save');
      }

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

      await saveSnippet(snippet);
      
      await loadSnippets();
      setRefreshTrigger(prev => prev + 1);
      
      // Clear draft transcript after successful save
      localStorage.removeItem('draftTranscript');
      localStorage.removeItem('draftTimestamp');
      draftTranscriptRef.current = null;
      
      // Show success message
      const stats = continuousRecorder.getChunkStats();
      if (stats.failed > 0) {
        showToast(`Saved! ${stats.failed} chunk(s) failed to transcribe.`, 'warning');
      } else if (fullTranscript) {
        showToast('Recording saved with transcript!', 'success');
      }
    } catch (err) {
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
      
      await saveSnippet(snippet);
      
      await loadSnippets();
      setRefreshTrigger(prev => prev + 1);
      setSelectedImageFile(null);
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
      await deleteSnippet(id);
      await loadSnippets();
      setRefreshTrigger(prev => prev + 1);
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

      if (file) {
        // Add/replace image
        const updatedSnippet = {
          ...snippet,
          mediaBlob: file,
          caption: snippet.caption || null,
        };
        await saveSnippet(updatedSnippet);
      } else {
        // Remove image
        const updatedSnippet = { ...snippet };
        delete updatedSnippet.mediaBlob;
        delete updatedSnippet.caption;
        await saveSnippet(updatedSnippet);
      }

      // Reload snippets
      await loadSnippets();
      setRefreshTrigger(prev => prev + 1);
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
      await saveSnippet(updatedSnippet);
      await loadSnippets();
      setRefreshTrigger(prev => prev + 1);
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
