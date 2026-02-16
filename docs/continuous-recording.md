# Continuous Recording Feature

## Overview

Voice Journal now supports **continuous recording mode** that allows users to record longer thoughts (2+ minutes) without hitting the 30-second API limit of Google's synchronous Speech-to-Text endpoint.

The feature automatically splits audio into short chunks (25 seconds each), transcribes each chunk **sequentially** with automatic retry logic, and stitches the results into a single cohesive transcript—all while maintaining production-grade robustness and memory efficiency.

## Production-Grade Features

### ✅ Sequential Transcription Queue
- Chunks are transcribed **one at a time** in strict order
- No parallel API calls (prevents rate limiting and ordering issues)
- Later chunks wait for earlier chunks to complete
- Preserves transcript ordering even with delays

### ✅ Exponential Backoff Retry
- Failed chunks automatically retry with backoff: 1s → 2s → 4s → 8s
- Maximum 3 retry attempts per chunk (4 total attempts)
- Successful transcriptions release memory immediately
- Prevents duplicate text insertion during retries

### ✅ Memory Management
- Blob data released after successful transcription
- Object URLs revoked to prevent memory leaks
- Safe for long recordings (5-10 minutes)
- Memory returns to baseline after save

### ✅ Draft Auto-Save
- Transcript auto-saved to localStorage every 10 seconds
- Browser crash recovery: prompts to restore draft on reload
- Drafts expire after 30 minutes
- Cleared automatically after successful save

### ✅ Browser Stability
- Defensive state guards prevent invalid operations
- Handles microphone disconnection gracefully
- Tab suspension detected and handled
- Clean error recovery without state corruption

## How It Works

### 1. Automatic Chunking

When you start a continuous recording:

1. **MediaRecorder** is initialized with a `timeslice` parameter (25,000ms = 25 seconds)
2. Every 25 seconds, the browser automatically fires a `dataavailable` event with a complete audio chunk
3. Each chunk is a valid, playable audio Blob (WebM/Opus format)
4. Chunks are stored in memory with metadata (index, timestamps, status)

**Cost Awareness:**
- Each chunk = 1 Speech-to-Text API call
- At 25s per chunk: ~2.4 API calls/minute
- 5-minute recording = ~12 API calls
- Chunk duration chosen to balance cost vs. timeout risk

### 2. Sequential Transcription Pipeline

Unlike the initial implementation, chunks are now processed **strictly one at a time**:

1. New chunks are added to a transcription queue
2. Queue processor takes the first chunk and transcribes it
3. Only after completion (success or failure), the next chunk is processed
4. This prevents:
   - Parallel API calls that could hit rate limits
   - Out-of-order transcript assembly
   - Race conditions during retries

**Retry Logic:**
- If transcription fails, automatic retry with exponential backoff
- Retry delays: 1s → 2s → 4s → 8s (capped)
- Maximum 3 retries (4 total attempts)
- Failed chunks can be manually retried later

### 3. Memory Management

After successful transcription:

1. **Blob data is released** - Set to `null` to free memory
2. Transcript text is kept (much smaller than audio)
3. Final recording combines remaining blobs (if any)
4. Long sessions (5-10 minutes) don't cause memory growth

**Before:** Each chunk keeps blob → 5 min = ~7MB in memory  
**After:** Blobs released → 5 min = ~100KB in memory

### 4. Draft Auto-Save

While recording:

1. Every 10 seconds, current transcript is saved to `localStorage`
2. Timestamp stored for freshness check
3. If browser crashes/closes, draft is preserved
4. On next app load, prompt to recover draft (if < 30 min old)
5. Draft cleared after successful save or user decline

**Recovery Flow:**
```
App loads → Check localStorage → Draft found
  ↓
Age < 30 min? → Yes → Prompt user to recover
  ↓
User accepts → Create snippet with transcript
  ↓
Clear draft from storage
```

### 5. Error Handling & Browser Stability

**Defensive State Guards:**
- Check recorder state before start/stop/pause/resume
- Prevent operations on invalid states
- Log warnings for debugging

**Microphone Interruption:**
- Detect track ending (device disconnected)
- Show clear error message
- Clean up resources gracefully

**Transcript Integrity:**
- Chunk IDs tracked to prevent duplicate processing
- Retries don't insert duplicate text
- Ordering maintained even with out-of-order retries

