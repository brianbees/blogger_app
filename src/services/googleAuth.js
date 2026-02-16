/**
 * Google OAuth2 Client-Side Authentication
 * 
 * Implements OAuth2 implicit flow for browser-based authentication.
 * No backend required - uses Google's JavaScript library.
 * 
 * Required scopes:
 * - https://www.googleapis.com/auth/blogger - Blogger API
 * - https://www.googleapis.com/auth/drive.file - Drive file upload
 * - https://www.googleapis.com/auth/cloud-platform - Speech-to-Text API
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Debug logging for production
console.log('Google Auth Config:', {
  hasClientId: !!GOOGLE_CLIENT_ID,
  hasApiKey: !!GOOGLE_API_KEY,
  clientIdLength: GOOGLE_CLIENT_ID?.length || 0,
  apiKeyLength: GOOGLE_API_KEY?.length || 0
});

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/blogger',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/cloud-platform',
].join(' ');

const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/blogger/v3/rest',
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  'https://speech.googleapis.com/$discovery/rest?version=v1',
];

let tokenClient = null;
let gapiInitialized = false;
let gisInitialized = false;
let currentAccessToken = null;
let tokenExpiresAt = null;
let refreshTimer = null;

// Token refresh settings
const TOKEN_LIFETIME = 3600000; // 1 hour in milliseconds (Google's default)
const REFRESH_BEFORE_EXPIRY = 300000; // Refresh 5 minutes before expiry
const STAY_SIGNED_IN_KEY = 'google_stay_signed_in'; // User preference

/**
 * Load Google API client library
 */
function loadGapiScript() {
  return new Promise((resolve, reject) => {
    if (window.gapi) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google API script'));
    document.head.appendChild(script);
  });
}

/**
 * Load Google Identity Services library
 */
function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
    document.head.appendChild(script);
  });
}

/**
 * Initialize Google API client
 */
async function initializeGapiClient() {
  if (gapiInitialized) return;

  await new Promise((resolve, reject) => {
    window.gapi.load('client', { callback: resolve, onerror: reject });
  });

  await window.gapi.client.init({
    apiKey: GOOGLE_API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  });

  gapiInitialized = true;
}

/**
 * Initialize Google Identity Services
 */
function initializeGisClient() {
  if (gisInitialized) return;

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined at request time
    // Use 'select_account' for better UX on subsequent sign-ins
  });

  gisInitialized = true;
}

/**
 * Schedule automatic token refresh
 * Refreshes token 5 minutes before expiration
 */
function scheduleTokenRefresh() {
  // Clear any existing refresh timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  if (!tokenExpiresAt) return;

  const now = Date.now();
  const timeUntilRefresh = tokenExpiresAt - now - REFRESH_BEFORE_EXPIRY;

  // Only schedule if we have enough time
  if (timeUntilRefresh > 0) {
    console.log(`[Auth] Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`);
    
    refreshTimer = setTimeout(async () => {
      console.log('[Auth] Auto-refreshing token...');
      try {
        await silentTokenRefresh();
      } catch (error) {
        console.error('[Auth] Auto-refresh failed:', error);
        // Clear stored token if refresh fails
        clearStoredToken();
      }
    }, timeUntilRefresh);
  } else {
    console.warn('[Auth] Token already expired or expiring soon');
  }
}

/**
 * Silent token refresh (no consent screen)
 * Uses prompt: '' for seamless refresh
 */
function silentTokenRefresh() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Identity Services not initialized'));
      return;
    }

    // Check if user wants to stay signed in
    const staySignedIn = getStaySignedInPreference();
    if (!staySignedIn) {
      console.log('[Auth] Stay signed in disabled, skipping auto-refresh');
      reject(new Error('Auto-refresh disabled by user preference'));
      return;
    }

    tokenClient.callback = (response) => {
      if (response.error) {
        console.error('[Auth] Silent refresh failed:', response.error);
        reject(new Error(response.error));
        return;
      }

      console.log('[Auth] Token refreshed successfully');
      currentAccessToken = response.access_token;
      tokenExpiresAt = Date.now() + TOKEN_LIFETIME;
      
      window.gapi.client.setToken({ access_token: response.access_token });
      
      // Persist token and expiry
      if (staySignedIn) {
        try {
          localStorage.setItem('google_access_token', response.access_token);
          localStorage.setItem('google_token_timestamp', Date.now().toString());
          localStorage.setItem('google_token_expires', tokenExpiresAt.toString());
          console.log('[Auth] Token persisted to localStorage');
        } catch (e) {
          console.warn('[Auth] Failed to persist token:', e);
        }
      }
      
      // Schedule next refresh
      scheduleTokenRefresh();
      
      resolve(response.access_token);
    };

    // Request token with empty prompt for silent refresh
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

