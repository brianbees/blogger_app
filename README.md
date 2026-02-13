# 🎙️ Voice Journal PWA

A mobile-first Progressive Web App for recording and organizing voice snippets throughout your day.

## Stage 1: Offline-First Core

This is the Stage 1 implementation, focusing on core offline functionality without any Google integrations.

## Features

- 🎤 **Voice Recording**: Record audio snippets using your device microphone
- 📅 **Daily Organization**: Snippets automatically grouped by day (Europe/London timezone)
- 💾 **Offline Storage**: All data stored locally in IndexedDB
- 📱 **Mobile-First Design**: Optimized for mobile devices with touch-friendly interface
- 🔄 **PWA Support**: Installable as a standalone app
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
  index.css             # Tailwind directives and global styles
  components/
    Header.jsx          # Fixed header with app title
    BottomBar.jsx       # Fixed bottom bar with record button
    RecordPanel.jsx     # Recording state display
    DailyFeed.jsx       # Snippet feed grouped by day
    SnippetCard.jsx     # Individual snippet display with audio player
  hooks/
    useMediaRecorder.js # MediaRecorder logic and state
  utils/
    id.js               # Unique ID generation
    dateKey.js          # Timezone handling (Europe/London)
    storage.js          # IndexedDB operations
```

## Timezone Handling

**Critical**: All snippets are grouped using the **Europe/London timezone**, regardless of the user's device timezone. This ensures consistent day grouping and handles DST correctly.

## Storage

Snippets are stored in IndexedDB with the following schema:

- **Database**: `voice-journal`
- **Store**: `snippets`
- **Fields**:
  - `id` - Unique identifier
  - `createdAt` - Unix timestamp
  - `dayKey` - Date in `yyyy-MM-dd` format (Europe/London)
  - `duration` - Recording duration in seconds
  - `audioBlob` - Audio data as Blob
  - `transcript` - Optional text transcript (null in Stage 1)
  - `syncStatus` - Always "local" in Stage 1

## Browser Support

Requires modern browsers with:
- MediaRecorder API
- IndexedDB
- Service Workers (for PWA)

## Known Limitations (Stage 1)

- No cloud sync or backup
- No transcript generation
- No edit/delete functionality
- No search or filtering
- Audio format is browser-dependent (typically WebM)

## Future Stages

Stage 2+ will add:
- Google Drive backup/sync
- Speech-to-text transcription
- Cloud storage integration
- Multi-device sync

## License

MIT

## Author

Built with GitHub Copilot
