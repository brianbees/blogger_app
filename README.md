# 🎙️ Voice Journal PWA

A mobile-first Progressive Web App for recording and organizing voice snippets and images throughout your day.

## Stage 2: Persistent Storage & Native UI ✅

Fully functional voice recording app with IndexedDB storage, export/import, and polished native Android UI.

## Stage 2.5: Image Notes ✅

Local-first image capture with preview, captions, and full-screen viewer with zoom/pan.

## Stage 3: Cloud Integrations ✅

Client-side Google API integrations for publishing, backup, and transcription - no backend required!

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
- ☁️ **Google Sign-In**: OAuth2 authentication for cloud services
- 📝 **Blogger Publishing**: Publish voice notes and images as blog posts
- 🎙️ **Speech-to-Text**: Transcribe audio recordings to text (Google Cloud Speech-to-Text)
- 💿 **Google Drive Backup**: Upload images and backup data to Google Drive
- 🔐 **Client-Side Only**: All cloud APIs called directly from browser - no backend required

## Tech Stack

- **Vite** - Fast build tool and dev server
- **React** - UI framework
- **Tailwind CSS** - Utility-first styling
- **vite-plugin-pwa** - Progressive Web App support
- **idb** - IndexedDB wrapper for storage
- **date-fns-tz** - Timezone handling (Europe/London)
- **MediaRecorder API** - Browser audio recording

- **Google Cloud Project** (for Stage 3 cloud features):
  - Google Cloud Console account
  - OAuth 2.0 Client ID
  - API Key
  - Enabled APIs: Blogger, Google Drive, Cloud Speech-to-Text
## Prerequisites

- Node.js 20+
- npm
- Modern browser with MediaRecorder API support

## Installation

1. 

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
1. **Sign In**: Tap the cloud icon in the header and sign in with Google
2. **Select Blog**: Choose a Blogger blog from your account
3. **Publish**: Tap the 📝 button on any snippet to publish to Blogger
4. **Options**: Customize title, labels, and choose draft/publish
5. **Automatic Features**:
   - Audio recordings are automatically transcribed
   - Images are uploaded to Google Drive
   - Blog post includes transcript, images, and timestamp

### Backup to Google Drive
1. **Sign In**: Complete Google sign-in through Cloud Sync
2. **Export Data**: Use the Data Manager to export to Drive
3. **Automatic Folder**: Creates "Voice Journal Backups" folder
4. **Restore**: Download backup and import through Data Manager

## Project Structure

```
src/
  main.jsx              # App entry point
  App.jsx               # Main app component with state management
  index.css             # Tailwind v4 CSS import and global styles
  components/
    Header.jsx          # Greeting header with dynamic date and cloud sync button
    BottomBar.jsx       # Three-button bar with raised FAB and image picker
    RecordPanel.jsx     # Slide-up recording panel with waveform
    ImagePreviewSheet.jsx # Image preview with caption input
    ImageViewer.jsx     # Full-screen image viewer with zoom/pan
    Toast.jsx           # Non-blocking toast notifications
    DailyFeed.jsx       # Snippet feed grouped by day
    SnippetCard.jsx     # Audio and image snippet cards with publish button
    DataManager.jsx     # Export/import/quota management modal
    CloudSync.jsx       # Google sign-in and cloud settings modal
    PublishModal.jsx    # Blogger publishing interface
  hooks/
    useMediaRecorder.js # MediaRecorder logic with duration tracking
  services/
    googleAuth.js       # OAuth2 client-side authentication
    bloggerService.js   # Blogger API v3 integration
    driveService.js     # Google Drive API v3 for backup/images
    speechToTextService.js # Cloud Speech-to-Text transcription
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

✅ Audio format is browser-dependent (typically WebM)
- Image max size 10MB (JPG/PNG only)
- Speech-to-Text requires Google Cloud billing (free tier available)
- Blogger publishing requires existing Blogger account and blog
✅ Native Android UI polish  
✅ Audio playback with progress bar  
✅ Duration capture fix  
✅ Error haEnhancements

Potential future features:
- Text note support (UI placeholder exists)
- Search and filtering
- Custom timezone selection
- Image compression before storage
- Multiple image upload
- Camera capture (in addition to file picker)
- Image editing (crop, rotate, filters)
- Multi-device sync via Drive
- Offline-first publishing queueport only)
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
