import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  X 
} from 'lucide-react';

/**
 * Toast Component - Shows temporary notification messages
 * 
 * @param {String} message - The message to display
 * @param {String} type - Type of toast ('success', 'error', 'warning', 'info')
 * @param {Function} onClose - Callback when toast is closed
 * @param {Number} duration - Auto-close duration in milliseconds (default: 5000)
 * @param {String} position - Toast position ('top-right', 'top-left', 'bottom-right', 'bottom-left')
 */
const Toast = ({ 
  message, 
  type = 'info', 
  onClose, 
  duration = 5000,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Show toast when message is provided
  useEffect(() => {
    if (message) {
      setIsVisible(true);
      setIsExiting(false);
    }
  }, [message]);

  // Auto-close timer
  useEffect(() => {
    if (message && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration]);

  // Don't render if no message
  if (!message) return null;

  /**
   * Handle toast close with animation
   */
  const handleClose = () => {
    setIsExiting(true);
    // Wait for exit animation to complete
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      onClose();
    }, 300);
  };

  /**
   * Get appropriate icon based on toast type
   * @returns {JSX.Element} - Icon component
   */
  const getIcon = () => {
    const iconClasses = "w-5 h-5 flex-shrink-0";
    
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClasses} text-green-600`} />;
      case 'error':
        return <XCircle className={`${iconClasses} text-red-600`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClasses} text-yellow-600`} />;
      default:
        return <Info className={`${iconClasses} text-blue-600`} />;
    }
  };

  /**
   * Get CSS classes based on toast type
   * @returns {String} - CSS class names
   */
  const getToastClasses = () => {
    const baseClasses = `
      flex items-start space-x-3 p-4 rounded-lg shadow-lg border-l-4 backdrop-blur-sm
      transition-all duration-300 transform max-w-md w-full
      ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
    `;

    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50/95 border-green-400 text-green-800`;
      case 'error':
        return `${baseClasses} bg-red-50/95 border-red-400 text-red-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-50/95 border-yellow-400 text-yellow-800`;
      default:
        return `${baseClasses} bg-blue-50/95 border-blue-400 text-blue-800`;
    }
  };

  /**
   * Get position classes for toast placement
   * @returns {String} - Position CSS classes
   */
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  /**
   * Get progress bar width based on remaining time
   */
  const getProgressBarStyle = () => {
    if (duration <= 0) return { display: 'none' };
    
    return {
      animation: `toast-progress ${duration}ms linear forwards`
    };
  };

  return (
    <>
      {/* Progress bar animation keyframes */}
      <style jsx>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {/* Toast container */}
      <div
        className={`fixed z-50 ${getPositionClasses()}`}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className={getToastClasses()}>
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>

          {/* Message content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium break-words">
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className={`
              flex-shrink-0 ml-2 p-1 rounded-md transition-colors duration-200
              ${type === 'success' ? 'text-green-600 hover:text-green-800 hover:bg-green-100' : ''}
              ${type === 'error' ? 'text-red-600 hover:text-red-800 hover:bg-red-100' : ''}
              ${type === 'warning' ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100' : ''}
              ${type === 'info' ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-100' : ''}
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50
              ${type === 'success' ? 'focus:ring-green-500' : ''}
              ${type === 'error' ? 'focus:ring-red-500' : ''}
              ${type === 'warning' ? 'focus:ring-yellow-500' : ''}
              ${type === 'info' ? 'focus:ring-blue-500' : ''}
            `}
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar (if duration is set) */}
        {duration > 0 && (
          <div className="w-full h-1 bg-black/10 rounded-b-lg overflow-hidden">
            <div
              className={`h-full rounded-b-lg ${
                type === 'success' ? 'bg-green-600' : 
                type === 'error' ? 'bg-red-600' : 
                type === 'warning' ? 'bg-yellow-600' : 
                'bg-blue-600'
              }`}
              style={getProgressBarStyle()}
            />
          </div>
        )}
      </div>
    </>
  );
};

/**
 * Toast Provider Hook - For managing multiple toasts
 * Usage example:
 * 
 * const { showToast } = useToast();
 * showToast('Message sent successfully!', 'success');
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast
  };
};

/**
 * ToastContainer Component - For rendering multiple toasts
 */
export const ToastContainer = ({ toasts = [], onRemove, position = 'top-right' }) => {
  if (toasts.length === 0) return null;

  const getContainerClasses = () => {
    const baseClasses = "fixed z-50 flex flex-col space-y-2";
    
    switch (position) {
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      default:
        return `${baseClasses} top-4 right-4`;
    }
  };

  return (
    <div className={getContainerClasses()}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={0} // Managed by container
          onClose={() => onRemove(toast.id)}
          position="relative" // Override position for container
        />
      ))}
    </div>
  );
};

export default Toast;