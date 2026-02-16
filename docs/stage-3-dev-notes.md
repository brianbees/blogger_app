# Stage 3: Cloud Integrations - Developer Notes

## Implementation Date
February 14, 2026

## Scope
Client-side Google API integrations for publishing, backup, and transcription. All API calls are made directly from the browser with no backend required.

---

## Key Features Implemented

### 1. Google OAuth2 Authentication (`googleAuth.js`)

**Implementation:**
- Uses Google Identity Services (GIS) library for OAuth2 implicit flow
- Loads both `gapi` (Google API Client) and `gsi` (Google Identity Services) scripts dynamically
- Manages access token lifecycle and automatic refresh
- Supports multiple API scopes: Blogger, Drive, Speech-to-Text

**API Scopes:**
```javascript
- https://www.googleapis.com/auth/blogger
- https://www.googleapis.com/auth/drive.file
- https://www.googleapis.com/auth/cloud-platform
```

**Key Functions:**
- `initGoogleServices()` - Initialize all Google libraries
- `requestAccessToken()` - Show OAuth consent screen and get token
- `signOut()` - Revoke token and clear session
- `isSignedIn()` - Check authentication status
- `getUserProfile()` - Fetch user info from OAuth2 API
- `ensureValidToken()` - Validate and refresh token if needed

**Environment Variables Required:**
```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-api-key-here
```

**Browser Requirements:**
- Modern browser with fetch API
- Third-party cookies enabled for OAuth
- JavaScript enabled

### 2. Speech-to-Text Transcription (`speechToTextService.js`)

**Implementation:**
- Uses Google Cloud Speech-to-Text API v1 REST endpoint
- Converts audio blob to base64 for API request
- Auto-detects audio encoding from MIME type
- Supports multiple languages (default: en-GB)

**Audio Format Support:**
- WEBM_OPUS (Chrome default)
- OGG_OPUS
- MP3
- LINEAR16 (WAV)

**Key Functions:**
- `transcribeAudio(audioBlob, languageCode)` - Transcribe audio to text
- `transcribeAudioWithProgress(audioBlob, callback, languageCode)` - With progress updates
- `batchTranscribe(snippets, callback)` - Transcribe multiple snippets

**Configuration Options:**
```javascript
{
  encoding: 'WEBM_OPUS',
  languageCode: 'en-GB',
  enableAutomaticPunctuation: true,
  model: 'default',
  useEnhanced: false  // Set true for premium model
}
```

**Return Format:**
```javascript
{
  transcript: "Transcribed text with punctuation",
  confidence: 0.95  // 0-1 scale
}
```

**Cost Considerations:**
- Free tier: 60 minutes per month
- Standard model: $0.006/15 seconds
- Enhanced model: $0.009/15 seconds
- Pricing as of Feb 2026

### 3. Google Drive Integration (`driveService.js`)

**Implementation:**
- Uses Google Drive API v3 with multipart upload
- Creates app-specific folder: "Voice Journal Backups"
- Supports image upload and JSON backup
- File management (list, download, delete)

**Key Functions:**
- `uploadImage(imageBlob, fileName, description)` - Upload image to Drive
- `uploadBackup(backupData, fileName)` - Upload JSON backup
- `listBackups()` - List all backup files
- `downloadBackup(fileId)` - Download and parse backup
- `deleteFile(fileId)` - Delete file from Drive
- `getStorageInfo()` - Get Drive quota information

**File Organization:**
```
Google Drive/
└── Voice Journal Backups/
    ├── journal-image-abc123.jpg
    ├── journal-image-def456.png
    ├── voice-journal-backup-2026-02-14T10-30-00.json
    └── voice-journal-backup-2026-02-13T15-45-00.json
```

**Upload Format:**
- Images: Original blob, maintains MIME type
- Backups: JSON with 2-space indentation
- Metadata includes description and timestamp

