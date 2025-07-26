import React, { useEffect, useRef } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  X, 
  Activity,
  Clock,
  Users
} from 'lucide-react';

/**
 * ProgressLog Component - Shows real-time progress and detailed logs
 * 
 * @param {Boolean} isActive - Whether the sending process is currently active
 * @param {Object} progress - Progress object with current and total counts
 * @param {Array} logs - Array of log objects with type and message
 * @param {Function} onClose - Callback to close/clear the progress log
 */
const ProgressLog = ({ isActive, progress, logs, onClose }) => {
  // Reference to log container for auto-scrolling
  const logContainerRef = useRef(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Don't render if not active and no logs
  if (!isActive && logs.length === 0) return null;

  /**
   * Calculate progress percentage
   * @returns {Number} - Progress percentage (0-100)
   */
  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  };

  /**
   * Get appropriate icon for log message type
   * @param {String} type - Log message type ('success', 'error', 'info')
   * @returns {JSX.Element} - Icon component
   */
  const getLogIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />;
      default:
        return <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />;
    }
  };

  /**
   * Get CSS classes for log message styling
   * @param {String} type - Log message type
   * @returns {String} - CSS class names
   */
  const getLogClasses = (type) => {
    const baseClasses = "flex items-start space-x-2 text-sm p-3 rounded-lg border-l-4 transition-colors duration-200";
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 text-green-800 border-green-400`;
      case 'error':
        return `${baseClasses} bg-red-50 text-red-800 border-red-400`;
      default:
        return `${baseClasses} bg-blue-50 text-blue-800 border-blue-400`;
    }
  };

  /**
   * Count messages by type for statistics
   * @returns {Object} - Object with success, error, and info counts
   */
  const getLogStats = () => {
    return logs.reduce((stats, log) => {
      stats[log.type] = (stats[log.type] || 0) + 1;
      return stats;
    }, { success: 0, error: 0, info: 0 });
  };

  const logStats = getLogStats();
  const progressPercentage = getProgressPercentage();

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isActive ? (
              <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
            ) : (
              <Clock className="w-5 h-5 text-gray-500" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {isActive ? 'Sending in Progress...' : 'Process Complete'}
            </h3>
          </div>
          
          {/* Status badge */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isActive 
              ? 'bg-blue-100 text-blue-800' 
              : progress.total > 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
          }`}>
            {isActive ? 'Active' : 'Completed'}
          </div>
        </div>

        {/* Close button (only when not active) */}
        {!isActive && logs.length > 0 && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded focus-ring"
            aria-label="Close progress log"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Progress Section */}
      {progress.total > 0 && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          {/* Progress stats */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Progress: {progress.current} / {progress.total} contacts
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {progressPercentage}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="progress-bar bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Statistics */}
          {logs.length > 0 && (
            <div className="flex items-center justify-between mt-3 text-xs">
              <div className="flex space-x-4">
                {logStats.success > 0 && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>{logStats.success} successful</span>
                  </div>
                )}
                {logStats.error > 0 && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <XCircle className="w-3 h-3" />
                    <span>{logStats.error} failed</span>
                  </div>
                )}
                {logStats.info > 0 && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>{logStats.info} info</span>
                  </div>
                )}
              </div>
              
              {isActive && (
                <div className="text-gray-500 animate-pulse">
                  Processing...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Log Messages */}
      {logs.length > 0 && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">
              Activity Log ({logs.length} entries)
            </h4>
            {logs.length > 5 && (
              <span className="text-xs text-gray-500">
                Scroll to see all messages
              </span>
            )}
          </div>
          
          {/* Scrollable log container */}
          <div
            ref={logContainerRef}
            className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar"
            role="log"
            aria-live="polite"
            aria-label="Message sending activity log"
          >
            {logs.map((log, index) => (
              <div
                key={index}
                className={getLogClasses(log.type)}
                role="status"
              >
                {getLogIcon(log.type)}
                <span className="flex-1 break-words">
                  {log.message}
                </span>
              </div>
            ))}
          </div>

          {/* Show loading indicator when active */}
          {isActive && (
            <div className="mt-3 flex items-center justify-center text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Sending messages...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state when no progress yet */}
      {progress.total === 0 && logs.length === 0 && isActive && (
        <div className="p-8 text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      )}
    </div>
  );
};

export default ProgressLog;