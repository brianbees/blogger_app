# Recent Updates

## February 2026

### Image Attachment Storage Fix (2026-02-17)

**Critical Bug Fixed:**
- Images failing to attach to audio recordings
- "Attached to recording" message shown but broken image icon displayed  
- Images being saved but not loaded correctly from IndexedDB

**Root Causes:**
1. **Export/Import logic flaw**: When audio snippet had BOTH `audioBlob` (recording) AND `mediaBlob` (attached image), only `audioBlob` was exported/imported
2. **Insufficient validation**: Blob creation from File not validated for size/integrity
3. **Poor error handling**: Silent failures in image URL creation

**Solutions Implemented:**

**1. Fixed Export Logic (storage.js):**
- Changed from if/else to independent checks for both blobs
- Now exports BOTH `audioBlob` AND `mediaBlob` when present
- Handles audio snippets with attached images correctly

**2. Fixed Import Logic (storage.js):**  
- Independently imports both `audioBlob` and `mediaBlob`
- Uses `typeof === 'string'` check to detect base64-encoded blobs
- Preserves both blobs when importing audio with attached images

**3. Enhanced Image Attachment (App.jsx):**
- Reads file as ArrayBuffer before creating Blob (ensures data is loaded)
- Validates Blob size matches original file size
- Comprehensive logging at each step for debugging
- Fails fast with clear error messages

**4. Improved Error Handling (SnippetCard.jsx):**
- Detailed logging when creating image URLs
- Checks for empty/invalid blobs before URL creation
- Logs blob properties for debugging mobile issues

**5. Defensive Blob Processing (imageUtils.js):**
- Validates blob is actually a Blob object
- Checks blob size is non-zero
- Verifies blob size doesn't change during MIME type recreation
- Returns original blob if recreation fails (graceful degradation)
- Try-catch around all Blob operations

**Technical Details:**
- Audio snippets can now properly have: `audioBlob` (recording) + `mediaBlob` (image) + `mimeType`
- Export/import handles all combinations: audio-only, image-only, audio+image  
- Blob creation validated with ArrayBuffer intermediate step
- All operations logged for mobile debugging

**Files Modified:**
- `src/utils/storage.js` - Fixed export/import for dual-blob snippets
- `src/App.jsx` - Enhanced handleAttachImage with validation
- `src/components/SnippetCard.jsx` - Better error logging for image display
- `src/utils/imageUtils.js` - Defensive blob operations with validation

### Samsung S21 Image Attachment Fix (2026-02-17)

**Problem Fixed:**
- Images not attaching on Samsung S21 and similar mobile devices
- Samsung Camera app and some mobile browsers don't set proper MIME types on File objects
- Validation was rejecting valid images due to missing/incorrect `file.type` property

**Root Causes:**
1. File type validation only checked `file.type` property
2. Samsung devices often provide empty string, `null`, or `'application/octet-stream'` for MIME type
3. No fallback to file extension checking
4. No content-based MIME type detection

**Solutions Implemented:**
- **Dual validation**: Check both MIME type AND file extension (.jpg, .jpeg, .png)
- **Content detection**: Use `detectImageMimeType()` to read file signature (magic bytes) when MIME type is missing
- **Graceful fallback**: Accept images if either validation method succeeds
- **Proper Blob creation**: Always create Blob with explicitly detected MIME type

**Files Modified:**
- `src/components/SnippetCard.jsx` - Enhanced file validation for image attachment to recordings
- `src/App.jsx` - Enhanced validation for both direct image upload and attachment to recordings
- Added `detectImageMimeType` import in both files

**Technical Details:**
- Validates file size before MIME type (faster failure for oversized files)
- Checks file extension as primary mobile compatibility layer
- Falls back to magic byte detection for files without MIME type
- Creates new File/Blob objects with correct MIME type when detected
- Logs detected MIME types for debugging mobile issues

**Mobile Compatibility:**
- Samsung S21 Camera app ✓
- Samsung Internet browser ✓
- Chrome on Android ✓
- Safari on iOS ✓
- All devices with missing MIME type metadata ✓

### Simple Mode Removal - Continuous Recording Only (2026-02-17)

**Simplified User Experience:**
- Removed recording mode toggle/selector from UI
- Removed simple recording mode entirely
- App now uses only continuous recording mode with auto-chunking
- One recording method = simpler, more consistent user experience

