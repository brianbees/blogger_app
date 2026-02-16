# Recent Updates

## February 2026

### Continuous Recording - Production-Grade Refinements (NEW!)

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
