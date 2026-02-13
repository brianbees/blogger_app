import { useState, useEffect } from 'react';
import { exportAllData, importData, clearAllData, checkStorageQuota } from '../utils/storage';

export default function DataManager({ onDataChange, onModalChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [quota, setQuota] = useState(null);

  useEffect(() => {
    if (onModalChange) {
      onModalChange(isOpen);
    }
  }, [isOpen, onModalChange]);

  const closeModal = () => {
    setIsOpen(false);
    setStatus('');
    setQuota(null);
  };

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      setStatus('Exporting...');
      
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatus(`Exported ${data.snippetsCount} recordings successfully`);
    } catch (err) {
      setStatus(`Export failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setStatus('Importing...');
      
      const text = await file.text();
      const data = JSON.parse(text);
      
      const result = await importData(data);
      setStatus(`Import complete: ${result.imported} imported, ${result.skipped} skipped`);
      
      if (onDataChange) {
        onDataChange();
      }
    } catch (err) {
      setStatus(`Import failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL recordings? This cannot be undone.')) {
      return;
    }

    try {
      setIsProcessing(true);
      setStatus('Clearing...');
      
      await clearAllData();
      setStatus('All data cleared successfully');
      
      if (onDataChange) {
        onDataChange();
      }
    } catch (err) {
      setStatus(`Clear failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportClick = () => {
    document.getElementById('import-file-input').click();
  };

  const handleCheckQuota = async () => {
    try {
      const quotaInfo = await checkStorageQuota();
      if (quotaInfo) {
        setQuota(quotaInfo);
      } else {
        setStatus('Storage quota information unavailable');
      }
    } catch (err) {
      setStatus(`Quota check failed: ${err.message}`);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <div className="fixed top-4 right-4 z-30">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-lg hover:bg-gray-50 font-medium min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Data management"
        >
          ⚙️ Data
        </button>
      </div>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="data-modal-title"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="relative z-50 bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            {/* Title */}
            <h2 id="data-modal-title" className="text-xl font-semibold text-gray-900 text-center mb-6">
              Data Management
            </h2>

            {/* Buttons */}
            <div className="space-y-3 mb-4">
              <button
                onClick={handleExport}
                disabled={isProcessing}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-xl">💾</span>
                <span>Export All Data</span>
              </button>

              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isProcessing}
                className="hidden"
                id="import-file-input"
              />
              <button
                onClick={handleImportClick}
                disabled={isProcessing}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl font-medium text-white bg-green-600 hover:bg-green-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-xl">📥</span>
                <span>Import from Backup</span>
              </button>

              <button
                onClick={handleCheckQuota}
                disabled={isProcessing}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl font-medium text-white bg-gray-700 hover:bg-gray-800 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-xl">📊</span>
                <span>Check Storage</span>
              </button>

              <button
                onClick={handleClearAll}
                disabled={isProcessing}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-xl">🗑️</span>
                <span>Clear All Data</span>
              </button>
            </div>

            {/* Status Message */}
            {status && (
              <div 
                className={`p-3 rounded-xl text-sm font-medium mb-4 ${
                  status.includes('failed')
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-green-50 text-green-800 border border-green-200'
                }`}
                role="status"
                aria-live="polite"
              >
                {status}
              </div>
            )}

            {/* Quota Display */}
            {quota && (
              <div className="p-4 bg-gray-50 rounded-xl text-sm border border-gray-200 mb-4">
                <p className="font-semibold text-gray-900 mb-3">Storage Usage</p>
                <div className="space-y-1 mb-3 text-gray-700">
                  <p>Used: {(quota.usage / 1024 / 1024).toFixed(2)} MB</p>
                  <p>Available: {(quota.available / 1024 / 1024).toFixed(2)} MB</p>
                  <p>Total: {(quota.quota / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${quota.isLow ? 'bg-red-500' : 'bg-blue-600'}`}
                    style={{ width: `${quota.percentUsed}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-600 font-medium">
                  {quota.percentUsed.toFixed(1)}% used
                  {quota.isLow && ' - Storage is running low!'}
                </p>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={closeModal}
              className="w-full py-3 px-4 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition min-h-[48px]"
              aria-label="Close data management dialog"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
