# Recent Updates

## February 2026

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