**Why Continuous Mode Only:**
- Superior reliability: Built-in recording time limit fix (25s chunks keep MediaRecorder active)
- Auto-transcription: Live transcript during recording (when signed in to Google)
- Auto-save: Draft recovery if browser crashes
- Better mobile experience: Optimized for long recordings on mobile devices
- Works offline: Recording works without sign-in (transcription disabled)

**Removed Code:**
- `src/hooks/useMediaRecorder.js` - No longer used (simple recorder)
- `src/components/RecordPanel.jsx` - No longer used (simple mode UI)
- Recording mode state and toggle logic from App.jsx
- `handleSaveSnippet()` function (simple mode save logic)
- `handleToggleRecordingMode()` function

**Technical Impact:**
- Cleaner codebase: ~200 lines of code removed
- Single code path for recording = easier maintenance
- Consistent behavior across all devices/browsers
- Reduced complexity for users and developers

### Simple Recorder Time Limit Fix (2026-02-17)

**Recording Duration Bug Fixed:**
- Simple recorder now supports unlimited recording duration
- Previous behavior: Recordings would stop after ~25-30 seconds on some browsers
- Root cause: `MediaRecorder.start()` without `timeslice` parameter could cause automatic stop
- Solution: Added 10-second `timeslice` parameter to keep MediaRecorder active
- Implementation: `mediaRecorder.start(10000)` requests data every 10 seconds

**Technical Details:**
- Browser behavior varies without timeslice - some buffer data indefinitely, others stop after first buffer fills
- Continuous recorder already had this fix (25-second chunks for transcription)
- Simple recorder now also uses timeslice purely to keep recording active
- Data chunks are collected and combined into final blob on stop
- No functional changes to user experience, only reliability improvement

**File References:**
- `src/hooks/useMediaRecorder.js:137-139` - Added timeslice parameter with explanation

### Popup-Free UX Implementation (2026-02-17)

**Browser Popups Eliminated:**
- All `alert()` calls replaced with Toast notifications
- All `confirm()` calls replaced with custom ConfirmDialog component
- `window.open()` replaced with programmatic anchor element clicks
- Mobile-friendly UI for all user confirmations

**New ConfirmDialog Component:**
- `src/components/ConfirmDialog.jsx` - Reusable confirmation dialog
- Mobile-optimized with touch targets (48px minimum)
- Backdrop blur with click-to-dismiss
- Keyboard support (Escape key closes)
- Dangerous action styling (red for destructive operations)
- ARIA-compliant for accessibility

**Toast Notification Expansion:**
- Storage quota warnings now use Toast instead of alert()
- Transcription errors show Toast messages
- Image validation errors display as Toast notifications
- Consistent error/success/warning messaging throughout app

**Enhanced Mobile Compatibility:**
- Google OAuth error messages detect popup blockers
- Published blog post links use anchor elements (no popup blocking)
- All confirmations work seamlessly on mobile devices
- No browser permission dialogs except microphone access

**User Confirmation Updates:**
- Draft recovery: Custom dialog with preview
- Delete recording/image: Styled confirmation dialog
- Clear all data: Dangerous action confirmation
- Remove attached image: Confirmation with context

**File References:**
- `src/components/ConfirmDialog.jsx` - New confirmation dialog component
- `src/App.jsx` - Integrated Toast/Dialog state management
- `src/components/DataManager.jsx` - Uses ConfirmDialog for delete all
- `src/components/SnippetCard.jsx` - Toast for errors, Dialog for confirmations
- `src/components/CloudSync.jsx` - Enhanced OAuth error messages
- `src/components/DailyFeed.jsx` - Passes handlers to child components

### Recording Finalization & Security Hardening (2026-02-16)

**Race-Proof MediaRecorder Stop:**
- `useContinuousRecorder.js:stopRecording()` now async/await pattern
- Waits for MediaRecorder `onstop` event before finalizing
- Guarantees final audio chunk is captured
- Prevents empty blob callback when audio exists
- Implementation: Promise wrapper around `onstop` event handler

**Credential-Safe Logging:**
- `googleAuth.js` now logs only presence flags (`hasClientId: true`)
- Never logs actual client IDs, API keys, or tokens
- Error messages sanitized (no credential values in output)
- Production-safe console output for debugging

**PWA Meta Tag Update:**
- `index.html` uses `mobile-web-app-capable` instead of deprecated `apple-mobile-web-app-capable`
- Removes browser deprecation warnings
- Maintains mobile PWA functionality

