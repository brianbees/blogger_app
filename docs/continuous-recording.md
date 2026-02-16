# Continuous Recording Feature

## Overview

Voice Journal now supports **continuous recording mode** that allows users to record longer thoughts (2+ minutes) without hitting the 30-second API limit of Google's synchronous Speech-to-Text endpoint.

The feature automatically splits audio into short chunks (25 seconds each), transcribes each chunk independently, and stitches the results into a single cohesive transcript—all while maintaining a seamless user experience.

## How It Works

### 1. Automatic Chunking

When you start a continuous recording:

1. **MediaRecorder** is initialized with a `timeslice` parameter (25,000ms = 25 seconds)
2. Every 25 seconds, the browser automatically fires a `dataavailable` event with a complete audio chunk
3. Each chunk is a valid, playable audio Blob (WebM/Opus format)
4. Chunks are stored in memory with metadata (index, timestamps, status)

### 2. Progressive Transcription

As each chunk is completed:

1. The chunk is immediately sent to Google's Speech-to-Text API (`v1/speech:recognize`)
2. Status updates from `pending` → `transcribing` → `done` (or `failed`)
3. Transcript text is appended to the full transcript in correct order
4. The UI updates in real-time to show the growing transcript

### 3. Error Handling

If a chunk transcription fails:

- **Prior text is preserved** - No data loss
- Chunk status changes to `failed` with error message
- A **retry button** appears for that specific chunk
- Other chunks continue processing normally
- User can retry failed chunks at any time

### 4. Final Stitching

When recording stops:

1. Any remaining audio data is captured as the final chunk
2. All chunk transcripts are joined in order by chunk index
3. Text is cleaned up (extra whitespace, sentence spacing)
4. Combined audio Blob is created from all chunks
5. Saved to IndexedDB as a single note with full transcript

## User Interface

### Recording Mode Toggle

- Located at the top of the feed (when not recording)
- **🎙️ Continuous Mode (auto-split)** - Chunked recording with progressive transcription
- **⏺️ Simple Mode** - Original single-recording mode (max ~60s comfortable)

### During Recording

The continuous recording panel shows:

1. **Timer** - Total recording duration (MM:SS)
2. **Hint Badge** - "Recording auto-splits into 25s chunks for best transcription results"
3. **Waveform Visualizer** - Real-time audio feedback
4. **Chunk Status Counter**:
   - Total chunks created
   - ✓ Done (transcribed successfully)
   - ⏳ Transcribing (in progress)
   - ⋯ Pending (waiting to transcribe)
   - ✗ Failed (error occurred)
5. **Live Transcript Box** - Growing transcript with cursor indicator
6. **Failed Chunk Retry Buttons** - Per-chunk retry UI if errors occur
7. **Stop Recording Button** - Finish and save

### After Recording

- Saved as a single snippet in the daily feed
- Full transcript is available immediately (if all chunks succeeded)
- Metadata stored: total chunks, successful chunks, failed chunks
- Audio playback uses the combined Blob

## Technical Architecture

### Hook: `useContinuousRecorder`

Located at: [`src/hooks/useContinuousRecorder.js`](../src/hooks/useContinuousRecorder.js)

**Key Features:**
- Manages MediaRecorder with 25-second timeslice
- Tracks array of chunk objects with full state
- Auto-transcribes chunks in parallel with recording
- Provides retry functionality for failed chunks
- Exports full transcript and combined audio Blob
- Memory-safe: clears Blobs after saving

**API:**
```javascript
const {
  // State
  isRecording,
  timer,
  chunks,
  error,
  
  // Controls
  startRecording,
  stopRecording,
  retryChunk,
  
  // Utilities
  getFullTranscript,
  getChunkStats,
  getFinalBlob,
} = useContinuousRecorder({ chunkDuration: 25 });
```

### Component: `ContinuousRecordPanel`

Located at: [`src/components/ContinuousRecordPanel.jsx`](../src/components/ContinuousRecordPanel.jsx)

**Responsibilities:**
- Displays recording UI with live updates
- Shows progressive transcript growth
- Renders chunk status indicators
- Provides retry buttons for failed chunks
- Accessible/semantic HTML

### Data Model: `AudioChunk`

```typescript
interface AudioChunk {
  id: string;              // "chunk-{index}-{timestamp}"
  index: number;           // 0-based sequential index
  startTime: number;       // Recording start (ms since epoch)
  endTime: number;         // Recording end (ms since epoch)
  blob: Blob | null;       // Audio data (WebM/Opus)
  status: 'pending' | 'transcribing' | 'done' | 'failed';
  transcript: string;      // Transcribed text
  confidence: number | null; // 0-1 confidence score
  error: string | null;    // Error message if failed
}
```

### Stored Snippet

When saved, includes:
```javascript
{
  id: "snippet-...",
  type: "audio",
  duration: 150,           // Total duration in seconds
  audioBlob: Blob,         // Combined audio from all chunks
  transcript: "...",       // Stitched full transcript
  chunkMetadata: {         // Debug/stats
    totalChunks: 6,
    successfulChunks: 5,
    failedChunks: 1,
  },
  // ...standard fields
}
```

## Browser Compatibility

### Supported Browsers

✅ **Chrome/Edge** (Recommended)
- Full support for MediaRecorder with timeslice
- WebM/Opus encoding
- Tested on Chrome 120+, Edge 120+

✅ **Firefox**
- Full support
- May use different codec (Ogg/Opus)

⚠️ **Safari (iOS/macOS)**
- MediaRecorder support since iOS 14.3, macOS Big Sur
- May have different codec behavior
- Test on actual devices for audio quality

### Known Limitations

