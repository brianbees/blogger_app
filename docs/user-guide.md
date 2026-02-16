# Voice Journal - User Guide

Complete guide to using all features of the Voice Journal PWA.

## Table of Contents

- [Voice Recording](#voice-recording)
- [Image Notes](#image-notes)
- [Cloud Publishing](#cloud-publishing)
- [Data Management](#data-management)
- [PWA Installation](#pwa-installation)

---

## Voice Recording

### Recording Your First Voice Note

1. **Grant Microphone Permission**: On first use, your browser will ask for microphone access. Click "Allow"
2. **Start Recording**: Tap the large blue microphone button (🎙️) at the bottom center of the screen
3. **Speak**: The button turns red and pulses while recording
4. **Stop Recording**: Tap the button again (now shows ⏹️) to stop and save
5. **View Your Recording**: The snippet appears instantly at the top of the feed

### Playing Back Recordings

- Tap the **play button** (▶️) on any voice snippet card
- A **progress bar** shows playback position
- Tap again to **pause** (⏸)
- **Duration** is displayed on the right side of the progress bar

### What Happens After Recording

If you're **signed in to Google**:
- Recording is **automatically transcribed** in the background
- You'll see a "🎤 Transcribing audio..." message
- When complete, a **📝 Publish button** appears
- The transcript is saved but **not displayed** (used for publishing only)

---

## Image Notes

### Uploading Images

1. **Tap the Image Button**: Tap the image icon (🖼️) at the bottom right
2. **Select Photo**: Choose a JPG or PNG image from your device
   - Maximum file size: 10MB
   - Supported formats: JPG, PNG
3. **Add Caption** (optional): Enter a caption up to 200 characters
4. **Save**: Tap "Save Image" to add it to your journal
5. **Cancel**: Tap "Cancel" or swipe down to dismiss without saving

### Viewing Images

- **Thumbnail**: Images appear in the feed with a preview
- **Full Screen**: Tap any image to open the full-screen viewer
- **Zoom**: Double-tap to zoom in, double-tap again to zoom out
- **Pan**: When zoomed, drag to pan around the image
- **Close**: Swipe down or tap the ✕ button to close

---

## Cloud Publishing

### One-Time Setup

1. **Open Cloud Sync**:
   - Tap the cloud icon (☁️) in the top-right corner of the header
   - A modal opens titled "Cloud Sync"

2. **Sign In with Google**:
   - Tap "Sign in with Google"
   - A popup window opens for Google authentication
   - Sign in with your Google account
   - Grant permissions when prompted

3. **Select Your Blog**:
   - After sign-in, a dropdown appears showing your Blogger blogs
   - Select the blog you want to publish to
   - Your selection is saved automatically

4. **Confirm Sign-In**:
   - The cloud icon turns **green** (✓) when signed in
   - Your Google profile picture and name appear in Cloud Sync modal
   - Drive storage quota is displayed

### Publishing to Blogger

**For Voice Notes:**
1. Record a voice note as usual
2. Wait for auto-transcription to complete (⏳ changes to 📝)
3. Tap the **📝 Publish button** on the snippet card
4. A progress modal appears showing:
   - Transcribing audio (if not already done)
   - Publishing to Blogger
5. Success! Toast message shows "Published successfully!" with link
6. Click the link in the toast to view your blog post

**For Image Notes:**
1. Upload an image with optional caption
2. Tap the **📝 Publish button**
3. Progress modal shows:
   - Compressing image (resizes to 1920x1920px)
   - Uploading to Google Drive
   - Publishing to Blogger
4. Success! The compressed image is hosted on Drive and embedded in your blog post

### What Gets Published

**Audio Snippets:**
- Post title: First few words of transcript or date-based fallback
- Post body includes:
  - Recording timestamp (full date and time)
  - Complete transcript text
  - Recording duration
- Label: "voice-journal"

**Image Snippets:**
- Post title: Caption text or date-based fallback
- Post body includes:
  - Recording timestamp
  - Embedded image (hosted on Google Drive)
  - Caption text (if provided)
- Label: "voice-journal"

### Publishing Options

When you tap 📝, a modal opens with:
- **Title**: Auto-generated, or enter custom title
- **Labels**: Default "voice-journal", or add comma-separated labels
- **Publish/Draft**: Toggle to save as draft instead of publishing
- **Cancel**: Abort publishing

### Sign Out

1. Open Cloud Sync modal (tap cloud icon)
2. Tap "Sign Out" button at the bottom
3. Cloud icon returns to blue (☁️)
4. Publish buttons disappear from snippet cards

---

## Data Management

Access the Data Manager by tapping the hidden "Data" button (if visible) or through developer mode.

### Export Your Data

1. Open Data Manager
2. Tap **"Export to JSON"**
3. Downloads a JSON file containing:
   - All snippets (audio and images)
   - Audio/image data encoded in base64
   - Timestamps, captions, transcripts
4. **Filename**: `voice-journal-backup-YYYY-MM-DD-HHMMSS.json`

### Import Data

1. Open Data Manager
2. Tap **"Import from JSON"**
3. Select a previously exported JSON file
4. Snippets are restored to IndexedDB
5. Feed automatically refreshes

### Check Storage Quota

1. Open Data Manager
2. View storage statistics:
   - **Total quota**: How much storage your browser allows
   - **Used**: Current storage consumed
   - **Available**: Remaining space
3. Example: "9.53 GB available of 10.00 GB"

### Clear All Data

1. Open Data Manager
2. Tap **"Clear All Data"**
3. Confirm the action (this cannot be undone)
4. All snippets are deleted from IndexedDB
5. Feed becomes empty

**Warning**: Clearing data is permanent. Export first if you want to keep backups!

---

## PWA Installation

### Why Install?

- **Home screen icon**: Launch like a native app
- **Full-screen mode**: No browser chrome (address bar, tabs)
- **Faster launch**: Pre-cached for instant startup
- **Offline capable**: Record and view snippets without internet
- **Native feel**: Feels like an installed app, not a website

### Installing on Android (Chrome)

1. Open the app in Chrome: `https://yourdomain.com/blogger/`
2. Chrome automatically shows an **install prompt** at the top
   - Or tap **menu (⋮) → "Add to Home screen"** or **"Install app"**
3. Tap **"Install"** or **"Add"**
4. App icon appears on your home screen
5. Tap the icon to open in standalone mode

### Installing on iOS (Safari)

1. Open the app in Safari: `https://yourdomain.com/blogger/`
2. Tap the **Share button** (square with arrow up)
3. Scroll down and tap **"Add to Home Screen"**
4. Edit the name if desired, tap **"Add"**
5. App icon appears on your home screen
6. Tap the icon to open in standalone mode

### Installing on Desktop

**Chrome/Edge:**
1. Open the app in browser
2. Look for **install icon (⊕)** in address bar
3. Click it and confirm installation
4. App opens in separate window (no tabs)
5. Appears in your app launcher/Start menu

### Uninstalling

**Android:**
- Long-press app icon → "Uninstall" or "Remove"

**iOS:**
- Long-press app icon → "Remove App" → "Delete from Home Screen"

**Desktop:**
- Right-click app icon → "Uninstall" or go to browser settings → Installed Apps → Uninstall

### Offline Capabilities

When installed as PWA:
- ✅ **Record voice notes** (saved to IndexedDB)
- ✅ **Upload images** (saved locally)
- ✅ **View all snippets** (stored locally)
- ✅ **Play audio** (works offline)
- ✅ **Export data** (download JSON)
- ❌ **Transcription** (requires internet)
- ❌ **Publishing to Blogger** (requires internet)
- ❌ **Google Drive upload** (requires internet)

---

## Tips & Tricks

### Best Practices

- **Keep recordings short**: Auto-transcription works best for recordings **under 30 seconds** (Google API limit)
- **Speak clearly**: Better transcription quality
- **Add captions to images**: Makes blog posts more meaningful
- **Export regularly**: Keep backups of important journal entries
- **Check storage quota**: Monitor available space

### Troubleshooting

**"Microphone not found" error:**
- Grant microphone permission in browser settings
- Check that a microphone is connected
- Try refreshing the page

**Transcription fails:**
- Check internet connection
- Ensure Google Cloud billing is set up (free tier available)
- Audio may be too long or poor quality

**Publishing fails:**
- Verify you're signed in (cloud icon is green)
- Check that a blog is selected in Cloud Sync
- Ensure you have a Blogger account with at least one blog

**Images won't upload:**
- Check file size (max 10MB)
- Verify file format (JPG or PNG only)
- Try compressing the image first

**App won't install as PWA:**
- Ensure you're using HTTPS (not HTTP)
- Try a different browser
- Clear browser cache and try again

---

## Keyboard Shortcuts

Currently, all interactions are tap/click-based. Keyboard shortcuts may be added in future versions.

---

## Privacy & Data

- **Local-first**: All data stored in your browser (IndexedDB)
- **No backend server**: App runs entirely client-side
- **Google Cloud**: Only used if you sign in (optional)
- **Your data**: You control it - export anytime, delete anytime
- **Transcripts**: Sent to Google Speech-to-Text only when you're signed in
- **Images**: Uploaded to your Google Drive only when publishing

---

## Getting Help

- **Issues**: Report bugs on GitHub: [brianbees/blogger_app](https://github.com/brianbees/blogger_app)
- **Documentation**: Check `docs/` folder for technical details
- **Google Cloud**: Refer to [deployment.md](deployment.md) for setup help
