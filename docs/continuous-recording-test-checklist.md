# Continuous Recording - Production QA Checklist

This checklist verifies the production-grade continuous recording implementation with sequential transcription, retry logic, memory management, and auto-save.

## Prerequisites

- [ ] Dev server is running (`npm run dev`)
- [ ] Browser open at `https://localhost:5173`
- [ ] Sign in to Google account (for transcription tests)
- [ ] Open browser DevTools Console to monitor logs

## Production Features to Verify

### Sequential Transcription
✅ Chunks processed one at a time  
✅ No parallel API calls  
✅ Strict ordering maintained

### Retry Logic
✅ Exponential backoff (1s → 2s → 4s → 8s)  
✅ Maximum 3 retries per chunk  
✅ No duplicate text on retry

### Memory Management
✅ Blobs released after transcription  
✅ Memory returns to baseline  
✅ Long recordings don't leak

### Draft Auto-Save
✅ Saves every 10 seconds  
✅ Recoverable after crash  
✅ Cleared after successful save

### Browser Stability
✅ Defensive state guards  
✅ Handles disconnections  
✅ Clean error recovery

## Basic Functionality Tests

### 1. Mode Toggle
- [ ] Click recording mode toggle button (top of feed)
- [ ] Verify it shows "🎙️ Continuous Mode (auto-split)"
- [ ] Click again to toggle to "⏺️ Simple Mode"
- [ ] Toggle back to Continuous Mode

### 2. Start Recording
- [ ] Click red microphone button at bottom
- [ ] Grant microphone permission if prompted
- [ ] Verify recording panel appears with:
  - [ ] Red pulsing dot and "CONTINUOUS RECORDING" label
  - [ ] Timer starting (00:00, 00:01, etc.)
  - [ ] Blue hint badge: "Recording auto-splits into 25s chunks"
  - [ ] Waveform visualizer (green bars animating)
  - [ ] Chunk status counter showing "0 chunks"

### 3. Record for 1+ Minute
- [ ] Speak clearly into microphone
- [ ] Continue recording for at least 60 seconds
- [ ] After ~25 seconds, verify:
  - [ ] Chunk counter updates to "1 chunks"
  - [ ] If signed in: Transcript text starts appearing in the box
  - [ ] Status updates (⏳ transcribing → ✓ done)
- [ ] After ~50 seconds, verify:
  - [ ] Chunk counter updates to "2 chunks"
  - [ ] More transcript text appears

### 4. Stop and Save
- [ ] Click "Stop Recording" button
- [ ] Verify recording panel disappears
- [ ] Verify saving indicator appears briefly
- [ ] Verify new snippet appears in today's feed
- [ ] Click snippet to expand
- [ ] Verify:
  - [ ] Audio player is present
  - [ ] Transcript shows (if signed in)
  - [ ] Duration shows correct time (60+ seconds)

## Transcription Tests (Requires Sign-In)

### 5. Progressive Transcription
- [ ] Ensure signed in to Google
- [ ] Start continuous recording
- [ ] Speak: "This is chunk one. Testing transcription service."
- [ ] Wait 30 seconds
- [ ] Verify transcript appears in the recording panel
- [ ] Continue speaking: "This is chunk two. More test content."
- [ ] Wait 30 seconds
- [ ] Verify new text appends to existing transcript
- [ ] Stop recording
- [ ] Open saved snippet
- [ ] Verify full transcript includes both parts

## Error Handling Tests

### 6. Sequential Transcription Verification
**Verify chunks are processed one at a time:**
- [ ] Open browser Console (F12)
- [ ] Start continuous recording (signed in)
- [ ] Speak for 60 seconds (creates 2-3 chunks)
- [ ] Monitor console logs for:
  - [ ] `[Transcription] Processing chunk N` messages appear **one at a time**
  - [ ] Each chunk completes before next starts
  - [ ] No overlapping `Processing chunk` messages
- [ ] Stop recording
- [ ] Verify transcript is complete and in order

