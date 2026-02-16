import AudioVisualizer from './AudioVisualizer';

export default function RecordPanel({ isRecording, timer, isSaving, error, isSupported, onStopRecording, stream }) {
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
      <div className="fixed inset-x-0 bottom-20 px-4 pb-safe z-20" role="dialog" aria-live="polite" aria-label="Recording in progress">
        <div className="rounded-2xl bg-white shadow-xl p-5 border border-red-100 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" aria-hidden="true"></div>
              <span className="text-sm font-bold text-red-600 uppercase tracking-wide">Recording</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 tabular-nums" aria-label={`Recording time: ${Math.floor(timer / 60)} minutes ${timer % 60} seconds`}>
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </span>
          </div>
          
          {stream ? (
            <div className="mb-5">
              <AudioVisualizer stream={stream} />
            </div>
          ) : (
            <div className="h-2 bg-red-100 rounded-full mb-5 overflow-hidden" role="progressbar" aria-label="Recording waveform">
              <div className="h-full bg-red-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          )}
          
          <button
            onClick={() => {
              console.log('[RecordPanel] 🛑 STOP BUTTON CLICKED');
              onStopRecording();
            }}
            className="w-full rounded-full bg-red-600 hover:bg-red-700 text-white py-3.5 text-base font-semibold active:scale-[0.98] transition-all shadow-lg min-h-[48px]"
            aria-label="Stop recording"
          >
            Stop Recording
          </button>
        </div>
      </div>
    );
  }

  return null;
}
