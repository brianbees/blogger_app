# cPanel Deployment Guide

## Quick Deployment Steps

1. **Upload the ZIP file**
   - Log in to your cPanel account
   - Go to **File Manager**
   - Navigate to `public_html` (or your desired subdirectory)
   - Click **Upload** and select `blogger_app_cpanel.zip`

2. **Extract the ZIP**
   - Right-click on `blogger_app_cpanel.zip`
   - Select **Extract**
   - Extract to the current directory
   - Delete the ZIP file after extraction

3. **Configure Base Path (if in subdirectory)**
   - If deployed to a subdirectory (e.g., `public_html/blogger`), you need to update the base path
   - The app is currently configured for `/blogger/` base path
   - If deploying to root, edit `index.html` and change base to `/`

4. **Set up Environment Variables**
   - The app needs Google Cloud credentials to work
   - **Important:** Environment variables in `.env` are NOT included in the build
   - You have two options:

   **Option A: Client-side only (Current setup)**
   - Credentials are embedded in the JavaScript at build time
   - No server-side configuration needed
   - ⚠️ API keys are visible in client code (normal for client-side apps)

   **Option B: Use a reverse proxy (More secure)**
   - Set up a backend proxy on your server
   - Proxy requests to Google APIs
   - Keep credentials server-side

5. **Test the Deployment**
   - Visit your domain: `https://yourdomain.com/blogger/`
   - Check browser console (F12) for errors
   - Test recording functionality
   - Test sign-in with Google

## Files Included

The ZIP contains:
- `index.html` - Main HTML file
- `assets/` - JavaScript and CSS bundles
- `manifest.webmanifest` - PWA manifest
- `sw.js` - Service worker for offline support
- `workbox-*.js` - Service worker library
- `registerSW.js` - Service worker registration

## Important Notes

### Base Path
The app is configured with base path `/blogger/`. To change this:

1. Edit `vite.config.js` before building:
   ```javascript
   export default defineConfig({
     base: '/', // Change to your desired path
   });
   ```

2. Rebuild: `npm run build`
3. Re-create zip

### HTTPS Required
- MediaRecorder API requires HTTPS
- Most recording features won't work on HTTP
- Ensure your domain has SSL certificate
- cPanel usually provides free Let's Encrypt SSL

### Google Cloud APIs
The app requires:
- **OAuth 2.0 Client ID** - For user authentication
- **API Key** - For Speech-to-Text, Drive, Blogger APIs
- **Authorized JavaScript Origins** - Add your domain in Google Cloud Console

**Update authorized origins:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add authorized JavaScript origins:
   - `https://yourdomain.com`
5. Add authorized redirect URIs:
   - `https://yourdomain.com/blogger/`
   
### Browser Compatibility
- **Chrome/Edge**: Full support ✅
- **Firefox**: Full support ✅
- **Safari**: iOS 14.3+, macOS Big Sur+ ✅
- **Older browsers**: May not support MediaRecorder API ⚠️

## Troubleshooting

### "MediaRecorder not supported"
- Check if accessing via HTTPS
- Update browser to latest version
- Check browser compatibility

### "Failed to access microphone"
- Ensure HTTPS is enabled
- Check browser permissions
- User must grant microphone access

### Google Sign-In Fails
- Verify authorized JavaScript origins in Google Cloud Console
- Check API credentials are correct
- Ensure OAuth consent screen is configured
- Check browser console for specific errors

### Recording Works but No Transcription
- Sign in to Google account first
- Verify Speech-to-Text API is enabled
- Check API key is valid
- Check browser console for API errors
- Verify API quotas not exceeded

### Service Worker Issues
- Clear browser cache and hard reload (Ctrl+Shift+R)
- Check if service worker is registered (DevTools → Application → Service Workers)
- Delete old service worker and reload

## Performance Tips

1. **Enable gzip compression** in cPanel (.htaccess):
   ```apache
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
   </IfModule>
   ```

2. **Enable browser caching** (.htaccess):
   ```apache
   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType text/css "access plus 1 year"
     ExpiresByType text/javascript "access plus 1 year"
     ExpiresByType application/javascript "access plus 1 year"
   </IfModule>
   ```

3. **Set proper MIME types** (usually automatic)

## Support

For issues or questions:
- Check [Technical Documentation](docs/technical.md)
- Check [Continuous Recording Docs](docs/continuous-recording.md)
- Review browser console errors
- Check Google Cloud Console logs

---

**Build Date:** February 16, 2026  
**Version:** 1.0.0  
**Build Tool:** Vite 7.3.1
