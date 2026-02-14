# 🎙️ Voice Journal PWA

A mobile-first Progressive Web App for capturing and organizing voice notes and images. Features automatic transcription and one-click publishing to Blogger.

## Features

- 🎤 **Voice Recording** - Capture audio snippets with real-time waveform visualization
- 🖼️ **Image Notes** - Upload photos with captions
- 🎙️ **Auto-Transcribe** - Automatic speech-to-text transcription
- 📝 **Publish to Blogger** - One-click blog post creation with visual status tracking
- 💾 **Local-First** - Works offline with IndexedDB storage
- 📱 **Install as App** - PWA with full-screen mode on mobile
- 🔐 **No Backend** - All cloud APIs called client-side (OAuth 2.0)
- ✅ **Smart Status** - Green → for ready posts, blue ✓ for published posts

**Daily organization** • **Audio playback** • **Image viewer** • **Export/Import** • **Google Drive backup**

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

See **[Deployment Guide](docs/DEPLOYMENT.md)** for detailed setup instructions.

## Documentation

- **[User Guide](docs/USER-GUIDE.md)** - How to use all features
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment and Google Cloud setup
- **[Technical Docs](docs/TECHNICAL.md)** - Architecture, storage schema, API integration
- **[Stage 3 Dev Notes](docs/STAGE3-DEV-NOTES.md)** - Cloud integration implementation details

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

Contributions welcome! Please read the [Technical Documentation](docs/TECHNICAL.md) first.

## License

MIT

## Author

Built with GitHub Copilot
