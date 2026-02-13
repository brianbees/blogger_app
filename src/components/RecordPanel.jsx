export default function RecordPanel({ isRecording, timer, isSaving, error, isSupported, onStopRecording }) {
  if (!isSupported) {
    return (
      <div className="px-4 pb-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <p className="text-red-700 text-center text-sm font-medium">
            ⚠️ Audio recording is not supported in this browser
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pb-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <p className="text-red-700 text-center text-sm font-medium">❌ {error}</p>
        </div>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="px-4 pb-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <p className="text-blue-700 text-center text-sm font-medium">💾 Saving...</p>
        </div>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="fixed inset-x-0 bottom-20 px-4 pb-3 z-20">
        <div className="rounded-2xl bg-white shadow-lg p-4 border border-red-100 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-xs font-medium text-red-500 uppercase tracking-wide">Recording</span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="h-2 bg-red-100 rounded-full mb-3 overflow-hidden">
            <div className="h-full bg-red-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <button
            onClick={onStopRecording}
            className="w-full rounded-full bg-red-600 hover:bg-red-700 text-white py-2 text-sm font-medium active:scale-95 transition"
          >
            Stop Recording
          </button>
        </div>
      </div>
    );
  }

  return null;
}