**Failure Modes:**
- Network failure → Retry with backoff → Manual retry if needed
- API error → Same as network failure
- Browser crash → Draft recovery on reload
- Tab suspension → Recording state preserved, graceful resume

### 6. Quality and Ordering

**Transcript Stitching:**
1. Chunks sorted by index (0, 1, 2, ...)
2. Only `done` chunks with transcripts included
3. Whitespace normalized (no duplicate spaces)
4. Sentence spacing cleaned up
5. **No duplicate text** - processed chunks tracked in Set

**Final Output:**
```
Chunk 0: "Hello this is a test."
Chunk 1: "This is the second chunk."
Chunk 2: "And here is the final part."

Result: "Hello this is a test. This is the second chunk. And here is the final part."
```

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

**Production-Grade Features:**
- Sequential transcription queue (no parallel API calls)
- Exponential backoff retry logic (1s → 2s → 4s → 8s, max 3 retries)
- Memory-safe blob cleanup after successful transcription
- Draft auto-save every 10 seconds
- Defensive state guards for all operations
- Microphone disconnect detection
- Duplicate prevention during retries

**Key Internal State:**
```javascript
// Transcription queue management
transcriptionQueueRef      // Array of chunk IDs waiting to transcribe
isProcessingQueueRef      // Prevents parallel processing
processedChunkIdsRef      // Set of transcribed chunk IDs (prevents duplicates)

// Retry configuration
MAX_RETRIES = 3           // Maximum retry attempts
BASE_RETRY_DELAY = 1000   // 1 second base delay
MAX_RETRY_DELAY = 8000    // 8 seconds maximum

// Auto-save
autoSaveIntervalRef       // 10-second interval for draft saves
```

**API:**
```javascript
const {
  // State
  isRecording,
  timer,
  chunks,
  error,
  
  // Controls
  startRecording,    // With defensive guards
  stopRecording,     // With state validation
  retryChunk,        // Requeue failed chunk
  
  // Utilities
  getFullTranscript, // Deduplicated, ordered stitching
  getChunkStats,     // Detailed status counts
  getFinalBlob,      // Combined audio (releases memory-safe)
} = useContinuousRecorder({ 
  chunkDuration: 25,
  autoTranscribe: true,
  onAutoSave: callback  // Draft auto-save callback
});
```

**Transcription Flow:**
```
Chunk created → Add to queue
  ↓
Queue processor checks if processing
  ↓
Take first chunk → Mark transcribing
  ↓
Call API → Success? 
  ↓                ↓
 Yes              No
  ↓                ↓
Mark done     Retry count < MAX?
Release blob      ↓           ↓
  ↓              Yes         No
Remove from queue  ↓          ↓
  ↓           Wait backoff  Mark failed
Process next   ↓             Remove from queue
              Retry API
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
  index: number;           // 0-based sequential index (for ordering)
  startTime: number;       // Recording start (ms since epoch)
  endTime: number;         // Recording end (ms since epoch)
  blob: Blob | null;       // Audio data (null after transcription for memory)
  status: 'pending' | 'transcribing' | 'done' | 'failed';
  transcript: string;      // Transcribed text
  confidence: number | null; // 0-1 confidence score
  error: string | null;    // Error message if failed
  retryCount: number;      // Number of retry attempts (for backoff calculation)
}
```

### Stored Snippet

When saved, includes:
```javascript
{
  id: "snippet-...",
  type: "audio",
  duration: 150,           // Total duration in seconds
  audioBlob: Blob,         // Combined audio from chunks (memory-safe)
  transcript: "...",       // Full stitched transcript
  chunkMetadata: {         // Debug/stats
    totalChunks: 6,
    successfulChunks: 5,
    failedChunks: 1,
  },
  recovered: false,        // True if recovered from draft
  // ...standard fields
}
```

### Draft Auto-Save Storage

Stored in `localStorage` while recording:
```javascript
{
  "draftTranscript": "Full transcript text so far...",
  "draftTimestamp": "1708108800000"  // ms since epoch
}
```

**Recovery Logic:**
- Checked on app load
- Offered if < 30 minutes old
- Creates snippet with `recovered: true` flag
- Cleared after save or user decline

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
