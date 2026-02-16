# Continuous Recording - Quick Test Checklist

This checklist helps verify the continuous recording feature works correctly.

## Prerequisites

- [ ] Dev server is running (`npm run dev`)
- [ ] Browser open at `https://localhost:5173`
- [ ] Sign in to Google account (optional, for transcription)

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

### 6. Failed Chunk Retry
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

### 7. Sign-Out Behavior
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

All critical tests passed:
- [ ] Can record 2+ minutes continuously
- [ ] Transcript appears progressively in real-time
- [ ] Failed chunks can be retried without data loss
- [ ] Final note contains full transcript and combined audio
- [ ] No console errors during normal operation
- [ ] Memory doesn't grow unbounded

---

**Problems?** See [Troubleshooting](../continuous-recording.md#troubleshooting) section in full documentation.

**Report Issues:** Include browser version, console errors, and steps to reproduce.
