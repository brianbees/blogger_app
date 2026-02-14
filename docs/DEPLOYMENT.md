# Voice Journal - Deployment Guide

Complete guide for deploying Voice Journal PWA to production and configuring Google Cloud services.

## Table of Contents

- [Local Development](#local-development)
- [Google Cloud Setup](#google-cloud-setup)
- [Production Build](#production-build)
- [Deployment](#deployment)
- [Post-Deployment](#post-deployment)

---

## Local Development

### Prerequisites

- **Node.js 20+** and npm
- Modern browser (Chrome, Firefox, Safari, Edge)
- HTTPS support (required for MediaRecorder and Service Workers)

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/brianbees/blogger_app.git
   cd blogger_app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   - Navigate to `https://localhost:5173`
   - Accept the self-signed certificate warning (dev only)

### Development Commands

```bash
npm run dev      # Start dev server with HMR
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint (if configured)
```

### Working Without Cloud Features

The app works fully offline without Google Cloud credentials:
- Voice recording ✅
- Image upload ✅
- Local playback ✅
- Export/import ✅
- Transcription ❌ (requires Google)
- Publishing ❌ (requires Google)

To enable cloud features, continue to Google Cloud Setup.

---

## Google Cloud Setup

Cloud features require a Google Cloud project with three APIs and OAuth credentials.

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project" → "New Project"**
3. Enter project name: `Voice Journal` (or your choice)
4. Click **"Create"**
5. Wait for project to be created, then select it

### Step 2: Enable Required APIs

Enable three APIs for your project:

1. In Cloud Console, go to **"APIs & Services" → "Library"**

2. **Enable Blogger API v3**:
   - Search for "Blogger API v3"
   - Click on it → Click **"Enable"**
   - Wait for activation

3. **Enable Google Drive API v3**:
   - Search for "Google Drive API"
   - Click on it → Click **"Enable"**
   - Wait for activation

4. **Enable Cloud Speech-to-Text API**:
   - Search for "Cloud Speech-to-Text API"
   - Click on it → Click **"Enable"**
   - **Important**: This requires billing to be enabled
   - Set up billing account (free tier: 60 min/month)

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services" → "OAuth consent screen"**
2. Choose **"External"** user type → Click **"Create"**
3. Fill in required fields:
   - **App name**: Voice Journal
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **"Save and Continue"**
5. **Scopes**: Click "Add or Remove Scopes"
   - Add: `https://www.googleapis.com/auth/blogger`
   - Add: `https://www.googleapis.com/auth/drive.file`
   - Add: `https://www.googleapis.com/auth/cloud-platform`
   - Add: `https://www.googleapis.com/auth/userinfo.profile`
   - Add: `https://www.googleapis.com/auth/userinfo.email`
6. Click **"Save and Continue"**
7. **Test users**: Add your email address (and any testers)
8. Click **"Save and Continue"** → **"Back to Dashboard"**
9. **Publishing status**: Leave as "Testing" (or publish for public use)

### Step 4: Create OAuth 2.0 Client ID

1. Go to **"APIs & Services" → "Credentials"**
2. Click **"+ Create Credentials" → "OAuth client ID"**
3. **Application type**: Web application
4. **Name**: Voice Journal Web Client
5. **Authorized JavaScript origins**: Add all domains/ports where you'll run the app:
   - `http://localhost:5173` (dev)
   - `https://localhost:5173` (dev HTTPS)
   - `https://yourdomain.com` (production)
   - Click **"+ Add URI"** for each
6. **Authorized redirect URIs**: Add same URLs:
   - `http://localhost:5173`
   - `https://localhost:5173`
   - `https://yourdomain.com`
7. Click **"Create"**
8. **Copy the Client ID**: Save it somewhere safe (looks like `123456789-abc123.apps.googleusercontent.com`)

### Step 5: Create API Key

1. Go to **"APIs & Services" → "Credentials"**
2. Click **"+ Create Credentials" → "API key"**
3. **Copy the API Key**: Save it somewhere safe (looks like `AIzaSyABC123...`)
4. Click **"Restrict Key"** (recommended for security):
   - **Application restrictions** → **HTTP referrers (web sites)**
   - Add referrers:
     - `http://localhost:5173/*`
     - `https://localhost:5173/*`
     - `https://yourdomain.com/*`
   - **API restrictions** → **Restrict key**
   - Select: Blogger API v3, Google Drive API v3, Cloud Speech-to-Text API v1
5. Click **"Save"**

### Step 6: Configure Environment Variables

1. **Create `.env` file** in project root:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** and add your credentials:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=your-api-key-here
   ```

3. **Important**: Never commit `.env` to Git (already in `.gitignore`)

4. **Restart dev server** to pick up new environment variables:
   ```bash
   npm run dev
   ```

### Step 7: Test Cloud Features

1. Open app in browser: `https://localhost:5173`
2. Click cloud icon (☁️) in header
3. Click "Sign in with Google"
4. Authenticate with test user account
5. Select a Blogger blog from dropdown
6. Cloud icon should turn green (✓)
7. Record audio → Wait for transcription → Publish

---

## Production Build

### Configure Base Path (if deploying to subfolder)

If deploying to a subfolder (e.g., `https://yourdomain.com/blogger/`):

1. Edit `vite.config.js`:
   ```javascript
   export default defineConfig({
     base: '/blogger/', // Change to your subfolder path
     // ... rest of config
   })
   ```

2. For root domain deployment, use:
   ```javascript
   base: '/',
   ```

### Build for Production

```bash
npm run build
```

Output:
- Files are generated in `dist/` folder
- Includes:
  - `index.html` (main HTML)
  - `assets/` (CSS, JS, images)
  - `manifest.webmanifest` (PWA manifest)
  - `sw.js` (service worker)
  - `registerSW.js` (service worker registration)

### Verify Build

```bash
npm run preview
```

- Opens at `http://localhost:4173`
- Test all features before deploying

---

## Deployment

### Option 1: cPanel Hosting

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Compress dist folder** (optional, for easier upload):
   ```bash
   # PowerShell
   Compress-Archive -Path "dist\*" -DestinationPath "voice-journal.zip"
   
   # Bash/Linux/Mac
   cd dist && zip -r ../voice-journal.zip *
   ```

3. **Upload to cPanel**:
   - Log into cPanel File Manager
   - Navigate to `public_html/blogger/` (or your target folder)
   - Upload all files from `dist/` folder (or upload ZIP and extract)
   - Ensure file permissions are correct (644 for files, 755 for folders)

4. **Verify deployment**:
   - Open `https://yourdomain.com/blogger/` in browser
   - Check that all assets load (no 404 errors in Console)

### Option 2: Static Hosting (Netlify, Vercel, etc.)

**Netlify:**
```bash
npm run build
netlify deploy --prod --dir=dist
```

**Vercel:**
```bash
npm run build
vercel --prod
```

**GitHub Pages:**
```bash
npm run build
# Configure base: '/repo-name/' in vite.config.js
# Push dist/ to gh-pages branch
```

### Option 3: Self-Hosted Server (Nginx)

**Nginx configuration** (example):
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/voice-journal;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

---

## Post-Deployment

### Update Google Cloud OAuth Settings

After deploying to production domain, update OAuth settings:

1. Go to **Google Cloud Console → Credentials**
2. Click your **OAuth Client ID**
3. **Authorized JavaScript origins**: Add production URL:
   - `https://yourdomain.com`
4. **Authorized redirect URIs**: Add production URL:
   - `https://yourdomain.com`
5. Click **"Save"**

### Update API Key Restrictions

1. Go to **Google Cloud Console → Credentials**
2. Click your **API Key**
3. **Application restrictions**: Add production referrer:
   - `https://yourdomain.com/*`
4. Click **"Save"**

**Important**: Changes can take 5-10 minutes to propagate.

### Test Production App

1. Open `https://yourdomain.com/blogger/` (or your URL)
2. **Hard refresh** (Ctrl+Shift+R / Cmd+Shift+R) to clear cache
3. Test OAuth sign-in
4. Test transcription
5. Test publishing to Blogger
6. Test PWA installation (should see install prompt in Chrome)

### Monitor Quota Usage

1. Go to **Google Cloud Console → "APIs & Services" → "Dashboard"**
2. View API usage:
   - **Blogger API**: Requests per day
   - **Drive API**: Requests per day, storage used
   - **Speech-to-Text API**: Minutes transcribed this month
3. **Free tier limits**:
   - Speech-to-Text: 60 minutes/month
   - Blogger: 10,000 requests/day
   - Drive: 15 GB storage (regular Google account)

### Troubleshooting Production Issues

**"Invalid Client ID" error:**
- Verify production domain is in OAuth authorized origins
- Check that Client ID in `.env` matches Google Cloud Console
- Wait 5-10 minutes for changes to propagate

**API Key errors (403 Forbidden):**
- Add production domain to API Key referrer restrictions
- Ensure API Key has correct API restrictions
- Clear browser cache and try again

**Service Worker not updating:**
- Clear browser cache completely (Ctrl+Shift+Delete)
- Unregister old service worker in DevTools → Application → Service Workers
- Hard refresh (Ctrl+Shift+R)

**PWA not installing:**
- Ensure site is served over HTTPS (not HTTP)
- Check that `manifest.webmanifest` is loading (no 404)
- Verify `sw.js` is registered successfully

---

## Security Best Practices

1. **Never commit credentials**:
   - Keep `.env` in `.gitignore`
   - Don't hardcode API keys in source code

2. **Restrict API Key**:
   - Enable HTTP referrer restrictions
   - Only allow necessary APIs

3. **OAuth Client ID**:
   - Only add authorized domains you control
   - Keep test user list updated

4. **HTTPS only**:
   - Never serve over HTTP in production
   - Use valid SSL certificate (Let's Encrypt is free)

5. **Content Security Policy** (optional):
   - Add CSP headers to restrict script sources
   - Helps prevent XSS attacks

---

## Updating the App

### Deploying Updates

1. Make code changes
2. Test locally: `npm run dev`
3. Build: `npm run build`
4. Upload new `dist/` files to server
5. Service worker automatically updates on user's next visit

### Cache Invalidation

Users may have old versions cached. To force update:

1. **Service Worker**: Vite PWA plugin handles versioning automatically
2. **Hard Refresh**: Users can Ctrl+Shift+R to force refresh
3. **Unregister SW**: In DevTools → Application → Service Workers → Unregister

### Database Migrations

If you change IndexedDB schema:

1. Increment database version in `src/utils/storage.js`
2. Add migration logic in `onupgradeneeded` handler
3. Test thoroughly before deploying

---

## Backup & Disaster Recovery

1. **Code**: Always backed up in Git repository
2. **User Data**: Stored in user's browser (IndexedDB)
3. **Exports**: Users can export JSON backups
4. **Google Drive**: Optional cloud backup storage

**Recommendation**: Encourage users to export data regularly.

---

## Monitoring & Analytics (Optional)

Consider adding:

- **Google Analytics**: Track usage
- **Sentry**: Error monitoring
- **Uptime monitoring**: Check site availability

Note: Voice Journal currently has no analytics to maintain user privacy.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/brianbees/blogger_app/issues)
- **Docs**: See `docs/` folder for more guides
- **Google Cloud**: [Official Documentation](https://cloud.google.com/docs)
