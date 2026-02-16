# Recent Updates

## February 2026

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
