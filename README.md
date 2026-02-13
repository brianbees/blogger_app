# 🎙️ Voice Journal PWA

A mobile-first Progressive Web App for recording and organizing voice snippets and images throughout your day.

## Stage 2: Persistent Storage & Native UI ✅

Fully functional voice recording app with IndexedDB storage, export/import, and polished native Android UI.

## Stage 2.5: Image Notes ✅

Local-first image capture with preview, captions, and full-screen viewer with zoom/pan.

## Features

- 🎤 **Voice Recording**: Record audio snippets using device microphone with live waveform
- 🖼️ **Image Notes**: Upload JPG/PNG images with optional captions (max 10MB)
- 📸 **Image Preview**: Slide-up sheet with rounded preview and caption input
- 🔍 **Full-Screen Viewer**: Double-tap to zoom, pinch/pan when zoomed, swipe-down dismiss
- 📅 **Daily Organization**: Snippets automatically grouped by day (Europe/London timezone)
- 💾 **IndexedDB Storage**: Persistent storage with version management (v3 schema)
- 📱 **Native Android UI**: Greeting header, three-button bar, slide-up panels
- ▶️ **Audio Playback**: Custom controls with progress bar and play/pause toggle
- 💾 **Export/Import**: Backup to JSON with base64-encoded audio/images
- 🗑️ **Delete & Clear**: Remove individual recordings/images or clear all data
- 📊 **Storage Quota**: Check available space and usage statistics
- ⚡ **Instant Updates**: Feed refreshes immediately after recording/upload
- 🔔 **Toast Notifications**: Non-blocking error and info messages

## Tech Stack

- **Vite** - Fast build tool and dev server
- **React** - UI framework
- **Tailwind CSS** - Utility-first styling
- **vite-plugin-pwa** - Progressive Web App support
- **idb** - IndexedDB wrapper for storage
- **date-fns-tz** - Timezone handling (Europe/London)
- **MediaRecorder API** - Browser audio recording

## Prerequisites

- Node.js 20+
- npm
- Modern browser with MediaRecorder API support

## Installation

1. Clone the repository or navigate to the project directory

2. Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Usage

### Voice Recording
1. **Grant Microphone Permission**: On first use, allow microphone access when prompted
2. **Record a Snippet**: Tap the microphone button at the bottom to start recording
3. **Stop Recording**: Tap the button again to stop and save
4. **View Snippets**: Recordings appear in the feed, grouped by day
5. **Playback**: Use the built-in audio player on each snippet card

### Image Notes
1. **Upload Image**: Tap the image button (🖼️) at the bottom
2. **Select Photo**: Choose a JPG or PNG image from your device (max 10MB)
3. **Add Caption**: Optionally add a caption (up to 200 characters)
4. **Save**: Tap "Save Image" to store the image locally
5. **View**: Images appear in the feed with thumbnails
6. **Full Screen**: Tap any image to open full-screen viewer
7. **Zoom**: Double-tap to zoom in/out, drag to pan when zoomed

## Project Structure

```
src/
  main.jsx              # App entry point
  App.jsx               # Main app component with state management
  index.css             # Tailwind v4 CSS import and global styles
  components/
    Header.jsx          # Greeting header with dynamic date
    BottomBar.jsx       # Three-button bar with raised FAB and image picker
    RecordPanel.jsx     # Slide-up recording panel with waveform
    ImagePreviewSheet.jsx # Image preview with caption input
    ImageViewer.jsx     # Full-screen image viewer with zoom/pan
    Toast.jsx           # Non-blocking toast notifications
    DailyFeed.jsx       # Snippet feed grouped by day
    SnippetCard.jsx     # Audio and image snippet cards with playback/viewer
    DataManager.jsx     # Export/import/quota management modal
  hooks/
    useMediaRecorder.js # MediaRecorder logic with duration tracking
  utils/
    id.js               # Unique ID generation
    dateKey.js          # Timezone handling (Europe/London)
    storage.js          # IndexedDB v3 operations with audio/image support
    storageSelfTest.js  # Runtime verification of storage functionality
```

## Timezone Handling

**Critical**: All snippets are grouped using the **Europe/London timezone**, regardless of the user's device timezone. This ensures consistent day grouping and handles DST correctly.

## Storage

Snippets are stored in IndexedDB with the following schema:

- **Database**: `voice-journal` (version 3)
- **Store**: `snippets` (keyPath: 'id')
- **Indexes**: 
  - `dayKey` (non-unique) - Fast date-based queries
  - `createdAt` (non-unique) - Chronological sorting
  - `timestamp` (non-unique) - For image snippets
  - `type` (non-unique) - Filter by audio/image
  - `dataVersion` (non-unique) - Schema version tracking
- **Fields (Audio Snippet)**:
  - `id` - Unique identifier (format: `snippet-{timestamp}-{random}`)
  - `createdAt` - Unix timestamp (milliseconds)
  - `dayKey` - Date in `yyyy-MM-dd` format (Europe/London)
  - `duration` - Recording duration in seconds
  - `audioBlob` - Audio data as Blob (typically audio/webm)
  - `transcript` - Optional text transcript (null in Stage 2)
  - `syncStatus` - Always "local" in Stage 2
  - `dataVersion` - Schema version (1)
- **Fields (Image Snippet)**:
  - `id` - Unique identifier
  - `type` - "image"
  - `timestamp` - Unix timestamp (milliseconds)
  - `createdAt` - Unix timestamp (milliseconds)
  - `dayKey` - Date in `yyyy-MM-dd` format (Europe/London)
  - `mediaBlob` - Image data as Blob (image/jpeg or image/png)
  - `caption` - Optional caption text (max 200 chars)
  - `syncStatus` - Always "local" in Stage 2
  - `dataVersion` - Schema version (1)

## Browser Support

Requires modern browsers with:
- MediaRecorder API
- IndexedDB
- Service Workers (for PWA)

## Stage 2 Completion Status

✅ IndexedDB v3 persistent storage  
✅ Export to JSON with base64 audio/images  
✅ Import from backup with duplicate detection  
✅ Delete individual recordings/images  
✅ Clear all data  
✅ Storage quota checking  
✅ Native Android UI polish  
✅ Audio playback with progress bar  
✅ Duration capture fix  
✅ Error handling with custom StorageError class  
✅ Image upload with preview and caption  
✅ Full-screen image viewer with zoom/pan  
✅ Toast notifications for errors

## Known Limitations (Stage 2)

- No cloud sync or backup (local export/import only)
- No transcript generation
- No text note feature (UI present but not wired)
- No search or filtering
- Audio format is browser-dependent (typically WebM)
- Image max size 10MB (JPG/PNG only)

## Future Stages

Stage 3 will add:
- Google Drive backup/sync
- Speech-to-text transcription
- Cloud storage integration
- Multi-device sync
- Text note and image upload functionality

## License

MIT

## Author

Built with GitHub Copilot
