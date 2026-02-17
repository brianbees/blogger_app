import { useEffect, useRef } from 'react';

/**
 * ConfirmDialog Component
 * 
 * Reusable confirmation dialog to replace window.confirm()
 * Mobile-friendly modal with backdrop and animations
 */
function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', dangerous = false }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the dialog when it opens
      dialogRef.current?.focus();

      // Trap focus inside dialog
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-[90%] mx-4 p-6 transform transition-all duration-200 scale-100 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Title */}
        {title && (
          <h2
            id="confirm-dialog-title"
            className="text-xl font-semibold text-gray-900 mb-3"
          >
            {title}
          </h2>
        )}

        {/* Message */}
        <p className="text-gray-700 mb-6 whitespace-pre-line leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors min-w-[100px] touch-manipulation"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-3 rounded-xl font-medium text-white transition-colors min-w-[100px] touch-manipulation ${
              dangerous
                ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
