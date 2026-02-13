export default function BottomBar({ onRecordClick, isRecording, isDisabled, isModalOpen }) {
  return (
    <div className={`fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30 transition-opacity duration-200 ${
      isModalOpen ? 'opacity-40 pointer-events-none' : 'opacity-100'
    }`}>
      <div className="max-w-4xl mx-auto px-4 py-2 flex justify-around items-center">
        {/* Text Note */}
        <button
          className="flex flex-col items-center text-xs text-gray-600 hover:text-gray-900 active:scale-95 transition min-w-[48px] py-2"
          aria-label="Text note"
        >
          <span className="text-2xl mb-1">📝</span>
          <span>Note</span>
        </button>

        {/* Record FAB (Center) */}
        <button
          onClick={onRecordClick}
          disabled={isDisabled}
          className={`
            h-16 w-16 rounded-full flex items-center justify-center
            text-3xl transition-all duration-200 shadow-2xl
            transform active:scale-95 -mt-6
            ${isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-blue-600 hover:bg-blue-700'
            }
            text-white
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? '⏹️' : '🎙️'}
        </button>

        {/* Image Upload */}
        <button
          className="flex flex-col items-center text-xs text-gray-600 hover:text-gray-900 active:scale-95 transition min-w-[48px] py-2"
          aria-label="Image upload"
        >
          <span className="text-2xl mb-1">🖼️</span>
          <span>Image</span>
        </button>
      </div>
    </div>
  );
}
