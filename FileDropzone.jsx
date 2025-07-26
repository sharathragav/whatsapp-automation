import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Image, 
  CheckCircle, 
  X 
} from 'lucide-react';

/**
 * FileDropzone Component - Handles drag & drop file selection
 * 
 * @param {Function} onFileSelect - Callback when file is selected
 * @param {Array} acceptedFormats - Array of accepted file extensions (e.g., ['.xlsx', '.xls'])
 * @param {String} label - Display label for the dropzone
 * @param {File} currentFile - Currently selected file object
 * @param {Boolean} disabled - Whether the dropzone is disabled
 */
const FileDropzone = ({ onFileSelect, acceptedFormats, label, currentFile, disabled }) => {
  // State for drag and drop visual feedback
  const [isDragActive, setIsDragActive] = useState(false);

  /**
   * Validates if the selected file has an acceptable format
   * @param {File} file - The file to validate
   * @returns {Boolean} - True if file format is accepted
   */
  const validateFile = (file) => {
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    return acceptedFormats.includes(extension);
  };

  /**
   * Handles file selection from the file input
   * @param {Event} event - File input change event
   */
  const handleFileInput = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (validateFile(file)) {
        onFileSelect(file);
      } else {
        alert(`Invalid file format. Please select: ${acceptedFormats.join(', ')}`);
        // Clear the input value to allow selecting the same file again
        event.target.value = '';
      }
    }
  };

  /**
   * Drag and Drop Event Handlers
   */
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag inactive if we're leaving the dropzone completely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragActive(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      } else {
        alert(`Invalid file format. Please select: ${acceptedFormats.join(', ')}`);
      }
    }
  };

  /**
   * Returns appropriate icon based on file type
   * @param {File} file - The file object
   * @returns {JSX.Element} - Icon component
   */
  const getFileIcon = (file) => {
    if (!file) return <Upload className="w-8 h-8" />;
    
    const type = file.type;
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    
    // Image files
    if (type.includes('image') || ['.png', '.jpg', '.jpeg', '.gif'].includes(extension)) {
      return <Image className="w-6 h-6 text-blue-500" />;
    }
    // PDF files
    if (type.includes('pdf') || extension === '.pdf') {
      return <FileText className="w-6 h-6 text-red-500" />;
    }
    // Excel files
    if (type.includes('excel') || type.includes('spreadsheet') || ['.xlsx', '.xls'].includes(extension)) {
      return <FileText className="w-6 h-6 text-green-500" />;
    }
    // Word documents
    if (type.includes('word') || ['.doc', '.docx'].includes(extension)) {
      return <FileText className="w-6 h-6 text-blue-600" />;
    }
    // Default file icon
    return <FileText className="w-6 h-6 text-gray-500" />;
  };

  /**
   * Formats file size in human readable format
   * @param {Number} bytes - File size in bytes
   * @returns {String} - Formatted file size
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Handles click to remove currently selected file
   */
  const handleRemoveFile = (e) => {
    e.stopPropagation(); // Prevent triggering file selection
    onFileSelect(null);
  };

  /**
   * Triggers file input click
   */
  const handleClick = () => {
    if (!disabled) {
      document.getElementById(`file-input-${label.replace(/\s+/g, '-')}`).click();
    }
  };

  return (
    <div className="w-full">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {/* Dropzone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer 
          transition-all duration-200 min-h-[120px] flex items-center justify-center
          ${isDragActive ? 'border-blue-400 bg-blue-50 scale-102' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
          ${currentFile ? 'bg-green-50 border-green-300' : ''}
        `}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`${label} - Click to browse or drag and drop files`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Hidden file input */}
        <input
          id={`file-input-${label.replace(/\s+/g, '-')}`}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
          aria-describedby={`${label.replace(/\s+/g, '-')}-description`}
        />
        
        {/* File preview or upload prompt */}
        {currentFile ? (
          <div className="flex items-center justify-center space-x-3 w-full">
            {getFileIcon(currentFile)}
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate-filename">
                {currentFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(currentFile.size)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              {!disabled && (
                <button
                  onClick={handleRemoveFile}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200 focus-ring rounded"
                  aria-label="Remove file"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop the file here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag & drop a file here, or <span className="text-blue-600 font-medium">click to browse</span>
                </p>
                <p className="text-xs text-gray-500" id={`${label.replace(/\s+/g, '-')}-description`}>
                  Supported formats: {acceptedFormats.join(', ')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Additional help text */}
      {label.includes('Recipients') && (
        <p className="text-xs text-gray-500 mt-2">
          💡 Excel file should have a 'Contact' column with phone numbers (e.g., +1234567890)
        </p>
      )}
      
      {label.includes('Attachment') && currentFile && (
        <p className="text-xs text-green-600 mt-2">
          ✓ This file will be sent to all recipients
        </p>
      )}
    </div>
  );
};

export default FileDropzone;