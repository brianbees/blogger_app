# 🚨 Security Incident Response Plan

**Date**: February 14, 2026  
**Severity**: **CRITICAL**  
**Issue**: Google Cloud API credentials exposed in public GitHub repository

---

## 📋 Executive Summary

Three production build zip files (`blogger_app_production.zip`, `blogger_app_complete.zip`, `voice-journal-build.zip`) were committed to the public GitHub repository containing hardcoded Google Cloud credentials bundled in JavaScript files.

### **Exposed Credentials:**
```
Client ID: 440811026065-h67q59u6k02e1llif0rse33p567p39t4.apps.googleusercontent.com
API Key: AIzaSyDIcWAEO1DxVRuDvq9UiN4ByEnkaMQUB8s
```

### **Exposure Timeline:**
- **First Commit**: `524aae7` - February 14, 2026 11:35 AM
- **Last Update**: `478ec5b` - February 14, 2026 1:59 PM
- **Discovered**: February 14, 2026 (same day)
- **Status**: Files removed from working tree, but still in git history

---

## ⚡ IMMEDIATE ACTIONS REQUIRED (Do Now!)

### 1. Revoke Google Cloud Credentials

**Revoke the API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services → Credentials**
3. Find API Key: `AIzaSyDIcWAEO1DxVRuDvq9UiN4ByEnkaMQUB8s`
4. Click **DELETE** (not just restrict)
5. Create a new API Key with proper restrictions

**Revoke OAuth Client ID:**
1. In the same **Credentials** section
2. Find OAuth 2.0 Client ID: `440811026065-h67q59u6k02e1llif0rse33p567p39t4.apps.googleusercontent.com`
3. Click **DELETE**
4. Create a new OAuth 2.0 Client ID

### 2. Purge Git History

The files have been removed from the current branch, but they still exist in git history and on GitHub. You must remove them completely:

#### Option A: Using git-filter-repo (Recommended)

```powershell
# Install git-filter-repo (if not already installed)
pip install git-filter-repo

# Backup your repository first
cd ..
Copy-Item -Recurse 0012_blogger_app 0012_blogger_app_backup

# Remove files from entire git history
cd 0012_blogger_app
git-filter-repo --path blogger_app_production.zip --path blogger_app_complete.zip --path voice-journal-build.zip --invert-paths --force
```

#### Option B: Using BFG Repo-Cleaner

```powershell
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
# Run BFG
java -jar bfg.jar --delete-files "*.zip" .

# Cleanup
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 3. Force Push to GitHub

⚠️ **Warning**: This will rewrite history on GitHub. Notify any collaborators first.

```powershell
# Force push to overwrite remote history
git push origin --force --all
git push origin --force --tags

# Verify the files are gone from GitHub
# Go to: https://github.com/brianbees/blogger_app/commits/main
# Check that the zip files no longer appear in any commit
```

### 4. Contact GitHub Support (Optional but Recommended)

GitHub caches old commits even after force push. Contact them to purge cached data:

1. Go to: https://support.github.com/contact
2. Select: **Sensitive Data Removal**
3. Provide:
   - Repository: `brianbees/blogger_app`
   - Commits: `524aae7`, `478ec5b`, and any others containing .zip files
   - Reason: "Accidentally committed production builds containing Google Cloud API credentials"

---

## 🔐 Credential Rotation Steps

### Step 1: Create New API Key

1. In Google Cloud Console → **APIs & Services → Credentials**
2. Click **Create Credentials → API Key**
3. Click **Restrict Key**:
   - **Application restrictions**: HTTP referrers (websites)
   - Add: `https://yourdomain.com/*` (your production domain)
   - Add: `https://localhost:5173/*` (for local development)
   - **Do NOT** add `*` or leave unrestricted
4. **API restrictions** → **Restrict key**:
   - Select only: Blogger API v3, Google Drive API v3, Cloud Speech-to-Text API v1
5. Copy the new API key

### Step 2: Create New OAuth 2.0 Client ID

1. Click **Create Credentials → OAuth 2.0 Client ID**
2. Select **Web application**
3. Add **Authorized JavaScript origins**:
   - `https://yourdomain.com`
   - `https://localhost:5173` (for development)
4. Add **Authorized redirect URIs**:
   - `https://yourdomain.com`
   - `https://localhost:5173`
5. Copy the new Client ID

### Step 3: Update Local Environment

1. Update your local `.env` file:
   ```env
   VITE_GOOGLE_CLIENT_ID=<new-client-id>.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=<new-api-key>
   ```

