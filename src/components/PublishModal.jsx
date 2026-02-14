import { useState } from 'react';
import { publishPost } from '../services/bloggerService';
import { uploadImage } from '../services/driveService';
import { transcribeAudio } from '../services/speechToTextService';

/**
 * PublishModal Component
 * 
 * Modal for publishing a snippet to Blogger.
 * Handles transcription, image upload, and post creation.
 */
function PublishModal({ isOpen, onClose, snippet, blogId, onSuccess }) {
  const [title, setTitle] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [labels, setLabels] = useState('voice-journal');
  const [isPublishing, setIsPublishing] = useState(false);
  const [progress, setProgress] = useState({ step: '', percent: 0 });
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handlePublish = async () => {
    if (!blogId) {
      setError('No blog selected. Please configure Cloud Sync first.');
      return;
    }

    setIsPublishing(true);
    setError(null);
    setProgress({ step: 'Starting...', percent: 0 });

    try {
      let transcript = snippet.transcript || '';
      let imageUrl = null;

      // Step 1: Transcribe audio if needed
      if (snippet.type === 'audio' && snippet.audioBlob && !transcript) {
        setProgress({ step: 'Transcribing audio...', percent: 20 });
        const result = await transcribeAudio(snippet.audioBlob);
        transcript = result.transcript;
      }

      // Step 2: Upload image to Drive if present
      if (snippet.type === 'image' && snippet.mediaBlob) {
        setProgress({ step: 'Compressing image...', percent: 40 });
        const compressedBlob = await compressImage(snippet.mediaBlob, 1920, 1920, 0.85);
        
        setProgress({ step: 'Uploading image to Drive...', percent: 60 });
        const fileName = `journal-image-${snippet.id}.jpg`;
        const uploadResult = await uploadImage(compressedBlob, fileName, snippet.caption || '');
        imageUrl = uploadResult.directLink || uploadResult.webContentLink || uploadResult.webViewLink;
      }

      // Step 3: Publish to Blogger
      setProgress({ step: 'Publishing to Blogger...', percent: 80 });
      const labelsArray = labels.split(',').map(l => l.trim()).filter(l => l.length > 0);
      
      const result = await publishPost(
        blogId,
        snippet,
        transcript,
        imageUrl,
        {
          isDraft,
          labels: labelsArray,
          customTitle: title || null,
        }
      );

      setProgress({ step: 'Complete!', percent: 100 });

      if (onSuccess) {
        onSuccess(result);
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Publish error:', err);
      setError(err.message || 'Failed to publish');
      setIsPublishing(false);
    }
  };

  const handleCancel = () => {
    if (!isPublishing) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 id="publish-modal-title" className="text-xl font-semibold text-gray-900">
              Publish to Blogger
            </h2>
            {!isPublishing && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isPublishing ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
                <p className="text-gray-700 font-medium">{progress.step}</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="post-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Post Title <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="post-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Auto-generated from content"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Labels */}
              <div>
                <label htmlFor="post-labels" className="block text-sm font-medium text-gray-700 mb-2">
                  Labels <span className="text-gray-400">(comma-separated)</span>
                </label>
                <input
                  id="post-labels"
                  type="text"
                  value={labels}
                  onChange={(e) => setLabels(e.target.value)}
                  placeholder="voice-journal, daily-log"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Draft checkbox */}
              <div className="flex items-center">
                <input
                  id="is-draft"
                  type="checkbox"
                  checked={isDraft}
                  onChange={(e) => setIsDraft(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is-draft" className="ml-2 text-sm text-gray-700">
                  Save as draft (don't publish immediately)
                </label>
              </div>

              {/* Preview Info */}
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                <p className="font-medium mb-1">What will be published:</p>
                <ul className="space-y-1 ml-4">
                  {snippet.type === 'audio' && (
                    <li>• Audio transcript {snippet.transcript ? '(existing)' : '(will transcribe)'}</li>
                  )}
                  {snippet.type === 'image' && (
                    <li>• Image (uploaded to Drive)</li>
                  )}
                  {snippet.caption && <li>• Caption</li>}
                  <li>• Timestamp and duration</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  {isDraft ? 'Save Draft' : 'Publish'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublishModal;
