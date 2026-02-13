import { useEffect } from 'react';

export default function Toast({ message, type = 'error', onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor = type === 'error' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';
  const textColor = type === 'error' ? 'text-red-800' : 'text-blue-800';
  const icon = type === 'error' ? '⚠️' : 'ℹ️';

  return (
    <div 
      className={`fixed top-20 left-4 right-4 max-w-md mx-auto ${bgColor} border rounded-xl p-4 shadow-lg z-50 animate-slide-down`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0" aria-hidden="true">{icon}</span>
        <p className={`flex-1 text-sm font-medium ${textColor}`}>{message}</p>
        <button
          onClick={onClose}
          className={`${textColor} opacity-70 hover:opacity-100 flex-shrink-0 -mt-1 -mr-1 p-1 rounded hover:bg-black/5`}
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
