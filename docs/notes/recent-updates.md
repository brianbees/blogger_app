# Recent Updates

## February 2026

### Continuous Recording Feature (NEW!)

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
