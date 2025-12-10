import React from 'react';
import { UploadedImage } from '../types';
import { X } from 'lucide-react';

interface ImageGridProps {
  images: UploadedImage[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ images, onRemove, disabled }) => {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
      {images.map((image) => (
        <div key={image.id} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
          <img
            src={image.previewUrl}
            alt="Uploaded preview"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {!disabled && (
            <button
              onClick={() => onRemove(image.id)}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 backdrop-blur-sm text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 focus:opacity-100"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs text-white truncate px-1">
              {image.file.name}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};