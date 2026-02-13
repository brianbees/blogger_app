import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import BottomBar from './components/BottomBar';
import RecordPanel from './components/RecordPanel';
import DailyFeed from './components/DailyFeed';
import DataManager from './components/DataManager';
import { useMediaRecorder } from './hooks/useMediaRecorder';
import { generateId } from './utils/id';
import { getDayKey } from './utils/dateKey';
import { saveSnippet, getAllSnippets, deleteSnippet, StorageError } from './utils/storage';

function App() {
  const [snippets, setSnippets] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [storageError, setStorageError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    <div className="flex flex-col h-screen bg-gray-50" style={{ minHeight: '100dvh' }}>
      <Header />
      <DataManager onDataChange={handleDataChange} onModalChange={setIsModalOpen} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-32">
          {storageError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
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
          />
        </div>
      </main>

      <BottomBar
        onRecordClick={handleRecordClick}
        isRecording={isRecording}
        isDisabled={!isSupported || isSaving}
        isModalOpen={isModalOpen}
      />
    </div>
  );
}

export default App;
