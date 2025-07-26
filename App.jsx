import React, { useState, useEffect } from 'react';
import FileDropzone from './FileDropzone';
import ProgressLog from './ProgressLog';
import Toast from './Toast';
import { Send, Loader2, X, RefreshCw, Download, Settings } from 'lucide-react';

/**
 * Main App Component - WhatsApp Bulk Sender Interface
 * 
 * This is the main component that orchestrates the entire application:
 * - File upload handling (recipients Excel + optional attachment)
 * - Real-time progress tracking via API polling
 * - User interface state management
 * - Error handling and user feedback
 */
const App = () => {
  // Core application state using React hooks
  const [recipientsFile, setRecipientsFile] = useState(null);      // Excel file with recipients
  const [attachmentFile, setAttachmentFile] = useState(null);      // Optional attachment file
  const [isSending, setIsSending] = useState(false);              // Sending process status
  const [progress, setProgress] = useState({ current: 0, total: 0 }); // Progress tracking
  const [logs, setLogs] = useState([]);                          // Activity logs array
  const [toast, setToast] = useState({ message: '', type: '' }); // Toast notification state

  // File format validation arrays
  const excelFormats = ['.xlsx', '.xls'];                        // Accepted Excel formats
  const attachmentFormats = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.txt']; // Accepted attachment formats

  /**
   * Real-time progress polling effect
   * Polls the backend every 2 seconds when sending is active to get:
   * - Current progress (contacts processed)
   * - New log entries
   * - Process completion status
   */
  useEffect(() => {
    let interval;
    
    if (isSending) {
      interval = setInterval(async () => {
        try {
          // Fetch current progress from backend API
          const response = await fetch('/api/progress');
          
          if (!response.ok) {
            console.warn('Failed to fetch progress:', response.status);
            return;
          }
          
          const data = await response.json();
          
          // Update progress state
          setProgress({ current: data.current, total: data.total });
          
          // Update logs with new entries only (avoid duplicates)
          if (data.logs && data.logs.length > logs.length) {
            const newLogs = data.logs.slice(logs.length).map(logMessage => {
              // Categorize log messages based on content
              if (logMessage.includes('✓') || logMessage.toLowerCase().includes('success')) {
                return { type: 'success', message: logMessage };
              } else if (logMessage.includes('✗') || logMessage.toLowerCase().includes('error') || logMessage.toLowerCase().includes('failed')) {
                return { type: 'error', message: logMessage };
              } else {
                return { type: 'info', message: logMessage };
              }
            });
            
            // Append new logs to existing ones
            setLogs(prev => [...prev, ...newLogs]);
          }
          
          // Check if the sending process has completed
          if (!data.is_active && data.total > 0) {
            setIsSending(false);
            
            // Fetch final completion status
            try {
              const statusResponse = await fetch('/api/status');
              const statusData = await statusResponse.json();
              
              // Show completion toast based on results
              if (statusData.failureCount === 0) {
                showToast(`All ${statusData.successCount} messages sent successfully!`, 'success');
              } else {
                showToast(
                  `Completed: ${statusData.successCount} sent, ${statusData.failureCount} failed`, 
                  statusData.successCount > 0 ? 'success' : 'error'
                );
              }
            } catch (statusError) {
              console.error('Failed to fetch final status:', statusError);
            }
          }
        } catch (error) {
          console.error('Progress polling error:', error);
          // Continue polling even if one request fails
        }
      }, 2000); // Poll every 2 seconds
    }

    // Cleanup interval on component unmount or when sending stops
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSending, logs.length]); // Re-run effect when sending status or log count changes

  /**
   * Show toast notification
   * @param {String} message - Message to display
   * @param {String} type - Toast type ('success', 'error', 'warning', 'info')
   */
  const showToast = (message, type) => {
    setToast({ message, type });
  };

  /**
   * Clear all selected files
   */
  const clearFiles = () => {
    setRecipientsFile(null);
    setAttachmentFile(null);
  };

  /**
   * Clear progress logs and reset progress
   */
  const clearLogs = () => {
    setLogs([]);
    setProgress({ current: 0, total: 0 });
  };

  /**
   * Main function to start the WhatsApp bulk sending process
   * 
   * This function:
   * 1. Validates that required files are selected
   * 2. Creates FormData for file upload
   * 3. Sends files to backend API
   * 4. Initiates real-time progress tracking
   */
  const handleStartSending = async () => {
    // Validation: Check if recipients file is selected
    if (!recipientsFile) {
      showToast('Please select a recipients Excel file', 'error');
      return;
    }

    // Reset state for new sending process
    setIsSending(true);
    setLogs([]);
    setProgress({ current: 0, total: 0 });

    try {
      // Create FormData object for file upload
      const formData = new FormData();
      formData.append('recipientsFile', recipientsFile);
      
      // Add attachment file if provided
      if (attachmentFile) {
        formData.append('attachmentFile', attachmentFile);
      }

      // Add initial log entry
      setLogs([{ 
        type: 'info', 
        message: `Initializing bulk send process with ${recipientsFile.name}...` 
      }]);

      // Send POST request to backend API to start the process
      const response = await fetch('/api/send', {
        method: 'POST',
        body: formData,
      });

      // Handle response errors
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
      }

      // Parse successful response
      const result = await response.json();
      
      // Add success log entry
      setLogs(prev => [...prev, { 
        type: 'info', 
        message: result.message || 'Bulk sending process started successfully' 
      }]);

      // Real-time progress tracking will begin automatically via useEffect

    } catch (error) {
      console.error('Send initiation error:', error);
      
      // Add error to logs
      setLogs(prev => [...prev, { 
        type: 'error', 
        message: `Error: ${error.message}` 
      }]);
      
      // Show error toast
      showToast('Failed to start sending process. Please check your connection and try again.', 'error');
      
      // Reset sending state on error
      setIsSending(false);
    }
  };

  /**
   * Get summary statistics for display
   */
  const getSummaryStats = () => {
    const successCount = logs.filter(log => log.type === 'success').length;
    const errorCount = logs.filter(log => log.type === 'error').length;
    
    return { successCount, errorCount, totalProcessed: successCount + errorCount };
  };

  const stats = getSummaryStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Application Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <Send className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              WhatsApp Bulk Sender
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Upload your Excel file of recipients and optional attachment to start sending
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Powered by Selenium WebDriver • Real-time Progress Tracking
          </div>
        </div>

        {/* Main Application Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          {/* File Upload Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <FileDropzone
              onFileSelect={setRecipientsFile}
              acceptedFormats={excelFormats}
              label="Recipients Excel File *"
              currentFile={recipientsFile}
              disabled={isSending}
            />
            
            <FileDropzone
              onFileSelect={setAttachmentFile}
              acceptedFormats={attachmentFormats}
              label="Attachment (Optional)"
              currentFile={attachmentFile}
              disabled={isSending}
            />
          </div>

          {/* Quick Stats Display */}
          {(progress.total > 0 || logs.length > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {progress.current || 0}
                </div>
                <div className="text-sm text-gray-500">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {progress.total || 0}
                </div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.successCount}
                </div>
                <div className="text-sm text-gray-500">Success</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.errorCount}
                </div>
                <div className="text-sm text-gray-500">Failed</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Primary Send Button */}
            <button
              onClick={handleStartSending}
              disabled={!recipientsFile || isSending}
              className={`
                flex items-center space-x-2 px-8 py-3 rounded-xl font-medium transition-all duration-300
                ${(!recipientsFile || isSending)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                }
              `}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending Messages...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Start Sending</span>
                </>
              )}
            </button>

            {/* Secondary Action Buttons */}
            <button
              onClick={clearFiles}
              disabled={isSending}
              className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              <span>Clear Files</span>
            </button>

            {logs.length > 0 && !isSending && (
              <button
                onClick={clearLogs}
                className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Clear Logs</span>
              </button>
            )}

            {/* Export Logs Button (when process is complete) */}
            {!isSending && logs.length > 0 && progress.total > 0 && (
              <button
                onClick={() => {
                  const logData = logs.map(log => `[${log.type.toUpperCase()}] ${log.message}`).join('\n');
                  const blob = new Blob([logData], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `whatsapp-bulk-sender-logs-${new Date().toISOString().split('T')[0]}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  showToast('Logs exported successfully!', 'success');
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Export Logs</span>
              </button>
            )}
          </div>

          {/* Progress and Activity Logs */}
          <ProgressLog
            isActive={isSending}
            progress={progress}
            logs={logs}
            onClose={clearLogs}
          />
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Requirements Card */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600" />
              Requirements
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>WhatsApp Web:</strong> Must be logged in your Chrome browser</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Excel Format:</strong> Must have a 'Contact' column with phone numbers</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Phone Numbers:</strong> Include country code (e.g., +1234567890)</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Backend:</strong> Python Flask server must be running</span>
              </li>
            </ul>
          </div>

          {/* Tips Card */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <div className="w-5 h-5 mr-2 text-yellow-600">💡</div>
              Tips for Best Results
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Test with a small batch first (5-10 contacts)</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Ensure stable internet connection during sending</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Don't close the browser while sending messages</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Use personalized messages for better engagement</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span>⚠️ Make sure WhatsApp Web is logged in before starting the process</span>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <p>Built with React, Tailwind CSS, and Python Flask</p>
            <p>Uses Selenium WebDriver for WhatsApp Web automation</p>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: '' })}
      />
    </div>
  );
};

export default App;