/**
 * Clear stored token from localStorage
 */
function clearStoredToken() {
  try {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_timestamp');
    localStorage.removeItem('google_token_expires');
    console.log('[Auth] Cleared stored token');
  } catch (e) {
    console.warn('[Auth] Failed to clear stored token:', e);
  }
}

/**
 * Get user's "stay signed in" preference
 */
export function getStaySignedInPreference() {
  try {
    const pref = localStorage.getItem(STAY_SIGNED_IN_KEY);
    return pref === null ? true : pref === 'true'; // Default to true
  } catch (e) {
    return true; // Default to enabled
  }
}

/**
 * Set user's "stay signed in" preference
 */
export function setStaySignedInPreference(enabled) {
  try {
    localStorage.setItem(STAY_SIGNED_IN_KEY, enabled.toString());
    console.log(`[Auth] Stay signed in ${enabled ? 'enabled' : 'disabled'}`);
    
    if (!enabled) {
      // Clear token if user disables stay signed in
      clearStoredToken();
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
      }
    } else if (isSignedIn()) {
      // Schedule refresh if enabling and already signed in
      scheduleTokenRefresh();
    }
  } catch (e) {
    console.warn('[Auth] Failed to save preference:', e);
  }
}

/**
 * Validate token is still valid
 */
async function validateToken(token) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    // Check if token has required scopes and is not expired
    return data.expires_in > 0;
  } catch (error) {
    console.error('[Auth] Token validation failed:', error);
    return false;
  }
}

/**
 * Initialize all Google services
 */
export async function initGoogleServices() {
  console.log('initGoogleServices: Checking credentials...', {
    GOOGLE_CLIENT_ID,
    GOOGLE_API_KEY,
    hasClientId: !!GOOGLE_CLIENT_ID,
    hasApiKey: !!GOOGLE_API_KEY
  });
  
  if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
    const error = `Google API credentials not configured. ClientID: ${!!GOOGLE_CLIENT_ID}, APIKey: ${!!GOOGLE_API_KEY}`;
    console.error(error);
    throw new Error(error);
  }

  console.log('initGoogleServices: Loading scripts...');
  try {
    await Promise.all([loadGapiScript(), loadGisScript()]);
    console.log('initGoogleServices: Scripts loaded, initializing clients...');
    await initializeGapiClient();
    initializeGisClient();
    console.log('initGoogleServices: Clients initialized');
    
    // Try to restore token from localStorage if user wants to stay signed in
    const staySignedIn = getStaySignedInPreference();
    if (staySignedIn) {
      try {
        const storedToken = localStorage.getItem('google_access_token');
        const timestamp = localStorage.getItem('google_token_timestamp');
        const expires = localStorage.getItem('google_token_expires');
        
        if (storedToken && timestamp) {
          const now = Date.now();
          const tokenAge = now - parseInt(timestamp);
          const expiresAt = expires ? parseInt(expires) : parseInt(timestamp) + TOKEN_LIFETIME;
          
          // Check if token hasn't expired yet
          if (expiresAt > now) {
            console.log('[Auth] Found stored token, validating...');
            
            // Validate token with Google
            const isValid = await validateToken(storedToken);
            
            if (isValid) {
              currentAccessToken = storedToken;
              tokenExpiresAt = expiresAt;
              window.gapi.client.setToken({ access_token: storedToken });
              console.log(`[Auth] Restored valid token (expires in ${Math.round((expiresAt - now) / 1000 / 60)} min)`);
              
              // Schedule automatic refresh
              scheduleTokenRefresh();
            } else {
              console.log('[Auth] Stored token invalid, clearing');
              clearStoredToken();
            }
          } else {
            // Token expired
            console.log('[Auth] Stored token expired, attempting silent refresh...');
            clearStoredToken();
            
            // Try silent refresh
            try {
              await silentTokenRefresh();
              console.log('[Auth] Silent refresh successful after expiry');
            } catch (refreshError) {
              console.log('[Auth] Silent refresh failed, user will need to sign in manually');
            }
          }
        } else {
          console.log('[Auth] No stored token found');
        }
      } catch (e) {
        console.warn('[Auth] Failed to restore token:', e);
        clearStoredToken();
      }
    } else {
      console.log('[Auth] Stay signed in disabled, not restoring token');
      clearStoredToken();
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Google services:', error);
    throw error;
  }
}

