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
  });

  gisInitialized = true;
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
    
    // Try to restore token from localStorage
    try {
      const storedToken = localStorage.getItem('google_access_token');
      const timestamp = localStorage.getItem('google_token_timestamp');
      
      if (storedToken && timestamp) {
        // Check if token is less than 50 minutes old (tokens expire after 1 hour)
        const age = Date.now() - parseInt(timestamp);
        if (age < 50 * 60 * 1000) {
          currentAccessToken = storedToken;
          window.gapi.client.setToken({ access_token: storedToken });
          console.log('Restored Google access token from localStorage');
        } else {
          // Token expired, remove it
          localStorage.removeItem('google_access_token');
          localStorage.removeItem('google_token_timestamp');
          console.log('Stored token expired, cleared from localStorage');
        }
      }
    } catch (e) {
      console.warn('Failed to restore token from localStorage:', e);
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

      currentAccessToken = response.access_token;
      window.gapi.client.setToken({ access_token: response.access_token });
      
      // Also persist to localStorage as backup
      try {
        localStorage.setItem('google_access_token', response.access_token);
        localStorage.setItem('google_token_timestamp', Date.now().toString());
      } catch (e) {
        console.warn('Failed to persist token to localStorage:', e);
      }
      
      resolve(response.access_token);
    };

    // Check if already have valid token
    const token = window.gapi.client.getToken();
    if (token !== null) {
      currentAccessToken = token.access_token;
      resolve(token.access_token);
    } else {
      // Request access token (will show consent screen if needed)
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  });
}

/**
 * Sign out and revoke access token
 */
export function signOut() {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {
      console.log('Access token revoked');
    });
    window.gapi.client.setToken(null);
    currentAccessToken = null;
  }
  
  // Clear from localStorage
  try {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_timestamp');
  } catch (e) {
    console.warn('Failed to clear token from localStorage:', e);
  }
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
 */
export async function ensureValidToken() {
  // Initialize services if not already done
  if (!gapiInitialized || !gisInitialized) {
    await initGoogleServices();
  }

  if (!isSignedIn()) {
    throw new Error('User not signed in. Please sign in using the cloud icon in the header.');
  }
  
  return getAccessToken();
}
