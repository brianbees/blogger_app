import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import BottomBar from './components/BottomBar';
import RecordPanel from './components/RecordPanel';
import DailyFeed from './components/DailyFeed';
import DataManager from './components/DataManager';
import ImagePreviewSheet from './components/ImagePreviewSheet';
import ImageViewer from './components/ImageViewer';
import Toast from './components/Toast';
import CloudSync from './components/CloudSync';
import PublishModal from './components/PublishModal';
import MicrophoneSelector from './components/MicrophoneSelector';
import { useMediaRecorder } from './hooks/useMediaRecorder';
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

  const {
    startRecording,
    stopRecording,
    isRecording,
    timer,
    audioBlob,
    duration,
    error,
    isSupported,
    stream,
  } = useMediaRecorder();

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
  }, []);

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
      <Header onCloudSyncClick={handleCloudSyncOpen} isSignedIn={isSignedIn} blogUrl={selectedBlogUrl} />
      <DataManager onDataChange={handleDataChange} onModalChange={setIsModalOpen} />
      
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
          
          <RecordPanel
            isRecording={isRecording}
            timer={timer}
            isSaving={isSaving}
            error={error}
            isSupported={isSupported}
            onStopRecording={stopRecording}
            stream={stream}
          />
          
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