2. **IMPORTANT**: Test locally before deploying!
   ```powershell
   npm run dev
   ```

3. Verify all cloud features work:
   - Sign in with Google
   - Test transcription
   - Test publishing to Blogger
   - Test Drive sync

---

## 📊 Impact Assessment

### Potential Risks:
- ✅ **Unauthorized API usage**: Monitor Google Cloud Console for unusual activity
- ✅ **Data access**: Check Blogger and Drive for unauthorized posts/files
- ✅ **Cost implications**: Review billing for unexpected charges

### Mitigation Factors:
- ✅ Credentials discovered same day (fast response)
- ✅ API Key had restrictions (if configured)
- ✅ OAuth requires user authentication (can't access your account without login)
- ⚠️ Anyone with the API key could use your quota

### Monitoring Steps:
1. **Google Cloud Console** → **APIs & Services** → **Dashboard**
   - Monitor API usage for next 7 days
   - Look for traffic spikes
   
2. **Check Billing**:
   - Review charges daily for next week
   - Set up budget alerts if not already configured

3. **Review Blogger Posts**:
   - Check for unauthorized publications
   
4. **Review Drive Files**:
   - Check for unauthorized file access/uploads

---

## 🛡️ Prevention Measures (Implemented)

### Completed:
- ✅ Added `*.zip` to `.gitignore`
- ✅ Added `*.tar`, `*.tar.gz` to `.gitignore`  
- ✅ Added `dist/` and `build/` folders to `.gitignore`
- ✅ Removed zip files from working tree
- ✅ Committed security fixes

### Still Required:
- ⬜ Purge files from git history
- ⬜ Force push to GitHub
- ⬜ Rotate credentials
- ⬜ Contact GitHub Support for cache purge

---

## 📝 Best Practices Going Forward

### 1. Never Commit Build Artifacts

Production builds should never be in git:
```gitignore
# Add to .gitignore (already done)
dist/
build/
*.zip
*.tar
*.tar.gz
```

### 2. Use Deployment Automation

Instead of committing zip files, use:
- **GitHub Actions** for automated deployments
- **Netlify/Vercel** for static hosting with auto-deploy
- **CI/CD pipelines** that build on remote servers

### 3. Verify Builds Don't Bundle Secrets

Vite bundles `VITE_*` environment variables at build time! Options:

**Option A: Use Runtime Configuration (Recommended)**
```javascript
// config.js loaded from server at runtime
window.CONFIG = {
  GOOGLE_CLIENT_ID: '<from-server>',
  GOOGLE_API_KEY: '<from-server>'
};
```

**Option B: Accept That Client-Side Credentials Are Public**
Since this is a client-side app, credentials will always be visible. Mitigation:
- Use strict API key restrictions (referrer, IP)
- Use OAuth (requires user authentication)
- Monitor usage quotas
- Use Firebase/Auth0 for backend-proxied API calls

### 4. Pre-Commit Hooks

Install git hooks to prevent credential commits:

```powershell
# Install pre-commit framework
pip install pre-commit

# Create .pre-commit-config.yaml
```

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

### 5. Regular Security Audits

- Review `.gitignore` monthly
- Use GitHub's secret scanning (enable in repo settings)
- Run `git log --all -p | grep -i "api"` to scan history
- Use tools like `trufflehog` or `gitleaks`

---

## 📞 Incident Contacts

- **Google Cloud Support**: https://cloud.google.com/support
- **GitHub Support**: https://support.github.com/contact
- **Repository Owner**: brianbees <brian@urbanbees.co.uk>

---

## ✅ Verification Checklist

After completing remediation, verify:

- [ ] Old credentials revoked in Google Cloud Console
- [ ] New credentials created with proper restrictions
- [ ] Local `.env` updated with new credentials
- [ ] Zip files removed from git history (run: `git log --all --full-history -- *.zip`)
- [ ] Force pushed to GitHub
- [ ] Zip files not visible in any GitHub commit history
- [ ] Contacted GitHub Support for cache purge
- [ ] No unusual activity in Google Cloud Console
- [ ] No unexpected billing charges
- [ ] All collaborators notified of force push
- [ ] Pre-commit hooks installed (optional)
- [ ] Tested app with new credentials

---

## 📚 Additional Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Google Cloud: API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [Git Filter-Repo Documentation](https://github.com/newren/git-filter-repo)
- [OWASP: Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)

---

**Status**: ⚠️ INCIDENT ACTIVE - Immediate action required  
**Next Review**: After credential rotation and history purge completed