### 7. Exponential Backoff Retry
**Simulate API failure to test retry logic:**
- [ ] Open DevTools Console
- [ ] Start recording (signed in)
- [ ] Wait for first chunk (~25s)
- [ ] Go to DevTools Network tab → Enable "Offline" mode
- [ ] Wait for second chunk to fail
- [ ] In Console, verify retry messages:
  - [ ] `Chunk N attempt 1` failed
  - [ ] `Retrying chunk N after 1000ms` (1 second)
  - [ ] `Chunk N attempt 2` failed
  - [ ] `Retrying chunk N after 2000ms` (2 seconds)
  - [ ] `Chunk N attempt 3` failed
  - [ ] `Retrying chunk N after 4000ms` (4 seconds)
  - [ ] `Chunk N attempt 4` failed
  - [ ] Chunk marked as `failed` after 4 attempts
- [ ] Disable "Offline" mode
- [ ] Click "Retry chunk 2" button
- [ ] Verify chunk succeeds and transcript updates
- [ ] Stop and save

### 8. Memory Management Test
**Verify blobs are released after transcription:**
- [ ] Open DevTools → Memory tab
- [ ] Take heap snapshot (baseline)
- [ ] Start continuous recording (signed in)
- [ ] Record for 2 minutes (~5 chunks)
- [ ] Wait for all chunks to transcribe (status: done)
- [ ] In Console, verify logs show: `blob: null` for completed chunks
- [ ] Take second heap snapshot
- [ ] Compare: Blob memory should be minimal (~100KB vs ~2-3MB without cleanup)
- [ ] Stop and save
- [ ] Wait 5 seconds
- [ ] Take third snapshot
- [ ] Verify memory returns to baseline (±5MB)

### 9. Draft Auto-Save Test
**Verify auto-save and recovery:**
- [ ] Clear localStorage (DevTools → Application → Local Storage → Clear)
- [ ] Start continuous recording (signed in)
- [ ] Speak for 30 seconds
- [ ] Wait for first chunk to transcribe
- [ ] In Console, verify: `[Auto-Save] Saving draft transcript (N chars)`
- [ ] Check localStorage: `draftTranscript` and `draftTimestamp` present
- [ ] **Simulate browser crash**: Close all browser tabs (Ctrl+W or close browser)
- [ ] Reopen browser and app
- [ ] **Verify recovery prompt appears**: "Found unsaved recording transcript from N minutes ago..."
- [ ] Preview should match recorded content
- [ ] Click "OK" to recover
- [ ] Verify snippet created with transcript
- [ ] Check localStorage: draft cleared

### 10. Auto-Save Interval Verification
- [ ] Start recording (signed in)
- [ ] Open Console
- [ ] Verify `[Auto-Save] Enabled (every 10 seconds)` message
- [ ] Wait 10 seconds
- [ ] Verify `[Auto-Save] Saving draft transcript` appears
- [ ] Wait another 10 seconds
- [ ] Verify auto-save happens again
- [ ] Stop recording
- [ ] Verify `[Auto-Save] Disabled` message
- [ ] Verify final auto-save occurs on stop
**Simulate network error:**
- [ ] Open browser DevTools (F12)
- [ ] Go to Network tab
- [ ] Start continuous recording (signed in)
- [ ] Wait for first chunk (~25s)
- [ ] In DevTools, enable "Offline" mode
- [ ] Wait for second chunk to fail
- [ ] Verify:
  - [ ] Chunk shows as "✗ failed"
  - [ ] Orange warning box appears
  - [ ] "Retry chunk 2" button is visible
  - [ ] First chunk transcript is still present (not lost)
- [ ] Disable "Offline" mode in DevTools
- [ ] Click "Retry chunk 2" button
- [ ] Verify chunk retries and succeeds
- [ ] Stop and save
- [ ] Verify full transcript includes both chunks

### 11. Defensive State Guards
**Verify state protection:**
- [ ] Try to start recording twice rapidly
- [ ] Console should show: `[Recording] Already recording, ignoring start request`
- [ ] No duplicate recordings or errors
- [ ] Stop recording
- [ ] Try to stop again
- [ ] Console should show: `[Recording] Not recording, ignoring stop request`
- [ ] No errors thrown

### 12. Microphone Disconnection Handling
**Test hardware interruption:**
- [ ] Start recording
- [ ] Physically disconnect microphone (or switch to different device in OS settings)
- [ ] Verify app detects disconnection:
  - [ ] Console logs: `[Recording] Microphone track ended unexpectedly`
  - [ ] Error message appears: "Microphone connection lost"
  - [ ] Recording stops cleanly
  - [ ] Transcript saved (if any chunks completed)
- [ ] Reconnect microphone
- [ ] Verify can start new recording