### 4. Blogger Publishing (`bloggerService.js`)

**Implementation:**
- Uses Blogger API v3 for post management
- Auto-generates blog posts from snippets
- Includes transcript, images, metadata
- Supports draft/published status

**Key Functions:**
- `getUserBlogs()` - List user's Blogger blogs
- `publishPost(blogId, snippet, transcript, imageUrl, options)` - Create blog post
- `updatePost(blogId, postId, updates)` - Update existing post
- `deletePost(blogId, postId)` - Delete post
- `getRecentPosts(blogId, maxResults)` - List recent posts

**Blog Post Structure:**
```html
<div class="voice-journal-entry">
  <p class="timestamp"><em>Recorded on [date]</em></p>
  <p><img src="[drive-url]" alt="Journal entry image" /></p>
  <blockquote><p>[caption]</p></blockquote>
  <div class="transcript">
    <p>[transcribed text]</p>
  </div>
  <p class="metadata"><small>Recording duration: [duration]</small></p>
</div>
```

**Title Generation Priority:**
1. Custom title (if provided)
2. First line of transcript (up to 100 chars)
3. Caption text (if present)
4. Date-based fallback: "Journal Entry - [date]"

**Publishing Options:**
```javascript
{
  isDraft: false,           // Publish immediately or save as draft
  labels: ['voice-journal'], // Blog post labels/tags
  customTitle: null         // Optional custom title
}
```

---

## UI Components

### CloudSync Component (`CloudSync.jsx`)

**Features:**
- Google sign-in button
- User profile display with avatar
- Blog selection dropdown
- Google Drive storage quota visualization
- Sign-out functionality

**State Management:**
- `isInitialized` - Google libraries loaded
- `signedIn` - OAuth status
- `userProfile` - User name, email, picture
- `blogs` - List of user's Blogger blogs
- `selectedBlogId` - Active blog for publishing
- `storageInfo` - Drive quota (usage/limit)

**Persistence:**
- Selected blog ID saved to localStorage
- Restored on app reload

### PublishModal Component (`PublishModal.jsx`)

**Features:**
- Custom title input (optional)
- Labels/tags input (comma-separated)
- Draft checkbox
- Progress indicator with steps
- Preview of what will be published

**Publishing Flow:**
1. **Starting** (0%) - Initialize
2. **Transcribing audio** (20%) - If audio snippet
3. **Uploading image to Drive** (50%) - If image present
4. **Publishing to Blogger** (80%) - Create post
5. **Complete** (100%) - Show success

**Error Handling:**
- Network errors
- API quota exceeded
- Invalid blog selection
- Missing credentials

---

## Integration Points

### App.jsx Updates

**New State:**
```javascript
const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
const [isSignedIn, setIsSignedIn] = useState(false);
const [publishSnippet, setPublishSnippet] = useState(null);
const [selectedBlogId, setSelectedBlogId] = useState(null);
```

**New Handlers:**
- `handleCloudSyncOpen()` - Open Cloud Sync modal
- `handleSignInChange(signedIn)` - Update sign-in status
- `handlePublishClick(snippet)` - Open publish modal
- `handlePublishSuccess(result)` - Show success toast with blog URL

**Callbacks Passed Down:**
- `Header` ← `onCloudSyncClick`, `isSignedIn`
- `DailyFeed` ← `onPublishClick`, `isSignedIn`
- `SnippetCard` ← `onPublishClick`, `isSignedIn`

### Header Updates

**New UI:**
- Cloud icon button in top-right
- Visual indicator for sign-in status:
  - Signed out: Gray cloud + "Sign In"
  - Signed in: Green cloud + "Signed In"

### SnippetCard Updates

**New UI:**
- Publish button (📝) next to delete button
- Only visible when signed in
- Available for both audio and image snippets

---

## Security Considerations

### API Key Restrictions

