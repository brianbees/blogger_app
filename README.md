# 🎙️ Voice Journal PWA

A mobile-first Progressive Web App for recording and organizing voice snippets throughout your day.

## Stage 2: Persistent Storage & Native UI ✅

Fully functional voice recording app with IndexedDB storage, export/import, and polished native Android UI.

## Features

- 🎤 **Voice Recording**: Record audio snippets using device microphone with live waveform
- 📅 **Daily Organization**: Snippets automatically grouped by day (Europe/London timezone)
- 💾 **IndexedDB Storage**: Persistent storage with version management (v2 schema)
- 📱 **Native Android UI**: Greeting header, three-button bar, slide-up recording panel
- ▶️ **Audio Playback**: Custom controls with progress bar and play/pause toggle
- 💾 **Export/Import**: Backup to JSON with base64-encoded audio
- 🗑️ **Delete & Clear**: Remove individual recordings or clear all data
- 📊 **Storage Quota**: Check available space and usage statistics
- ⚡ **Instant Updates**: Feed refreshes immediately after recording

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

1. **Grant Microphone Permission**: On first use, allow microphone access when prompted
2. **Record a Snippet**: Tap the microphone button at the bottom to start recording
3. **Stop Recording**: Tap the button again to stop and save
4. **View Snippets**: Recordings appear in the feed, grouped by day
5. **Playback**: Use the built-in audio player on each snippet card

## Project Structure

```
src/
  main.jsx              # App entry point
  App.jsx               # Main app component with state management
  index.css             # Tailwind v4 CSS import and global styles
  components/
    Header.jsx          # Greeting header with dynamic date
    BottomBar.jsx       # Three-button bar with raised FAB
    RecordPanel.jsx     # Slide-up recording panel with waveform
    DailyFeed.jsx       # Snippet feed grouped by day
    SnippetCard.jsx     # Individual snippet with custom playback controls
    DataManager.jsx     # Export/import/quota management modal
  hooks/
    useMediaRecorder.js # MediaRecorder logic with duration tracking
  utils/
    id.js               # Unique ID generation
    dateKey.js          # Timezone handling (Europe/London)
    storage.js          # IndexedDB v2 operations with error handling
    storageSelfTest.js  # Runtime verification of storage functionality
```

## Timezone Handling

**Critical**: All snippets are grouped using the **Europe/London timezone**, regardless of the user's device timezone. This ensures consistent day grouping and handles DST correctly.

## Storage

Snippets are stored in IndexedDB with the following schema:

- **Database**: `voice-journal` (version 2)
- **Store**: `snippets` (keyPath: 'id')
- **Indexes**: 
  - `dayKey` (non-unique) - Fast date-based queries
  - `createdAt` (non-unique) - Chronological sorting
  - `dataVersion` (non-unique) - Schema version tracking
- **Fields**:
  - `id` - Unique identifier (format: `snippet-{timestamp}-{random}`)
  - `createdAt` - Unix timestamp (milliseconds)
  - `dayKey` - Date in `yyyy-MM-dd` format (Europe/London)
  - `duration` - Recording duration in seconds (captured at stop time)
  - `audioBlob` - Audio data as Blob (typically audio/webm)
  - `transcript` - Optional text transcript (null in Stage 2)
  - `syncStatus` - Always "local" in Stage 2
  - `dataVersion` - Schema version (1)

## Browser Support

Requires modern browsers with:
- MediaRecorder API
- IndexedDB
- Service Workers (for PWA)

## Stage 2 Completion Status

✅ IndexedDB v2 persistent storage  
✅ Export to JSON with base64 audio  
✅ Import from backup with duplicate detection  
✅ Delete individual recordings  
✅ Clear all data  
✅ Storage quota checking  
✅ Native Android UI polish  
✅ Audio playback with progress bar  
✅ Duration capture fix  
✅ Error handling with custom StorageError class  

## Known Limitations (Stage 2)

- No cloud sync or backup (local export/import only)
- No transcript generation
- No text note or image upload features (UI present but not wired)
- No search or filtering
- Audio format is browser-dependent (typically WebM)

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
