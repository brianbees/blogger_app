# 🎙️ Voice Journal PWA

A mobile-first Progressive Web App for recording and organizing voice snippets and images throughout your day. Includes Google Cloud integration for automatic transcription and one-click publishing to Blogger.

## ✅ Completed Stages

- **Stage 1**: Core voice recording with MediaRecorder API
- **Stage 2**: IndexedDB storage, export/import, native Android UI polish
- **Stage 2.5**: Image notes with preview, captions, and full-screen viewer
- **Stage 3**: Google Cloud integrations (OAuth, Speech-to-Text, Drive, Blogger API)

## Features

### Core Functionality
- 🎤 **Voice Recording**: Record audio snippets using device microphone
- 🖼️ **Image Notes**: Upload JPG/PNG images with optional captions
- 📅 **Daily Organization**: Snippets automatically grouped by day (Europe/London timezone)
- 💾 **Local Storage**: Persistent IndexedDB storage (v3 schema)
- 📱 **PWA**: Install as standalone app on mobile devices
- ⚡ **Instant Updates**: Feed refreshes immediately after recording/upload

### UI/UX
- 🎨 **Native Android UI**: Polished mobile interface with greeting header
- ▶️ **Audio Playback**: Custom controls with progress bar
- 📸 **Image Preview**: Slide-up sheet with caption input
- 🔍 **Full-Screen Viewer**: Double-tap zoom, pinch/pan, swipe-down dismiss
- 🔔 **Toast Notifications**: Non-blocking error and info messages

### Data Management  
- 💾 **Export/Import**: Backup to JSON with base64-encoded media
- 🗑️ **Delete**: Remove individual items or clear all data
- 📊 **Storage Quota**: Check available space and usage

### Cloud Integration (Stage 3)
- ☁️ **Google Sign-In**: OAuth2 authentication (client-side only)
- 🎙️ **Auto-Transcribe**: Audio automatically transcribed via Google Speech-to-Text
- 📝 **One-Click Publish**: Publish to Blogger with single tap
- 💿 **Google Drive**: Automatic image upload and backup storage
- 🔐 **No Backend**: All cloud APIs called directly from browser

## Tech Stack

### Frontend
- **Vite 7.3** - Fast build tool and dev server with HMR
- **React 19.2** - UI framework with hooks
- **Tailwind CSS v4** - Utility-first styling
- **vite-plugin-pwa** - Progressive Web App capabilities
- **idb 8.0** - IndexedDB wrapper for storage
- **date-fns-tz** - Timezone handling (Europe/London)

### Browser APIs
- **MediaRecorder API** - Native audio recording
- **IndexedDB** - Persistent client-side storage
- **Service Workers** - Offline support and caching

### Google Cloud APIs (Stage 3)
- **Google Identity Services** - OAuth 2.0 authentication
- **Blogger API v3** - Blog post publishing
- **Google Drive API v3** - File upload and backup
- **Cloud Speech-to-Text API v1** - Audio transcription

### Requirements
- **Google Cloud Project** with:
  - OAuth 2.0 Client ID (Web application)
  - API Key with domain restrictions
  - Enabled APIs: Blogger, Drive, Speech-to-Text
  - Test users added to OAuth consent screen
## Prerequisites