/**
 * Request OAuth2 access token
 * Opens consent popup if needed
 */
export function requestAccessToken() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Identity Services not initialized'));
      return;
    }

    tokenClient.callback = (response) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }

      console.log('[Auth] Access token received');
      currentAccessToken = response.access_token;
      tokenExpiresAt = Date.now() + TOKEN_LIFETIME;
      
      window.gapi.client.setToken({ access_token: response.access_token });
      
      // Persist token if user wants to stay signed in
      const staySignedIn = getStaySignedInPreference();
      if (staySignedIn) {
        try {
          localStorage.setItem('google_access_token', response.access_token);
          localStorage.setItem('google_token_timestamp', Date.now().toString());
          localStorage.setItem('google_token_expires', tokenExpiresAt.toString());
          console.log('[Auth] Token persisted (stay signed in enabled)');
        } catch (e) {
          console.warn('[Auth] Failed to persist token:', e);
        }
        
        // Schedule automatic refresh
        scheduleTokenRefresh();
      } else {
        console.log('[Auth] Token not persisted (stay signed in disabled)');
      }
      
      resolve(response.access_token);
    };

    // Check if already have valid token
    const token = window.gapi.client.getToken();
    if (token !== null && currentAccessToken) {
      // Validate token expiry
      if (tokenExpiresAt && tokenExpiresAt > Date.now()) {
        console.log('[Auth] Using existing valid token');
        resolve(currentAccessToken);
        return;
      } else {
        console.log('[Auth] Existing token expired, requesting new one');
      }
    }

    // Request access token
    // Use 'select_account' for better UX (shows account picker)
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  });
}

/**
 * Sign out and revoke access token
 */
export function signOut() {
  console.log('[Auth] Signing out...');
  
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {
      console.log('[Auth] Access token revoked');
    });
    window.gapi.client.setToken(null);
  }
  
  // Clear state
  currentAccessToken = null;
  tokenExpiresAt = null;
  
  // Clear refresh timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
    console.log('[Auth] Refresh timer cleared');
  }
  
  // Clear from localStorage
  clearStoredToken();
}

/**
 * Check if user is currently signed in
 */
export function isSignedIn() {
  if (!gapiInitialized || !window.gapi || !window.gapi.client) {
    return false;
  }
  
  const token = window.gapi.client.getToken();
  return token !== null && currentAccessToken !== null;
}

/**
 * Get current access token
 */
export function getAccessToken() {
  return currentAccessToken;
}

/**
 * Get current user profile
 */
export async function getUserProfile() {
  if (!isSignedIn()) {
    throw new Error('User not signed in');
  }

  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${currentAccessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Handle token refresh (tokens expire after 1 hour)
 * Automatically refreshes if token is expiring soon
 */
export async function ensureValidToken() {
  // Initialize services if not already done
  if (!gapiInitialized || !gisInitialized) {
    await initGoogleServices();
  }

  if (!isSignedIn()) {
    throw new Error('User not signed in. Please sign in using the cloud icon in the header.');
  }
  
  // Check if token is expiring soon (within 5 minutes)
  const now = Date.now();
  if (tokenExpiresAt && (tokenExpiresAt - now) < REFRESH_BEFORE_EXPIRY) {
    console.log('[Auth] Token expiring soon, refreshing...');
    
    try {
      // Try silent refresh
      await silentTokenRefresh();
      console.log('[Auth] Token refreshed proactively');
    } catch (error) {
      console.error('[Auth] Failed to refresh token:', error);
      // If silent refresh fails, user will need to sign in again
      throw new Error('Session expired. Please sign in again.');
    }
  }
  
  return getAccessToken();
}
