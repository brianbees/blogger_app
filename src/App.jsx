import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import BottomBar from './components/BottomBar';
import RecordPanel from './components/RecordPanel';
import DailyFeed from './components/DailyFeed';
import DataManager from './components/DataManager';
import ImagePreviewSheet from './components/ImagePreviewSheet';
import ImageViewer from './components/ImageViewer';
import Toast from './components/Toast';
import { useMediaRecorder } from './hooks/useMediaRecorder';
import { generateId } from './utils/id';
import { getDayKey } from './utils/dateKey';
import { saveSnippet, getAllSnippets, deleteSnippet, StorageError } from './utils/storage';

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
  } = useMediaRecorder();

  useEffect(() => {
    loadSnippets();
  }, []);

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

  return (
    <div className="flex flex-col h-screen bg-gray-50" style={{ minHeight: '100dvh' }} role="application">
      <Header />
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
          />
          
          <DailyFeed 
            snippets={snippets} 
            refreshTrigger={refreshTrigger}
            onDeleteSnippet={handleDeleteSnippet}
            onImageClick={handleImageViewerOpen}
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
    </div>
  );
}

export default App;
