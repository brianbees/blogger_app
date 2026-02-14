import { useState, useEffect } from 'react';

/**
 * MicrophoneSelector Component
 * 
 * Allows user to select which microphone/audio input device to use
 */
export default function MicrophoneSelector({ isOpen, onClose, onDeviceSelect }) {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get list of devices
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = deviceInfos.filter(device => device.kind === 'audioinput');
      
      setDevices(audioInputs);
      
      // Get currently selected device (default)
      const currentDeviceId = localStorage.getItem('selectedMicrophoneId');
      if (currentDeviceId) {
        setSelectedDeviceId(currentDeviceId);
      } else if (audioInputs.length > 0) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (deviceId) => {
    setSelectedDeviceId(deviceId);
    localStorage.setItem('selectedMicrophoneId', deviceId);
    if (onDeviceSelect) {
      onDeviceSelect(deviceId);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mic-selector-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="mic-selector-title" className="text-xl font-semibold text-gray-900">
            Select Microphone
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-2"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading microphones...
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No microphones found
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((device) => (
                <button
                  key={device.deviceId}
                  onClick={() => handleSelect(device.deviceId)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedDeviceId === device.deviceId
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {selectedDeviceId === device.deviceId ? '🎤' : '⚪'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {device.label || `Microphone ${devices.indexOf(device) + 1}`}
                      </p>
                      {device.deviceId === 'default' && (
                        <p className="text-sm text-gray-500">System default</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
