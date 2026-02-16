# Voice Journal - Technical Documentation

Technical reference for Voice Journal PWA architecture, data structures, and implementation details.

> **Note**: For recent updates and changes, see [Recent Updates](notes/recent-updates.md).

## Table of Contents

- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Data Storage](#data-storage)
- [API Integration](#api-integration)
- [Component Structure](#component-structure)
- [Browser Requirements](#browser-requirements)

---

## Architecture

### Client-Side Only Architecture

Voice Journal is a **fully client-side Progressive Web App** with no backend server:

```
┌─────────────────────────────────────────────────────┐
│                   Browser Client                     │
├─────────────────────────────────────────────────────┤
│  React App (Single Page Application)                │
│  ┌───────────────────────────────────────────────┐  │
│  │  Components (UI Layer)                        │  │
│  │  - Header, BottomBar, Feed, Cards, Modals    │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Services (Business Logic)                    │  │
│  │  - Google Auth, Blogger, Drive, Speech-to-Text│  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Storage Layer (IndexedDB)                    │  │
│  │  - Local-first data persistence              │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Browser APIs                                 │  │
│  │  - MediaRecorder, Blob, ImageCompression     │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
                         ├──> Google Cloud APIs (OAuth2, REST)
                         │    - Blogger API v3
                         │    - Drive API v3
                         │    - Speech-to-Text API v1
                         │
                         └──> Service Worker (Offline caching)
```

### Data Flow

**Voice Recording Flow:**
```
User taps record
  → MediaRecorder starts capturing
  → User stops
  → Blob created
  → Save to IndexedDB
  → Render in feed
  → (If signed in) Auto-transcribe
  → Show publish button
```

**Publishing Flow:**
```
User taps publish
  → Check authentication
  → Transcribe audio (if needed)
  → Compress image (if image note)
  → Upload to Drive (if image)
  → Create blog post HTML
  → POST to Blogger API
  → Show success toast
```

---

## Technology Stack

### Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| **React** | 19.2.0 | UI framework with hooks |
| **React DOM** | 19.2.0 | DOM rendering |
| **Vite** | 7.3.1 | Build tool and dev server |
| **Tailwind CSS** | 4.0.19 | Utility-first styling |

### Storage & Data

| Package | Version | Purpose |
|---------|---------|---------|
| **idb** | 8.0.1 | IndexedDB wrapper (Promise-based) |
| **date-fns-tz** | 3.2.0 | Timezone handling (Europe/London) |

### PWA Support

| Package | Version | Purpose |
|---------|---------|---------|
| **vite-plugin-pwa** | 1.2.0 | Service worker generation |
| **workbox-window** | 7.3.0 | Service worker lifecycle |

### Development

| Package | Version | Purpose |
|---------|---------|---------|
| **@vitejs/plugin-react** | 4.3.4 | React Fast Refresh |
| **@vitejs/plugin-basic-ssl** | 1.2.0 | HTTPS dev server |
| **ESLint** | 9.18.0 | Code linting |
| **PostCSS** | 8.4.49 | CSS processing |

### Browser APIs (Native)

- **MediaRecorder API** - Audio recording
- **IndexedDB** - Client-side database
- **Service Workers** - Offline caching and PWA
- **Canvas API** - Image compression
- **Fetch API** - HTTP requests to Google APIs
- **Web Crypto API** - OAuth token handling (via Google Identity Services)

---

## Data Storage

### IndexedDB Schema

**Database Name:** `voice-journal`  
**Version:** 3  
**Object Store:** `snippets`

#### Indexes

| Index Name | Key Path | Unique | Purpose |
|------------|----------|--------|---------|
| `dayKey` | `dayKey` | No | Fast day-based queries |
| `createdAt` | `createdAt` | No | Chronological sorting |
| `timestamp` | `timestamp` | No | Image snippet timestamp |
| `type` | `type` | No | Filter by audio/image |
| `dataVersion` | `dataVersion` | No | Schema versioning |

#### Audio Snippet Schema

```typescript
interface AudioSnippet {
  id: string;                // Format: "snippet-{timestamp}-{random}"
  type?: "audio";            // Optional type field
  createdAt: number;         // Unix timestamp (milliseconds)
  dayKey: string;            // Format: "YYYY-MM-DD" (Europe/London TZ)
  duration: number;          // Recording duration (seconds)
  audioBlob: Blob;           // Audio data (typically audio/webm)
  transcript: string | null; // Text from Speech-to-Text (null if not transcribed)
  syncStatus: "local";       // Always "local" (future: "synced", "pending")
  dataVersion: 1;            // Schema version for migrations
}
```

#### Image Snippet Schema

```typescript
interface ImageSnippet {
  id: string;                // Format: "snippet-{timestamp}-{random}"
  type: "image";             // Required for image snippets
  timestamp: number;         // Unix timestamp (milliseconds)
  createdAt: number;         // Same as timestamp
  dayKey: string;            // Format: "YYYY-MM-DD" (Europe/London TZ)
  mediaBlob: Blob;           // Image data (image/jpeg or image/png)
  caption: string | null;    // Optional caption (max 200 chars)
  syncStatus: "local";       // Always "local"
  dataVersion: 1;            // Schema version
}
```

### Timezone Handling

**Critical**: All snippets use **Europe/London timezone** regardless of user's device timezone.

```javascript
import { toZonedTime, format } from 'date-fns-tz';

const TIMEZONE = 'Europe/London';

function getDayKey(timestamp) {
  const zonedDate = toZonedTime(timestamp, TIMEZONE);
  return format(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
}
```

**Why Europe/London?**
- Consistent day grouping across users
- Handles BST/GMT transitions automatically
- No user configuration needed

### Storage Operations

**Key operations** (`src/utils/storage.js`):

```javascript
// Initialize database
export async function initDB()

// Save audio snippet
export async function saveSnippet(snippetData)

// Save image snippet  
export async function saveImageSnippet(snippetData)

// Get all snippets
export async function getAllSnippets()

// Get snippets by day
export async function getSnippetsByDay(dayKey)

// Delete snippet
export async function deleteSnippet(id)

// Clear all data
export async function clearAllData()

// Get storage quota
export async function getStorageQuota()
```

---

## API Integration

### Google OAuth 2.0

**Implementation:** `src/services/googleAuth.js`

**Flow:**
1. Load Google Identity Services library
2. Initialize OAuth client with Client ID
3. Request access token with scopes
4. Store token in localStorage with expiry timestamp
5. Automatically refresh token 5 minutes before expiry
6. Restore session on app load if "Stay signed in" enabled

**Token Lifecycle Management:**
- **Token Expiry**: 1 hour (3600 seconds)
- **Refresh Window**: 5 minutes before expiry
- **Auto-Refresh**: Scheduled timer refreshes token proactively
- **Silent Refresh**: Hidden iframe refresh without user interaction
- **Session Persistence**: User preference stored in localStorage

**Scopes Required:**
```javascript
const SCOPES = [
  'https://www.googleapis.com/auth/blogger',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];
```

**Key Functions:**
- `initGoogleServices()` - Load and initialize OAuth, restore session
- `requestAccessToken()` - Trigger sign-in flow with expiry tracking
- `ensureValidToken()` - Get valid token (auto-refresh if expiring)
- `scheduleTokenRefresh()` - Set timer to refresh before expiry
- `silentTokenRefresh()` - Refresh token without user prompt
- `validateToken()` - Verify token validity with Google
- `getStaySignedInPreference()` / `setStaySignedInPreference()` - User preference
- `signOut()` - Revoke token, clear timers and session

**Security:**
- **Credential-Safe Logging**: Console logs never expose client IDs, API keys, or tokens
- Implementation (src/services/googleAuth.js:17-22, 334-343):
  ```javascript
  console.log('[Auth] Checking credentials', {
    hasClientId: !!GOOGLE_CLIENT_ID,  // Boolean only
    hasApiKey: !!GOOGLE_API_KEY,       // Boolean only
  });
  ```
- Error messages sanitized to remove credential values
- Production-safe debugging output

### Blogger API v3

**Implementation:** `src/services/bloggerService.js`

**Endpoints Used:**
- `GET /users/self/blogs` - List user's blogs
- `POST /blogs/{blogId}/posts` - Create blog post

**Post Format:**
```json
{
  "kind": "blogger#post",
  "title": "Generated from snippet",
  "content": "<html>...</html>",
  "labels": ["voice-journal"]
}
```

**HTML Generation:**
- Timestamp with formatting
- Embedded image (if image note)
- Transcript text (if audio note)
- Duration metadata
- Caption/blockquote

**Key Functions:**
- `getUserBlogs()` - Fetch user's blog list
- `publishPost(blogId, snippet, transcript, imageUrl, options)` - Create post

### Google Drive API v3

**Implementation:** `src/services/driveService.js`

**Endpoints Used:**
- `POST /drive/v3/files` - Create folder
- `GET /drive/v3/files?q=...` - Search for app folder
- `POST /upload/drive/v3/files?uploadType=multipart` - Upload file
- `POST /drive/v3/files/{fileId}/permissions` - Make file public

**Upload Process:**
1. Compress image to 1920x1920px @ 85% quality
2. Create multipart form with metadata + file blob
3. Upload to "Voice Journal Backups" folder
4. Make file publicly readable
5. Return direct link: `https://drive.google.com/uc?export=view&id={fileId}`

**Key Functions:**
- `uploadImage(imageBlob, fileName, description)` - Upload compressed image
- `uploadBackup(backupData, fileName)` - Upload JSON backup
- `getAppFolder()` - Find or create app folder

### Cloud Speech-to-Text API v1

**Implementation:** `src/services/speechToTextService.js`

**Endpoint:**
- `POST /v1/speech:recognize`

**Request Format:**
```json
{
  "config": {
    "encoding": "WEBM_OPUS",
    "sampleRateHertz": 48000,
    "languageCode": "en-GB",
    "maxAlternatives": 1,
    "enableAutomaticPunctuation": true
  },
  "audio": {
    "content": "base64-encoded-audio"
  }
}
```

**Processing:**
1. Convert audio Blob to base64
2. Send to API with config
3. Concatenate all transcript alternatives
4. Return full transcript text

**Key Functions:**
- `transcribeAudio(audioBlob)` - Simple transcription
- `transcribeAudioWithProgress(audioBlob, onProgress)` - With progress callback

---

## Component Structure

### File Organization

```
src/
├── main.jsx                      # React entry point
├── App.jsx                       # Main app container (850+ lines)
├── index.css                     # Tailwind imports + global styles
│
├── components/
│   ├── Header.jsx                # Greeting + cloud button (green when signed in)
│   ├── BottomBar.jsx             # Record + image buttons
│   ├── RecordPanel.jsx           # Slide-up panel during recording
│   ├── DailyFeed.jsx             # Day-grouped snippet list
│   ├── SnippetCard.jsx           # Audio/image card with publish button
│   ├── ImagePreviewSheet.jsx     # Image upload preview with caption
│   ├── ImageViewer.jsx           # Full-screen image viewer (zoom/pan)
│   ├── DataManager.jsx           # Export/import/quota modal
│   ├── CloudSync.jsx             # Google sign-in + blog selection
│   ├── PublishModal.jsx          # Publishing progress UI
│   ├── Toast.jsx                 # Toast notification system
│   └── MicrophoneSelector.jsx    # Audio device selection (unused)
│
├── hooks/
│   └── useMediaRecorder.js       # MediaRecorder hook (duration, device)
│
├── services/
│   ├── googleAuth.js             # OAuth 2.0 client-side auth
│   ├── bloggerService.js         # Blogger API integration
│   ├── driveService.js           # Drive API integration
│   └── speechToTextService.js    # Speech-to-Text API
│
└── utils/
    ├── id.js                     # Unique ID generation
    ├── dateKey.js                # Timezone utilities
    ├── storage.js                # IndexedDB operations
    ├── storageSelfTest.js        # Storage verification
    └── imageCompression.js       # Canvas-based image resize
```

### Component Hierarchy

```
App
├── Header (cloud button)
├── RecordPanel (conditional)
├── ImagePreviewSheet (conditional)
├── ImageViewer (conditional)
├── Toast (notifications)
├── main
│   └── DailyFeed
│       └── SnippetCard[] (audio/image cards)
│           ├── Audio player
│           ├── Publish button (📝)
│           └── Delete button (🗑️)
├── BottomBar (record + image buttons)
├── DataManager (modal)
├── CloudSync (modal)
└── PublishModal (modal)
```

### State Management

**App-level state** (in `App.jsx`):
- `snippets` - All snippets from IndexedDB
- `isRecording` - Recording in progress
- `isSignedIn` - Google authentication status
- `selectedBlogId` - Selected Blogger blog
- `isCloudSyncOpen` - Cloud sync modal visibility
- `publishSnippet` - Snippet being published
- `toast` - Toast notification state
- `imagePreview` - Image preview state
- `fullscreenImage` - Fullscreen viewer state

**No global state library** (Redux, Zustand, etc.) - Props and callbacks only.

---

## Browser Requirements

### Required APIs

| API | Purpose | Fallback |
|-----|---------|----------|
| **MediaRecorder** | Audio recording | None - required for core feature |
| **IndexedDB** | Persistent storage | None - required for data persistence |
| **Service Workers** | PWA offline support | App works without, but no offline caching |
| **Canvas API** | Image compression | Skip compression, upload original |
| **Blob** | Binary data handling | None - required |

### Browser Compatibility

**Fully Supported:**
- Chrome 80+ (desktop & mobile)
- Edge 80+
- Safari 14+ (iOS & macOS)
- Firefox 75+
- Opera 67+

**Limited Support:**
- Safari < 14: No MediaRecorder (use polyfill or disable)
- Firefox < 75: Limited PWA support
- IE 11: Not supported (no ES6+ support)

### Feature Detection

```javascript
// Check MediaRecorder support
const isSupported = 'MediaRecorder' in window;

// Check IndexedDB support
const hasIndexedDB = 'indexedDB' in window;

// Check Service Worker support
const hasSW = 'serviceWorker' in navigator;
```

### Audio Formats

**MediaRecorder produces different codecs per browser:**
- Chrome/Edge: `audio/webm` (Opus codec)
- Firefox: `audio/ogg` (Opus codec)
- Safari: `audio/mp4` (AAC codec)

**App handles all formats** - stored as Blob, browser plays natively.

---

## Performance Considerations

### Audio Recording

- **Sample rate**: 48 kHz (high quality)
- **Bitrate**: 128 kbps
- **Codec**: Browser-dependent (Opus/AAC)
- **File size**: ~1 MB per minute

### Image Compression

**Before upload:**
- Resize to max 1920x1920px (maintains aspect ratio)
- Convert to JPEG at 85% quality
- **Typical reduction**: 4MB → 400KB (90% smaller)

### IndexedDB

- **Reads**: ~10ms for getAllSnippets()
- **Writes**: ~20ms for saveSnippet()
- **Storage limit**: Browser-dependent (usually 50% of available disk)
- **Quota API**: Check via `navigator.storage.estimate()`

### Service Worker Caching

**Precached assets:**
- HTML, CSS, JS files (on install)
- Icons, manifest

**Not cached:**
- IndexedDB data (already local)
- Google API responses (always fresh)

---

## Security Considerations

### OAuth 2.0

- **Implicit flow**: Access tokens in browser (no refresh tokens)
- **Token storage**: localStorage (XSS risk - acceptable for client-side app)
- **Token expiry**: 50 minutes (Google default: 60 min)
- **Scope restriction**: Minimal scopes requested

### API Key Exposure

- **Client-side visible**: API key in JavaScript (expected for web apps)
- **Mitigation**: Restrict key to authorized domains (HTTP referrer restrictions)
- **Google APIs**: Require API key + OAuth token for sensitive operations

### Content Security Policy

**Recommended CSP header:**
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' https://accounts.google.com https://apis.google.com;
  connect-src 'self' https://www.googleapis.com https://accounts.google.com;
  img-src 'self' data: blob: https://*.googleusercontent.com;
  style-src 'self' 'unsafe-inline';
```

### HTTPS Requirement

- **Development**: Self-signed cert (localhost)
- **Production**: Valid SSL cert required
- **Why**: MediaRecorder, Service Workers, OAuth require secure context

---

## Testing

### Manual Testing Checklist

**Core features:**
- ✅ Record audio
- ✅ Upload image
- ✅ Playback
- ✅ Delete snippets
- ✅ Export/import
- ✅ OAuth sign-in
- ✅ Transcription
- ✅ Publishing

### Browser Testing

**Test matrix:**
| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome | ✅ | ✅ | Full support |
| Safari | ✅ | ✅ | iOS 14+ |
| Firefox | ✅ | ⚠️ | PWA limited |
| Edge | ✅ | ✅ | Chromium-based |

---

## Future Enhancements

### Planned Features

- Text notes (UI exists, not wired)
- Search and filtering
- Manual transcription control
- Draft management
- Multi-device sync via Drive
- Camera capture (in addition to file picker)

### Database Migrations

When adding features requiring schema changes:

1. Increment database version in `storage.js`
2. Add migration logic in `onupgradeneeded`
3. Test with existing data
4. Document migration in `dataVersion` field

---

## Troubleshooting

### Common Issues

**"Microphone not found":**
- Check browser permissions (Settings → Privacy → Microphone)
- Ensure HTTPS (MediaRecorder requires secure context)
- Try different browser

**IndexedDB quota exceeded:**
- Check quota: `await navigator.storage.estimate()`
- Export and delete old data
- Browser limit typically 50% of disk space

**Service Worker not updating:**
- Clear cache: DevTools → Application → Clear storage
- Unregister SW: DevTools → Application → Service Workers → Unregister
- Hard refresh: Ctrl+Shift+R

**OAuth errors:**
- Check Client ID and API Key in `.env`
- Verify authorized origins in Google Cloud Console
- Clear localStorage and re-authenticate

---

## Contributing

### Code Style

- **ESLint**: Run `npm run lint` before committing
- **Prettier**: Format with 2-space indentation
- **Components**: One component per file
- **Functions**: Descriptive names, JSDoc comments

### Git Workflow

1. Create feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -m "Description"`
3. Push: `git push origin feature/name`
4. Create pull request

### Documentation

- Update `docs/` when adding features
- Add JSDoc comments to new functions
- Update README.md if user-facing changes

---

## Resources

- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev
- **IndexedDB**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **MediaRecorder**: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- **Google Cloud APIs**: https://cloud.google.com/apis

---

## License

MIT License - see LICENSE file for details.
