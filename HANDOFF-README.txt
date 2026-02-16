BLOGGER APP - SOURCE CODE HANDOFF
================================

Date: February 16, 2026
Repository: https://github.com/brianbees/blogger_app
Version: 1.0.6

CONTENTS OF blogger_app_source.zip:
-----------------------------------

ESSENTIAL FILES:
- src/ - All application source code (React components, hooks, services, utils)
- public/ - Static assets (PWA manifest, icons)
- docs/ - Complete technical documentation
- index.html - Application entry point
- package.json & package-lock.json - Dependencies and scripts
- .env.example - Environment variable template (COPY TO .env AND FILL IN)

CONFIGURATION:
- vite.config.js - Build configuration
- tailwind.config.js - CSS framework
- postcss.config.js - CSS processing
- eslint.config.js - Code linting

DOCUMENTATION:
- README.md - Project overview and quick start
- CONTRIBUTING.md - Development guidelines
- docs/DOCUMENTATION-STANDARDS.md - Documentation requirements
- docs/technical.md - Architecture and implementation details
- docs/deployment.md - Deployment instructions
- docs/continuous-recording.md - Continuous recording feature docs
- CPANEL_DEPLOYMENT.md - cPanel-specific deployment guide

LICENSE & SECURITY:
- LICENSE - MIT License
- SECURITY-INCIDENT-RESPONSE.md - Security incident procedures

SETUP INSTRUCTIONS:
------------------

1. Extract blogger_app_source.zip

2. Install dependencies:
   npm install

3. Create .env file from template:
   cp .env.example .env

4. Add your Google Cloud credentials to .env:
   VITE_GOOGLE_CLIENT_ID=your-client-id
   VITE_GOOGLE_API_KEY=your-api-key

5. Run development server:
   npm run dev

6. Build for production:
   npm run build

REQUIRED GOOGLE CLOUD SETUP:
----------------------------

You need a Google Cloud project with these APIs enabled:
- Google Speech-to-Text API
- Google Blogger API v3
- Google Drive API v3

OAuth 2.0 credentials:
- Create OAuth 2.0 Client ID (Web application)
- Add authorized JavaScript origins
- Add authorized redirect URIs

API Key:
- Create API key with restrictions
- Enable APIs listed above

See docs/deployment.md for detailed setup instructions.

KEY FEATURES:
------------

- Voice recording with MediaRecorder API
- Two modes: Simple (< 60s) and Continuous (2+ minutes with auto-chunking)
- Real-time speech-to-text transcription (Google Cloud Speech-to-Text)
- Image capture with compression
- IndexedDB storage for offline capability
- PWA support (installable web app)
- Direct publishing to Blogger
- OAuth 2.0 authentication with auto-refresh

RECENT IMPROVEMENTS (Feb 16, 2026):
----------------------------------

- Race-proof MediaRecorder stop (async/await pattern)
- Credential-safe logging (no secrets in console)
- PWA meta tag updates
- Sequential transcription queue with exponential backoff retry
- Memory-safe blob cleanup
- Draft auto-save for crash recovery

TECH STACK:
----------

- React 18.3.1
- Vite 7.3.1
- Tailwind CSS 3.4.17
- IndexedDB (via idb 8.0.0)
- Google Cloud APIs
- PWA with Workbox

ARCHITECTURE NOTES:
------------------

- Optimistic UI updates (no loading spinners for saves)
- Client-side OAuth 2.0 (implicit flow, no backend)
- Progressive Web App (offline-capable, installable)
- All documentation follows DOCUMENTATION-STANDARDS.md

CONTACT:
-------

Original Repository: https://github.com/brianbees/blogger_app
Documentation: See docs/ folder for complete technical details

Good luck with the project!