**Recommended restrictions for production:**
- Application restrictions: HTTP referrers
- Allowed referrers: `https://your-domain.com/*`
- API restrictions: Blogger API, Drive API, Speech-to-Text API

### OAuth 2.0 Client ID

**Authorized JavaScript origins:**
- `http://localhost:5173` (development)
- `https://your-domain.com` (production)

**Authorized redirect URIs:**
- `http://localhost:5173` (development)
- `https://your-domain.com` (production)

### Environment Variables

**Never commit `.env` file:**
```gitignore
.env
.env.local
```

**Use `.env.example` for template:**
```bash
# Public example without real credentials
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-api-key-here
```

---

## Testing Considerations

### Manual Testing Checklist

**Google Sign-In:**
- [ ] Sign-in button appears in header
- [ ] OAuth consent screen shows correct scopes
- [ ] User profile loads after sign-in
- [ ] Blog list populates correctly
- [ ] Sign-out clears all state

**Speech-to-Text:**
- [ ] Audio transcription works for short clips (<60s)
- [ ] Transcription includes punctuation
- [ ] Handles silent audio gracefully
- [ ] Error messages for API failures

**Google Drive:**
- [ ] App folder created on first use
- [ ] Images upload successfully
- [ ] Backup files saved correctly
- [ ] Storage quota displays accurately

**Blogger Publishing:**
- [ ] Publish button appears when signed in
- [ ] Modal opens with correct snippet data
- [ ] Audio snippets include transcript
- [ ] Images appear in blog post
- [ ] Draft mode works correctly
- [ ] Success toast shows blog URL

### Browser Compatibility

**Tested:**
- Chrome 90+ ✅
- Edge 90+ ✅
- Firefox 88+ ✅ (requires third-party cookies enabled)
- Safari 14+ ⚠️ (ITP may block OAuth, require user interaction)

**Known Issues:**
- Safari Intelligent Tracking Prevention may block OAuth flow
- Private/Incognito mode may not work with OAuth
- Ad blockers may interfere with Google API scripts

---

## API Quotas and Limits

### Blogger API v3

**Quota:**
- Read: 10,000 requests/day
- Write: 50 requests/user/day per project

**Rate Limits:**
- 1 request per second per user

### Google Drive API v3

**Quota:**
- Read: 20,000 requests/100 seconds
- Write: 20,000 requests/100 seconds

**File Size Limits:**
- Simple upload: 5 MB per file
- Multipart upload: 5 MB per file (our implementation)
- Resumable upload: 5 TB per file

### Cloud Speech-to-Text API v1

**Quota:**
- Free tier: 60 minutes per month
- Paid tier: Unlimited with billing

**File Size Limits:**
- Synchronous: 10 MB or 1 minute audio
- Asynchronous: 1 GB or 480 minutes audio (future enhancement)

---

## Cost Analysis

### Monthly Cost Estimate (Light Usage)

**Assumptions:**
- 50 voice recordings per month (avg 30 seconds each)
- 10 image uploads per month
- 5 blog posts published per month
- 2 backup exports per month

**Breakdown:**
- Speech-to-Text: 25 minutes @ $0.006/15s = **$0.60**
- Drive storage: <100 MB (free 15 GB tier) = **$0.00**
- Blogger API: Free tier = **$0.00**

**Total: ~$0.60/month** (or free within 60-minute STT tier)

### Monthly Cost Estimate (Heavy Usage)

**Assumptions:**
- 300 voice recordings per month (avg 45 seconds each)
- 50 image uploads per month
- 30 blog posts published per month
- 10 backup exports per month

**Breakdown:**
- Speech-to-Text: 225 minutes @ $0.006/15s = **$5.40**
- Drive storage: 500 MB (free 15 GB tier) = **$0.00**
- Blogger API: Free tier = **$0.00**

**Total: ~$5.40/month**

---

## Future Enhancements

### Potential Stage 4 Features

