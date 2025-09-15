
import React, { useRef } from 'react';
import { UploadCloudIcon, DocumentIcon, CheckCircleIcon } from './common/Icons';

interface FileUploadProps {
  id: string;
  label: string;
  onFileChange: (file: File | null) => void;
  fileName?: string | null;
  helpText?: string;
  accept?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ id, label, onFileChange, fileName, helpText, accept = ".csv" }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    onFileChange(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files ? event.dataTransfer.files[0] : null;
    if (file && (accept === "*" || (accept && file.name.endsWith(accept)))) {
        onFileChange(file);
        if(inputRef.current) inputRef.current.files = event.dataTransfer.files; 
    } else {
        alert(`Please drop a ${accept} file.`);
    }
  };

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-secondary-700 mb-1">{label}</label>
      <label
        htmlFor={id}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${fileName ? 'border-secondary-500 bg-secondary-50' : 'border-gray-300 border-dashed'} rounded-md cursor-pointer hover:border-secondary-400 transition-colors duration-150`}
      >
        <div className="space-y-1 text-center">
          {fileName ? (
            <CheckCircleIcon className="mx-auto h-12 w-12 text-secondary-500" />
          ) : (
            <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
          )}
          <div className="flex text-sm text-gray-600">
            <span className={`relative rounded-md font-medium ${fileName ? 'text-secondary-700' : 'text-secondary-600 hover:text-secondary-500'} focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-secondary-500`}>
              {fileName ? <p className="truncate max-w-xs">{fileName}</p> : <span>Upload a file</span>}
              <input id={id} name={id} type="file" ref={inputRef} className="sr-only" onChange={handleFileChange} accept={accept} />
            </span>
            {!fileName && <p className="pl-1">or drag and drop</p>}
          </div>
          {!fileName && <p className="text-xs text-gray-500">CSV files up to 10MB</p>}
        </div>
      </label>
      {helpText && <p className="mt-2 text-xs text-gray-500">{helpText}</p>}
    </div>
  );
};

export default FileUpload;