1. **MIME Type Variance**
   - Different browsers produce different audio containers
   - Hook auto-detects: `audio/webm;codecs=opus`, `audio/ogg;codecs=opus`, etc.
   - All formats supported by Google Speech-to-Text API

2. **Timeslice Precision**
   - Browser may not split at exactly 25 seconds
   - Variation of ±1-2 seconds is normal
   - Safe margin below 30s API limit

3. **Memory Usage**
   - Each chunk stored in memory during recording
   - 25s of audio ≈ 400-600KB (128kbps)
   - 5 minutes = ~12 chunks = ~7MB in memory
   - Blobs are cleared after saving to IndexedDB

4. **Concurrent Transcription**
   - Multiple chunks may transcribe simultaneously
   - API rate limits managed by Google's infrastructure
   - If rate-limited, chunks enter retry queue automatically

## Manual Testing Checklist

### Basic Functionality

- [ ] Toggle recording mode (continuous ↔ simple)
- [ ] Start continuous recording
- [ ] Verify hint badge shows "auto-splits into 25s chunks"
- [ ] Verify waveform visualizer works
- [ ] Record for 2+ minutes
- [ ] Verify chunk counter increments every ~25 seconds
- [ ] Verify live transcript appears and grows
- [ ] Stop recording
- [ ] Verify saved as single snippet with full transcript

### Transcription

- [ ] Sign in to Google account
- [ ] Start continuous recording (transcription auto-enabled)
- [ ] Speak clearly for 1 minute
- [ ] Verify chunks show "transcribing" then "done" status
- [ ] Verify transcript appears progressively in UI
- [ ] Stop and save
- [ ] Open snippet - verify full transcript saved

### Error Handling

**Simulating Errors:**
1. Enable Network throttling (Chrome DevTools)
2. Start recording with transcription enabled
3. Disable network mid-recording to cause chunk failures

**Expected Behavior:**
- [ ] Failed chunk shows ✗ status
- [ ] Prior transcript text is NOT lost
- [ ] Retry button appears for failed chunk
- [ ] Click retry - chunk re-transcribes
- [ ] Other chunks continue normally
- [ ] Final save includes partial transcript

### Browser-Specific

**Chrome/Edge:**
- [ ] Audio format: WebM/Opus
- [ ] Playback works on snippet card
- [ ] No console errors

**Firefox:**
- [ ] Audio format detected correctly
- [ ] Recording and transcription work
- [ ] No console errors

**Safari (if available):**
- [ ] MediaRecorder initializes
- [ ] Audio records successfully
- [ ] Check audio format in console
- [ ] Playback works

### Edge Cases

- [ ] Record < 25 seconds (only 1 chunk)
- [ ] Record exactly 25 seconds
- [ ] Record 90 seconds (3-4 chunks)
- [ ] Toggle mode during non-recording state
- [ ] Toggle mode when signed out
- [ ] Rapid start/stop cycling
- [ ] Browser tab backgrounded during recording
- [ ] Device goes to sleep (mobile)

### Performance

- [ ] Record for 5 minutes (check memory usage in DevTools)
- [ ] Memory returns to normal after save
- [ ] No memory leaks on multiple recordings
- [ ] UI remains responsive during transcription
- [ ] No frame drops in waveform visualizer

## Configuration

### Adjusting Chunk Duration

Edit `App.jsx`:

```javascript
const continuousRecorder = useContinuousRecorder({
  chunkDuration: 25, // Change to 20-30 seconds max
  autoTranscribe: isSignedIn,
  languageCode: 'en-GB',
});
```

**Safe Range:** 20-30 seconds
- Below 20s: Too many API calls, higher overhead
- Above 30s: Risk hitting API timeout limit

### Changing Language

Update `languageCode` parameter:
```javascript
languageCode: 'en-US', // American English
languageCode: 'es-ES', // Spanish (Spain)
languageCode: 'fr-FR', // French
// See: https://cloud.google.com/speech-to-text/docs/languages
```

### Disabling Auto-Transcription

Set `autoTranscribe: false`:
```javascript
autoTranscribe: false, // User must manually transcribe later
```

## Future Enhancements

Potential improvements:

1. **Pause/Resume** - Implemented in hook, needs UI integration
2. **Background Upload** - Upload chunks to cloud storage as they arrive
3. **Offline Queue** - Queue failed chunks for retry when online
4. **Smart Chunking** - Split at silence/sentence boundaries (requires audio analysis)
5. **Compression** - Compress audio before IndexedDB storage
6. **Export Chunks** - Export individual chunks for debugging
7. **Confidence Threshold** - Warn if low confidence detected
8. **Speaker Diarization** - Identify multiple speakers (premium API feature)

## Troubleshooting

### "Recording auto-splits" hint not showing
- Make sure continuous mode is selected
- Check console for JavaScript errors

### No transcript appearing
- Verify signed in to Google (check Cloud Sync)
- Check browser DevTools Network tab for API errors
- Verify Speech-to-Text API enabled in Google Cloud Console
- Check API key and OAuth credentials

### Chunks always failing
- Check internet connection
- Verify API key is valid (`VITE_GOOGLE_API_KEY` in `.env`)
- Check Google Cloud Console quota/limits
- Check browser console for detailed error messages

### Audio quality poor
- Check microphone settings (Device Settings in app)
- Verify clean microphone (no obstructions)
- Check system audio levels
- Try different browser (Chrome recommended)

### Memory issues on long recordings
- Limit recordings to 5 minutes or less
- Check DevTools Memory tab for leaks
- Report issue with browser/OS details

---

**Related Documentation:**
- [Technical Overview](technical.md)
- [User Guide](user-guide.md)
- [Stage 3 Dev Notes](stage-3-dev-notes.md)
