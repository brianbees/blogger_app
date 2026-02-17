import { useEffect } from 'react';

export default function Toast({ message, type = 'error', onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Style mappings for different toast types
  const styles = {
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: '⚠️'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: '⚠️'
    },
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: '✓'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: 'ℹ️'
    }
  };

  const style = styles[type] || styles.info;

  return (
    <div 
      className={`fixed top-20 left-4 right-4 max-w-md mx-auto ${style.bg} border rounded-xl p-4 shadow-lg z-50 animate-slide-down`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0" aria-hidden="true">{style.icon}</span>
        <p className={`flex-1 text-sm font-medium ${style.text}`}>{message}</p>
        <button
          onClick={onClose}
          className={`${style.text} opacity-70 hover:opacity-100 flex-shrink-0 -mt-1 -mr-1 p-1 rounded hover:bg-black/5`}
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
