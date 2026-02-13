import { useState, useEffect } from 'react';

export default function ImagePreviewSheet({ imageFile, onSave, onCancel }) {
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  const handleSave = () => {
    onSave(imageFile, caption.trim() || null);
    setCaption('');
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  if (!imageFile) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Sheet */}
      <div 
        className="fixed inset-x-0 bottom-20 px-4 pb-safe z-50" 
        role="dialog" 
        aria-label="Image preview"
      >
        <div className="rounded-2xl bg-white shadow-xl p-5 border border-gray-200 max-w-md mx-auto max-h-[70vh] overflow-y-auto">
          {/* Preview Image */}
          <div className="mb-4 rounded-xl overflow-hidden bg-gray-100">
            {previewUrl && (
              <img 
                src={previewUrl} 
                alt="Selected image preview" 
                className="w-full h-auto max-h-64 object-cover"
              />
            )}
          </div>

          {/* Caption Input */}
          <div className="mb-4">
            <label htmlFor="image-caption" className="block text-sm font-medium text-gray-700 mb-2">
              Caption (optional)
            </label>
            <input
              id="image-caption"
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">{caption.length}/200</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 text-base font-semibold active:scale-[0.98] transition-all min-h-[48px]"
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 text-base font-semibold active:scale-[0.98] transition-all shadow-lg min-h-[48px]"
              aria-label="Save image"
            >
              Save Image
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
