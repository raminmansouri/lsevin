import { useState } from 'react';
import { Upload, Check, X, AlertCircle, FileText, RotateCw } from 'lucide-react';

interface FileUploadFieldProps {
  label: string;
  description?: string;
  accept?: string;
  maxSize?: number; // in MB
  required?: boolean;
  onChange?: (file: File | null) => void;
}

export default function FileUploadField({ 
  label, 
  description, 
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 10,
  required = false,
  onChange 
}: FileUploadFieldProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setErrorMessage(`File size must be less than ${maxSize}MB`);
      setUploadStatus('error');
      return;
    }

    setFile(selectedFile);
    setErrorMessage('');
    uploadFile(selectedFile);
  };

  const uploadFile = (fileToUpload: File) => {
    setUploadStatus('uploading');
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadStatus('success');
          if (onChange) onChange(fileToUpload);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const retryUpload = () => {
    if (file) {
      uploadFile(file);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage('');
    if (onChange) onChange(null);
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'border-blue-500 bg-blue-50';
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 hover:border-[#083f30]';
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {description && (
        <p className="text-sm text-gray-600 mb-3">{description}</p>
      )}

      {uploadStatus === 'idle' && !file && (
        <div className="relative">
          <input
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            id={`file-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
          />
          <label
            htmlFor={`file-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
            className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${getStatusColor()} hover:bg-gray-50`}
          >
            <Upload size={32} className="text-gray-400 mb-3" />
            <p className="font-semibold text-gray-900 mb-1">Click to upload</p>
            <p className="text-sm text-gray-500">
              {accept.split(',').map(ext => ext.replace('.', '').toUpperCase()).join(', ')} (Max {maxSize}MB)
            </p>
          </label>
        </div>
      )}

      {uploadStatus === 'uploading' && (
        <div className={`border-2 rounded-xl p-6 ${getStatusColor()}`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Upload size={24} className="text-white animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-1">{file?.name}</p>
              <p className="text-sm text-gray-600 mb-3">
                Uploading... {uploadProgress}%
              </p>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {uploadStatus === 'success' && file && (
        <div className={`border-2 rounded-xl p-5 ${getStatusColor()}`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Check size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 mb-1 truncate">{file.name}</p>
                  <p className="text-sm text-green-700">
                    Upload successful • {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={removeFile}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 transition-colors text-red-600 flex-shrink-0"
                  title="Remove file"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className={`border-2 rounded-xl p-5 ${getStatusColor()}`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-1">Upload Failed</p>
              <p className="text-sm text-red-700 mb-4">
                {errorMessage || 'Something went wrong. Please try again.'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={retryUpload}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <RotateCw size={16} />
                  Retry Upload
                </button>
                <button
                  onClick={removeFile}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <FileText size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-600">
            <p className="font-semibold text-gray-700 mb-1">File Requirements:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Accepted formats: {accept.split(',').map(ext => ext.replace('.', '').toUpperCase()).join(', ')}</li>
              <li>Maximum file size: {maxSize}MB</li>
              <li>Files are securely encrypted during upload</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
