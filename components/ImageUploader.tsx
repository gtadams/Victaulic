import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImagesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(false);
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const imageFiles = Array.from(e.dataTransfer.files).filter((file: File) => file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        onImagesSelected(imageFiles);
      }
    }
  }, [onImagesSelected, disabled]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const imageFiles = Array.from(e.target.files).filter((file: File) => file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        onImagesSelected(imageFiles);
      }
    }
    // Reset value to allow selecting the same file again if needed
    e.target.value = '';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out
        flex flex-col items-center justify-center text-center cursor-pointer group
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' 
          : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
      `}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      
      <div className={`p-4 rounded-full bg-indigo-50 mb-4 transition-colors ${isDragging ? 'bg-indigo-100' : 'group-hover:bg-indigo-100'}`}>
        {isDragging ? (
           <Upload className="w-8 h-8 text-indigo-600" />
        ) : (
           <ImageIcon className="w-8 h-8 text-indigo-600" />
        )}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {isDragging ? 'Drop images here' : 'Upload Photos'}
      </h3>
      <p className="text-sm text-gray-500 max-w-xs">
        Drag & drop your images here, or click to browse files.
      </p>
      <p className="text-xs text-gray-400 mt-2">
        Supports JPG, PNG, WEBP (Max 10MB)
      </p>
    </div>
  );
};