1. **Real-time Transcription**
   - Use StreamingRecognize API
   - Show transcript while recording
   - Higher cost but better UX

2. **Multi-Device Sync**
   - Store all snippets in Drive
   - Sync IndexedDB across devices
   - Conflict resolution strategy

3. **Offline Publishing Queue**
   - Queue posts while offline
   - Auto-publish when connection restored
   - Retry failed uploads

4. **Custom Blogger Themes**
   - Voice journal specific CSS
   - Audio player embeds
   - Gallery layouts

5. **Advanced Search**
   - Full-text search in transcripts
   - Filter by date range, label
   - Search images by caption

6. **Batch Operations**
   - Publish multiple snippets at once
   - Bulk download from Drive
   - Mass transcription

---

## Known Limitations

### Current Constraints

1. **No Server-Side Logic**
   - All API calls from browser
   - API keys visible in client (restricted by domain)
   - Cannot use service accounts

2. **Browser Storage Limits**
   - IndexedDB quota varies by browser
   - Large audio/image files consume space quickly
   - No automatic cloud backup

3. **OAuth Session**
   - Tokens expire after 1 hour
   - Auto-refresh handled by GIS library
   - Users must re-authenticate if away >1 hour

4. **Transcription Quality**
   - Depends on audio quality
   - Background noise affects accuracy
   - Default model (not enhanced)

5. **Blogger Limitations**
   - Requires existing Blogger account and blog
   - Cannot create blogs via API
   - Limited to 50 posts/day per user

---

## Deployment Checklist

Before deploying to production:

- [ ] Create Google Cloud project
- [ ] Enable all required APIs (Blogger, Drive, Speech-to-Text)
- [ ] Set up OAuth 2.0 credentials with production domain
- [ ] Create API key with domain restrictions
- [ ] Set up billing for Speech-to-Text (if exceeding free tier)
- [ ] Update `.env` with production credentials
- [ ] Add authorized domains to OAuth consent screen
- [ ] Test OAuth flow on production domain
- [ ] Verify API key restrictions work
- [ ] Monitor API usage in Cloud Console
- [ ] Set up budget alerts for unexpected usage

---

## Troubleshooting

### Common Issues

**"Failed to initialize Google services"**
- Check API credentials in `.env`
- Verify domain is authorized in Cloud Console
- Check browser console for script loading errors

**"Sign-in failed"**
- Enable third-party cookies in browser
- Check OAuth consent screen configuration
- Verify client ID matches Cloud Console

**"No blog selected"**
- User must have at least one Blogger blog
- Check Blogger API is enabled
- Verify user granted Blogger scope in OAuth

**"Speech-to-Text API request failed"**
- Check billing is enabled in Cloud Console
- Verify API key has Speech-to-Text API enabled
- Check quota limits haven't been exceeded

**"Failed to upload image to Drive"**
- Verify Drive API is enabled
- Check image file size (<10 MB)
- Ensure user granted Drive scope in OAuth

---

## References

**Official Documentation:**
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [Blogger API v3](https://developers.google.com/blogger/docs/3.0/reference)
- [Google Drive API v3](https://developers.google.com/drive/api/v3/reference)
- [Cloud Speech-to-Text API](https://cloud.google.com/speech-to-text/docs/reference/rest/v1/speech/recognize)

**Pricing:**
- [Speech-to-Text Pricing](https://cloud.google.com/speech-to-text/pricing)
- [Drive Storage Pricing](https://one.google.com/about/plans)
- [Blogger](https://www.blogger.com) - Free

---

## Conclusion

Stage 3 successfully adds comprehensive cloud integration capabilities while maintaining the app's core principle of being a local-first, client-side PWA. All cloud features are optional enhancements that gracefully degrade when not configured or when the user is offline.

The implementation follows Google's best practices for OAuth2 and API usage, ensuring security and scalability. The modular service architecture makes it easy to add new Google APIs or swap providers in the future.