- Node.js 20+
- npm
- Modern browser with MediaRecorder API support

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/brianbees/blogger_app.git
   cd blogger_app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Google Cloud (for Stage 3 features)**:

   a. Create a project at [Google Cloud Console](https://console.cloud.google.com/)
   
   b. Enable the following APIs:
      - Blogger API v3
      - Google Drive API v3
      - Cloud Speech-to-Text API v1
   
   c. Create OAuth 2.0 credentials (Web application):
      - Add authorized JavaScript origins: `http://localhost:5173`, `https://your-domain.com`
      - Add authorized redirect URIs: `http://localhost:5173`, `https://your-domain.com`
   
   d. Create an API Key (restrict to your APIs and domain for security)
   
   e. Copy `.env.example` to `.env` and add your credentials:
   ```bash
   cp .env.example .env
   # Edit .env and add your VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY
   ```

   **Note**: Stage 3 cloud features are optional. The app works fully offline without Google credentials.

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

### Cloud Publishing (Stage 3)

**One-Time Setup**:
1. **Sign In**: Tap the cloud icon (☁️) in the header to open Cloud Sync
2. **Authenticate**: Sign in with your Google account
3. **Select Blog**: Choose a Blogger blog from your account (dropdown)
4. **Done**: Cloud icon turns green (✓) when signed in

**Publishing Workflow**:
1. **Record Audio**: Tap microphone to record, tap again to stop
2. **Auto-Transcribe**: Audio is automatically transcribed in background (shows ⏳)
3. **Publish**: When ready, tap 📝 button to publish to Blogger
4. **Progress**: Brief publishing modal shows:
   - Transcribing audio (if needed)
   - Compressing image (for image notes)
   - Uploading to Drive
   - Publishing to Blogger
5. **Success**: Modal auto-closes, toast shows "Published successfully!" with link

**What Gets Published**:
- **Audio snippets**: Formatted post with timestamp, transcript, and duration
- **Image snippets**: Post with compressed image (hosted on Drive), caption, and timestamp
- **Automatic features**:
  - Images compressed to 1920x1920px before upload
  - Files uploaded to "Voice Journal Backups" folder in Drive
  - Posts tagged with "voice-journal" label
  - Transcript included in post body (hidden from card view)

**Note**: The transcript is not displayed in the app after transcription - it's used directly for publishing.

### Backup to Google Drive
1. **Sign In**: Complete Google sign-in through Cloud Sync
2. **Export Data**: Use the Data Manager to export to Drive
3. **Automatic Folder**: Creates "Voice Journal Backups" folder
4. **Restore**: Download backup and import through Data Manager

## Project Structure

```
src/
  main.jsx              # App entry point with React 19
  App.jsx               # Main app with state management and cloud integration
  index.css             # Tailwind v4 CSS import and global styles
  components/
    Header.jsx          # Greeting header with cloud sync button (green when signed in)
    BottomBar.jsx       # Record and image upload buttons (mic removed)
    RecordPanel.jsx     # Slide-up recording panel
    ImagePreviewSheet.jsx # Image preview with caption input
    ImageViewer.jsx     # Full-screen image viewer with zoom/pan
    Toast.jsx           # Non-blocking toast notifications
    DailyFeed.jsx       # Snippet feed grouped by day
    SnippetCard.jsx     # Audio/image cards with auto-transcribe and publish
    DataManager.jsx     # Export/import/quota management modal
    CloudSync.jsx       # Google sign-in and blog selection
    PublishModal.jsx    # Publishing progress and options
  hooks/
    useMediaRecorder.js # MediaRecorder with duration tracking
  services/
    googleAuth.js       # OAuth2 client-side authentication
    bloggerService.js   # Blogger API v3 integration
    driveService.js     # Google Drive API v3 for uploads
    speechToTextService.js # Cloud Speech-to-Text transcription
  utils/
    id.js               # Unique ID generation
    dateKey.js          # Timezone handling (Europe/London)
    storage.js          # IndexedDB v3 operations
    storageSelfTest.js  # Storage verification
    imageCompression.js # Image resize/compression before upload
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

## Production Deployment

The app is configured for subfolder deployment (e.g., `https://yourdomain.com/blogger/`):

1. **Build**: `npm run build` (outputs to `dist/` folder)
2. **Configure Base Path**: Edit `vite.config.js` and set `base: '/your-subfolder/'`
3. **Upload**: Upload all files from `dist/` to your hosting
4. **Google Cloud Setup**:
   - Add production domain to OAuth authorized origins
   - Add production domain to API Key restrictions
   - Test user must be added to OAuth consent screen during "Testing" phase

**PWA Installation (Mobile)**:
1. Open the app in Chrome/Safari on your phone
2. Tap browser menu → "Add to Home screen" or "Install app"
3. App installs as standalone full-screen app with icon
4. Works offline - can record audio/images without internet
5. Online features (publish, transcribe) require internet connection

## Current Limitations

- Audio format is browser-dependent (typically WebM)
- Images compressed to 1920x1920px before upload
- Speech-to-Text requires Google Cloud billing (free tier: 60 min/month)
- Blogger publishing requires existing Blogger account and blog
- Auto-transcription starts immediately after recording (no manual control)
- Text note feature not implemented (UI placeholder exists)
- No search or filtering
- No custom timezone selection

## Potential Future Enhancements

- Text note support
- Search and filtering
- Custom timezone selection  
- Multiple image upload
- Camera capture (in addition to file picker)
- Image editing (crop, rotate, filters)
- Multi-device sync via Drive
- Offline-first publishing queue
- Manual transcription control
- Draft management

## License

MIT

## Author

Built with GitHub Copilot
