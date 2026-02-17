# 🎙️ Voice Journal PWA

A mobile-first Progressive Web App for capturing and organizing voice notes and images. Features automatic transcription, image attachments, and one-click publishing to Blogger. Optimized for Samsung devices and all modern mobile browsers.

## ✨ Features

- 🎤 **Continuous Recording** - Long-form voice notes with 25-second auto-chunking for reliable mobile recording
- 🌐 **Live Transcription** - Real-time speech-to-text as you record (works offline for recording, online for transcription)
- 🖼️ **Image Attachments** - Attach photos to voice notes or upload standalone images with captions
- 📱 **Mobile-Optimized** - Tested on Samsung S21, works flawlessly on all modern mobile browsers
- 🎙️ **Auto-Save Drafts** - Automatic draft recovery if browser crashes during recording
- 📝 **Publish to Blogger** - One-click blog post creation with automatic image uploads to Google Drive
- 💾 **Local-First Storage** - Works completely offline with IndexedDB, no backend required
- 🚫 **Popup-Free UX** - Mobile-friendly confirmations and toasts, no browser popups
- 📲 **Install as App** - Progressive Web App with full-screen mode and offline support
- 🔐 **Privacy-First** - All cloud APIs called client-side, credentials stay in your browser

**Daily organization** • **Waveform visualization** • **Full-screen image viewer** • **Export/Import** • **Cloud backup**

## Quick Start

### Prerequisites

- Node.js 20+
- Modern browser (Chrome, Safari, Firefox, Edge)

### Installation

```bash
git clone https://github.com/brianbees/blogger_app.git
cd blogger_app
npm install
npm run dev
```

Open `https://localhost:5173` in your browser.

### Optional: Enable Cloud Features

Cloud features (transcription, publishing) require Google Cloud credentials:

1. Create project at [Google Cloud Console](https://console.cloud.google.com/)
2. Enable APIs: Blogger v3, Drive v3, Speech-to-Text v1
3. Create OAuth 2.0 Client ID and API Key
4. Copy `.env.example` to `.env` and add credentials

See **[Deployment Guide](docs/deployment.md)** for detailed setup instructions.

## Documentation

**→ [Documentation Index](docs/README.md)** - Complete documentation hub

Quick links:
- **[User Guide](docs/user-guide.md)** - How to use all features
- **[Deployment Guide](docs/deployment.md)** - Production deployment and Google Cloud setup
- **[Technical Docs](docs/technical.md)** - Architecture, storage schema, API integration
- **[Stage 3 Dev Notes](docs/stage-3-dev-notes.md)** - Cloud integration implementation details

## Tech Stack

- **React 19.2** + **Vite 7.3** - Fast modern framework
- **Tailwind CSS v4** - Utility-first styling  
- **IndexedDB** - Client-side persistent storage
- **MediaRecorder API** - Native audio recording
- **Google Cloud APIs** - OAuth2, Speech-to-Text, Drive, Blogger (client-side only)
- **PWA** - Service workers for offline support

## Development

```bash
npm run dev      # Start dev server (https://localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build
```

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started, coding standards, and how to submit pull requests.

## License

MIT

## Author

Built with GitHub Copilot
