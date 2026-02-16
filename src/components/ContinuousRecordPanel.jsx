import AudioVisualizer from './AudioVisualizer';

/**
 * Recording panel for continuous recording mode
 * Shows live transcript, chunk status, and recording controls
 */
export default function ContinuousRecordPanel({
  isRecording,
  timer,
  error,
  isSupported,
  onStopRecording,
  stream,
  chunks,
  fullTranscript,
  chunkStats,
  onRetryChunk,
}) {
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

  if (isRecording) {
    const hasTranscript = fullTranscript && fullTranscript.length > 0;
    const hasFailed = chunkStats.failed > 0;

    return (
      <div className="fixed inset-x-0 bottom-20 px-4 pb-safe z-20" role="dialog" aria-live="polite" aria-label="Recording in progress">
        <div className="rounded-2xl bg-white shadow-xl p-5 border border-red-100 max-w-2xl mx-auto max-h-[70vh] flex flex-col">
          {/* Header with timer */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" aria-hidden="true"></div>
              <span className="text-sm font-bold text-red-600 uppercase tracking-wide">Continuous Recording</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 tabular-nums" aria-label={`Recording time: ${Math.floor(timer / 60)} minutes ${timer % 60} seconds`}>
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </span>
          </div>

          {/* Hint */}
          <div className="mb-3 text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            💡 Recording auto-splits into 25s chunks for best transcription results
          </div>

          {/* Visualizer */}
          {stream ? (
            <div className="mb-4">
              <AudioVisualizer stream={stream} />
            </div>
          ) : (
            <div className="h-2 bg-red-100 rounded-full mb-4 overflow-hidden" role="progressbar" aria-label="Recording waveform">
              <div className="h-full bg-red-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          )}

          {/* Chunk status */}
          <div className="mb-3 flex items-center gap-3 text-xs flex-wrap">
            <span className="text-gray-600">
              <span className="font-semibold">{chunkStats.total}</span> chunks
            </span>
            {chunkStats.done > 0 && (
              <span className="text-green-600">
                ✓ <span className="font-semibold">{chunkStats.done}</span> done
              </span>
            )}
            {chunkStats.transcribing > 0 && (
              <span className="text-blue-600">
                ⏳ <span className="font-semibold">{chunkStats.transcribing}</span> transcribing
              </span>
            )}
            {chunkStats.pending > 0 && (
              <span className="text-gray-500">
                ⋯ <span className="font-semibold">{chunkStats.pending}</span> pending
              </span>
            )}
            {chunkStats.failed > 0 && (
              <span className="text-red-600">
                ✗ <span className="font-semibold">{chunkStats.failed}</span> failed
              </span>
            )}
          </div>

          {/* Live transcript */}
          {hasTranscript && (
            <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200 min-h-[80px] max-h-[200px]">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {fullTranscript}
                {(chunkStats.transcribing > 0 || chunkStats.pending > 0) && (
                  <span className="inline-block ml-1 w-1 h-4 bg-blue-500 animate-pulse align-middle"></span>
                )}
              </p>
            </div>
          )}

          {/* Failed chunks with retry */}
          {hasFailed && (
            <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs text-orange-700 font-medium mb-2">
                ⚠️ Some chunks failed to transcribe
              </p>
              <div className="flex flex-wrap gap-2">
                {chunks
                  .filter(chunk => chunk.status === 'failed')
                  .map(chunk => (
                    <button
                      key={chunk.id}
                      onClick={() => onRetryChunk(chunk.id)}
                      className="text-xs px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-md font-medium transition-colors"
                    >
                      Retry chunk {chunk.index + 1}
                    </button>
                  ))
                }
              </div>
            </div>
          )}

          {/* Stop button */}
          <button
            onClick={onStopRecording}
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
