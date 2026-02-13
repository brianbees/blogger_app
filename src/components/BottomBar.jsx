export default function BottomBar({ onRecordClick, isRecording, isDisabled, isModalOpen }) {
  return (
    <nav 
      className={`fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30 transition-opacity duration-200 pb-safe ${
        isModalOpen ? 'opacity-40 pointer-events-none' : 'opacity-100'
      }`}
      role="navigation"
      aria-label="Primary actions"
    >
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-around items-center">
        {/* Text Note */}
        <button
          className="flex flex-col items-center text-xs text-gray-600 hover:text-gray-900 active:scale-95 transition min-w-[56px] min-h-[56px] justify-center rounded-lg hover:bg-gray-50"
          aria-label="Create text note"
          disabled={isModalOpen}
        >
          <span className="text-2xl mb-1" aria-hidden="true">📝</span>
          <span className="font-medium">Note</span>
        </button>

        {/* Record FAB (Center) */}
        <button
          onClick={onRecordClick}
          disabled={isDisabled || isModalOpen}
          className={`
            h-16 w-16 rounded-full flex items-center justify-center
            text-3xl transition-all duration-200 shadow-2xl
            transform active:scale-[0.92] -mt-8 ring-4 ring-white
            ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-600 hover:bg-blue-700'
            }
            text-white
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-4 focus:ring-blue-300
          `}
          aria-label={isRecording ? 'Recording in progress. Tap to stop' : 'Start voice recording'}
          aria-pressed={isRecording}
        >
          <span aria-hidden="true">{isRecording ? '⏹️' : '🎙️'}</span>
        </button>

        {/* Image Upload */}
        <button
          className="flex flex-col items-center text-xs text-gray-600 hover:text-gray-900 active:scale-95 transition min-w-[56px] min-h-[56px] justify-center rounded-lg hover:bg-gray-50"
          aria-label="Upload image"
          disabled={isModalOpen}
        >
          <span className="text-2xl mb-1" aria-hidden="true">🖼️</span>
          <span className="font-medium">Image</span>
        </button>
      </div>
    </nav>
  );
}
