import { useState, useEffect } from 'react';
import { initGoogleServices, requestAccessToken, signOut, isSignedIn, getUserProfile } from '../services/googleAuth';
import { getUserBlogs } from '../services/bloggerService';
import { getStorageInfo } from '../services/driveService';

/**
 * CloudSync Component
 * 
 * Manages Google account connection and displays cloud sync status.
 * Shows user profile, connected blog, and Drive storage info.
 */
function CloudSync({ isOpen, onClose, onSignInChange }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [selectedBlogId, setSelectedBlogId] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeServices();
  }, []);

  useEffect(() => {
    if (signedIn) {
      loadUserData();
    }
  }, [signedIn]);

  const initializeServices = async () => {
    console.log('CloudSync: Starting initialization...');
    try {
      await initGoogleServices();
      console.log('CloudSync: Google services initialized successfully');
      setIsInitialized(true);
      setSignedIn(isSignedIn());
    } catch (err) {
      console.error('CloudSync initialization error:', err);
      console.error('Error message:', err?.message);
      console.error('Error stack:', err?.stack);
      setError('Failed to initialize Google services. Check your API credentials.');
    }
  };

  const loadUserData = async () => {
    try {
      const [profile, userBlogs, storage] = await Promise.all([
        getUserProfile(),
        getUserBlogs(),
        getStorageInfo(),
      ]);

      setUserProfile(profile);
      setBlogs(userBlogs);
      setStorageInfo(storage);

      // Auto-select first blog if available
      if (userBlogs.length > 0 && !selectedBlogId) {
        setSelectedBlogId(userBlogs[0].id);
        localStorage.setItem('selectedBlogId', userBlogs[0].id);
        localStorage.setItem('selectedBlogUrl', userBlogs[0].url);
      }
    } catch (err) {
      setError('Failed to load user data');
      console.error(err);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      await requestAccessToken();
      setSignedIn(true);
      if (onSignInChange) {
        onSignInChange(true);
      }
    } catch (err) {
      setError('Sign-in failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    setSignedIn(false);
    setUserProfile(null);
    setBlogs([]);
    setSelectedBlogId(null);
    setStorageInfo(null);
    localStorage.removeItem('selectedBlogId');
    localStorage.removeItem('selectedBlogUrl');
    
    if (onSignInChange) {
      onSignInChange(false);
    }
  };

  const handleBlogSelect = (blogId) => {
    setSelectedBlogId(blogId);
    localStorage.setItem('selectedBlogId', blogId);
    // Also store blog URL
    const selectedBlog = blogs.find(b => b.id === blogId);
    if (selectedBlog) {
      localStorage.setItem('selectedBlogUrl', selectedBlog.url);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-sync-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 id="cloud-sync-title" className="text-xl font-semibold text-gray-900">
              Cloud Sync
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!isInitialized ? (
            <div className="text-center py-8 text-gray-500">
              Initializing Google services...
            </div>
          ) : !signedIn ? (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Sign in with your Google account to enable:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 ml-4">
                <li>• Publish voice notes to Blogger</li>
                <li>• Backup data to Google Drive</li>
                <li>• Transcribe recordings with Speech-to-Text</li>
              </ul>
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Profile */}
              {userProfile && (
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                  {userProfile.picture && (
                    <img
                      src={userProfile.picture}
                      alt={userProfile.name}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{userProfile.name}</p>
                    <p className="text-sm text-gray-500 truncate">{userProfile.email}</p>
                  </div>
                </div>
              )}

              {/* Blog Selection */}
              {blogs.length > 0 && (
                <div>
                  <label htmlFor="blog-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Blog for Publishing
                  </label>
                  <select
                    id="blog-select"
                    value={selectedBlogId || ''}
                    onChange={(e) => handleBlogSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {blogs.map((blog) => (
                      <option key={blog.id} value={blog.id}>
                        {blog.name} ({blog.posts} posts)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {blogs.length === 0 && (
                <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                  No Blogger blogs found. Create one at{' '}
                  <a
                    href="https://www.blogger.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    blogger.com
                  </a>
                </div>
              )}

              {/* Storage Info */}
              {storageInfo && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Google Drive Storage</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Used:</span>
                      <span className="font-medium">{formatBytes(storageInfo.usage)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">{formatBytes(storageInfo.limit)}</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(storageInfo.usage / storageInfo.limit) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CloudSync;