### 13. No Duplicate Text on Retry
**Verify retry doesn't duplicate transcript:**
- [ ] Start recording (signed in)
- [ ] Wait for first chunk to transcribe successfully
- [ ] Note the transcript text (e.g., "Hello world")
- [ ] Simulate failure for chunk 2 (offline mode)
- [ ] Let it fail all retries
- [ ] Re-enable network
- [ ] Click "Retry chunk 2"
- [ ] Verify chunk 2 transcript appears **once only**
- [ ] Stop recording
- [ ] Final transcript should have **no duplicate sentences**
- [ ] Sign out from Cloud Sync
- [ ] Start continuous recording
- [ ] Verify recording works (no transcription)
- [ ] Stop after 60 seconds
- [ ] Verify snippet saved without transcript
- [ ] Click "Transcribe" button on snippet
- [ ] Verify transcription works post-recording

## Edge Cases

### 8. Very Short Recording
- [ ] Start continuous recording
- [ ] Speak for only 10 seconds
- [ ] Stop immediately
- [ ] Verify saves correctly (1 chunk, <25s duration)

### 9. Rapid Start/Stop
- [ ] Toggle to Continuous Mode
- [ ] Click record, immediately click stop (within 1 second)
- [ ] Verify no errors in console
- [ ] Verify no orphaned snippets

### 10. Mode Toggle Protection
- [ ] Start continuous recording
- [ ] Try to click mode toggle button
- [ ] Verify button is disabled or shows error toast
- [ ] Must stop recording before changing mode

## Performance Tests

### 11. Long Recording (5 Minutes)
- [ ] Start continuous recording
- [ ] Leave running for 5 minutes
- [ ] Monitor chunk counter (should reach ~12 chunks)
- [ ] Verify UI remains responsive
- [ ] Verify transcript updates smoothly
- [ ] Stop and save
- [ ] Verify combined audio plays correctly

### 12. Memory Check
- [ ] Open DevTools → Memory tab
- [ ] Take heap snapshot
- [ ] Record 2-minute continuous recording
- [ ] Save snippet
- [ ] Wait 5 seconds
- [ ] Take another heap snapshot
- [ ] Compare: memory should return to baseline (±5MB)

## Browser Compatibility

### 13. Chrome/Edge
- [ ] All above tests pass
- [ ] Check console: no errors
- [ ] Audio format: check DevTools Network tab for "webm"

### 14. Firefox (if available)
- [ ] Basic recording works
- [ ] Transcription works
- [ ] Check console: no errors
- [ ] Audio format may differ (ogg)

### 15. Safari (macOS/iOS, if available)
- [ ] MediaRecorder initializes
- [ ] Recording works
- [ ] Check audio format in console
- [ ] Playback works

## Acceptance Criteria ✅

### Core Functionality
- [ ] Can record 2+ minutes continuously
- [ ] Transcript appears progressively in real-time
- [ ] Final note contains full transcript and combined audio
- [ ] No console errors during normal operation

### Production-Grade Requirements
- [ ] ✅ Sequential transcription (verified in console logs)
- [ ] ✅ Exponential backoff retry working (1s → 2s → 4s → 8s)
- [ ] ✅ Memory cleanup after transcription (verified in heap snapshots)
- [ ] ✅ Draft auto-save every 10 seconds (verified in console)
- [ ] ✅ Draft recovery after browser crash (tested)
- [ ] ✅ No duplicate text on retry (verified)
- [ ] ✅ Defensive state guards prevent errors (tested)
- [ ] ✅ Microphone disconnection handled gracefully (tested)
- [ ] ✅ Memory returns to baseline after save (±5MB)
- [ ] ✅ Long recordings (5-10 min) remain stable

### Robustness Under Failure
- [ ] ✅ Network failure handled with retry
- [ ] ✅ Failed chunks don't lose prior text
- [ ] ✅ Retry UI appears for failed chunks
- [ ] ✅ Manual retry works correctly
- [ ] ✅ Transcript ordering stable despite retries

### Performance
- [ ] UI remains responsive during transcription
- [ ] No frame drops in waveform visualizer
- [ ] Auto-save doesn't block recording
- [ ] Queue processing doesn't block UI

---

**Problems?** See [Troubleshooting](../continuous-recording.md#troubleshooting) section in full documentation.

**Report Issues:** Include browser version, console errors, and steps to reproduce.
