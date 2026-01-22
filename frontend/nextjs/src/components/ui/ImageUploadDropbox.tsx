'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';

interface ImageUploadDropboxProps {
  readonly onUpload: (file: File) => Promise<string>; // Returns image URL
  readonly disabled?: boolean;
  readonly maxSizeMB?: number;
  readonly acceptedTypes?: string[];
}

export default function ImageUploadDropbox({
  onUpload,
  disabled = false,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}: ImageUploadDropboxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }
    return null;
  };

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsUploading(true);
      try {
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file
        const imageUrl = await onUpload(file);
        setPreviewUrl(imageUrl);
      } catch (err: any) {
        setError(err?.message || 'Failed to upload image');
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, maxSizeMB, acceptedTypes]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, isUploading, handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? 'rgba(57, 107, 251, 1)' : 'rgba(209, 213, 219, 1)'}`,
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center',
        backgroundColor: isDragging ? 'rgba(57, 107, 251, 0.05)' : 'rgba(249, 250, 251, 1)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
        position: 'relative',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <input
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        disabled={disabled || isUploading}
        style={{ display: 'none' }}
        id="image-upload-input"
      />
      
      {previewUrl ? (
        <div style={{ position: 'relative', width: '100%', maxWidth: '200px', marginBottom: '12px' }}>
          <div style={{ position: 'relative', width: '100%', paddingBottom: '75%', borderRadius: '8px', overflow: 'hidden' }}>
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          {isUploading && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
              }}
            >
              <div style={{ color: 'white', fontSize: '14px' }}>Uploading...</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: '12px' }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: 'rgba(156, 163, 175, 1)', margin: '0 auto' }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
      )}

      <label
        htmlFor="image-upload-input"
        style={{
          cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
          color: 'rgba(57, 107, 251, 1)',
          fontWeight: '500',
          fontSize: '14px',
          marginTop: '8px',
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isUploading) {
            e.preventDefault();
            document.getElementById('image-upload-input')?.click();
          }
        }}
        tabIndex={disabled || isUploading ? -1 : 0}
        role="button"
        aria-label={isUploading ? 'Uploading image' : previewUrl ? 'Change image' : 'Upload image'}
      >
        {isUploading ? 'Uploading...' : previewUrl ? 'Click to change image' : 'Click to upload or drag and drop'}
      </label>

      <div style={{ fontSize: '12px', color: 'rgba(156, 163, 175, 1)', marginTop: '4px' }}>
        {acceptedTypes.map((type) => {
          const extension = type.split('/')[1];
          return extension ? extension.toUpperCase() : '';
        }).filter(Boolean).join(', ')} up to {maxSizeMB}MB
      </div>

      {error && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: 'rgba(254, 242, 242, 1)',
            color: 'rgba(220, 38, 38, 1)',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