**Single Snippet Persistence Log:**
- `App.jsx` logs snippet save once with essential metadata only
- Format: `[Snippet] Saved snippet { id, sizeBytes, mime }`
- Removes redundant/verbose logging from callback chain

**File References:**
- `src/hooks/useContinuousRecorder.js:575-625` - Async stop implementation
- `src/services/googleAuth.js:17-22, 334-343` - Safe logging pattern
- `index.html:7` - Meta tag update
- `src/App.jsx:125-132` - Persistence log

### Authentication Persistence Improvements

**Stay Signed In Feature:**
- User-controlled toggle in CloudSync settings
- Automatic token refresh before expiry (5-minute buffer)
- Silent refresh without user interaction or popup
- Session restoration on app reload if enabled

**Token Lifecycle Management:**
- Proactive token refresh 5 minutes before 1-hour expiry
- Scheduled refresh timer prevents mid-use logouts
- Token validation with Google on app initialization
- Graceful fallback to re-authentication if refresh fails

**User Experience:**
- Toggle switch in Cloud Sync modal for "Stay signed in"
- Persistent sessions across browser restarts (if enabled)
- No interruption during long recording/transcription sessions
- Clear preference storage (localStorage)

### Continuous Recording - Production-Grade Refinements

**Sequential Transcription Queue:**
- Chunks now processed strictly one at a time (no parallel API calls)
- Queue-based system ensures ordering integrity
- Prevents rate limiting and race conditions
- Later chunks wait for earlier chunks to complete

**Exponential Backoff Retry Logic:**
- Automatic retry with backoff: 1s → 2s → 4s → 8s (capped)
- Maximum 3 retry attempts per chunk (4 total attempts)
- Preserves transcript ordering during retries
- Prevents duplicate text insertion

**Memory Management:**
- Blob data released after successful transcription
- Memory-safe for long recordings (5-10 minutes)
- Heap memory returns to baseline after save
- Object URLs revoked to prevent leaks

**Draft Auto-Save:**
- Transcript auto-saved to localStorage every 10 seconds
- Browser crash recovery prompt on reload
- Drafts expire after 30 minutes
- Cleared automatically after successful save

**Browser Stability Improvements:**
- Defensive state guards prevent invalid operations
- Microphone disconnection detection and graceful handling
- Tab suspension handled without corruption
- Clean error recovery preserves transcript state

**Cost Documentation:**
- Inline code comments explain API call rates
- 25s chunks = ~2.4 calls/minute
- Balances cost vs. API timeout risk
- Clear rationale for chunk duration choice

### Continuous Recording Feature

- **Continuous Recording Mode**: Record for 2+ minutes without hitting API limits
  - Automatic 25-second chunking using MediaRecorder timeslice
  - Progressive transcription - transcript appears as you record
  - Chunk status tracking (pending, transcribing, done, failed)
  - Per-chunk retry functionality for failed transcriptions
  - Stitches chunks into single note with combined audio and transcript
- **Recording Mode Toggle**: Switch between Simple (original) and Continuous modes
- **Enhanced Recording UI**: 
  - Live transcript display during recording
  - Chunk counter with status indicators (✓ done, ⏳ transcribing, ✗ failed)
  - Retry buttons for failed chunks
  - Auto-split hint badge
- **Error Resilience**: Failed chunks don't lose prior text; users can retry individually
- **Memory Safe**: Clears chunk blobs after saving to prevent memory leaks

See **[Continuous Recording Documentation](../continuous-recording.md)** for full details.

### UI & UX Improvements

- **Audio Visualizer**: Real-time frequency bars during recording using Web Audio API
- **Published Status Tracking**: Snippets marked with `publishedAt` timestamp after publishing
- **Smart Publish Button**: 
  - Green → for ready posts
  - Blue ✓ for published posts (click to view blog post)
  - White ○ waiting, ... transcribing states
  - 🔒 lock icon when not signed in
- **Enhanced Status Banners**: Purple (transcribing), green (ready), blue (published)

### Blog Post Formatting

- Images: 120px max-width for optimal mobile/desktop viewing
- Content order: Image → Caption → Transcript → Date/Time
- Removed "Recording duration" from published posts
- Transcript paragraphs appear before timestamp

### Component Structure

- `AudioVisualizer.jsx`: 40-bar frequency visualization component
- `SnippetCard.jsx`: Unified handling for audio, image, and combined posts with status indicators
- Published posts open blog URL when clicking blue ✓ button
