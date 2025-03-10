import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

interface ImageUploadProps {
  currentImage?: string;
  onImageUploaded: (url: string) => void;
  type: 'logo' | 'cover';
}

const ImageUpload: React.FC<ImageUploadProps> = ({ currentImage, onImageUploaded, type }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vain kuvatiedostot ovat sallittuja');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kuvan maksimikoko on 5MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Create a unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${type}_${uuidv4()}.${fileExtension}`;
      const storageRef = ref(storage, `vendor_images/${fileName}`);

      // Upload with retry logic
      let downloadUrl;
      try {
        await uploadBytes(storageRef, file);
        downloadUrl = await getDownloadURL(storageRef);
      } catch (err) {
        console.error('Upload error:', err);
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          // Retry upload after a short delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          return handleFileSelect(e);
        }
        throw err;
      }

      // Delete old image if exists
      if (currentImage) {
        try {
          // More robust extraction of the reference path
          const oldImageUrl = new URL(currentImage);
          const pathMatch = oldImageUrl.pathname.match(/\/o\/([^?]+)/);
          
          if (pathMatch && pathMatch[1]) {
            // Decode the URI component to get the actual path
            const decodedPath = decodeURIComponent(pathMatch[1]);
            const oldStorageRef = ref(storage, decodedPath);
            
            await deleteObject(oldStorageRef).catch(err => {
              // Log but don't throw - this shouldn't block the new upload
              console.warn('Error deleting old image (non-critical):', err);
            });
          }
        } catch (err) {
          console.error('Error parsing or deleting old image:', err);
          // Don't throw error for deletion problems - still return the new URL
        }
      }

      setRetryCount(0); // Reset retry count on success
      onImageUploaded(downloadUrl);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Virhe kuvan latauksessa. Yritä uudelleen.');
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Current Image Preview */}
      {currentImage && (
        <div className="relative">
          <img
            src={currentImage}
            alt={type === 'logo' ? 'Yrityksen logo' : 'Kansikuva'}
            className={`rounded-lg ${type === 'logo' ? 'w-32 h-32 object-cover' : 'w-full h-48 object-cover'}`}
            onError={(e) => {
              console.warn('Image failed to load:', currentImage);
              e.currentTarget.src = type === 'logo' 
                ? 'https://via.placeholder.com/128?text=Logo'
                : 'https://via.placeholder.com/800x200?text=Cover+Image';
            }}
          />
        </div>
      )}

      {/* Upload Button */}
      <div 
        onClick={handleClick}
        className={`
          border-2 border-dashed border-gray-300 rounded-lg 
          ${type === 'logo' ? 'p-4' : 'p-8'}
          hover:border-blue-500 transition-colors cursor-pointer
          flex flex-col items-center justify-center space-y-2
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        {uploading ? (
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        ) : currentImage ? (
          <>
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-500">Vaihda kuva</p>
          </>
        ) : (
          <>
            <ImageIcon className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-500">
              {type === 'logo' ? 'Lataa logo' : 'Lataa kansikuva'}
            </p>
            <p className="text-xs text-gray-400">
              Klikkaa tai raahaa kuva tähän
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 flex items-center">
          <X className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
