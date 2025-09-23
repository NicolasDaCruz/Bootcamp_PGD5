'use client';

import { useState, useRef } from 'react';
import { useAuth, useProfile } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export function AvatarUpload() {
  const { updateProfile } = useAuth();
  const profile = useProfile();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    setUploadError(null);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Update user profile with new avatar URL
      const { error: updateError } = await updateProfile({
        avatar_url: urlData.publicUrl
      });

      if (updateError) {
        throw new Error(updateError);
      }

      // Delete old avatar if it exists
      if (profile.avatar_url) {
        const oldFilePath = profile.avatar_url.split('/').pop();
        if (oldFilePath && oldFilePath !== fileName) {
          await supabase.storage
            .from('avatars')
            .remove([`avatars/${oldFilePath}`]);
        }
      }

    } catch (error: any) {
      console.error('Avatar upload error:', error);
      setUploadError(error.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile?.avatar_url) return;

    setUploading(true);
    setUploadError(null);

    try {
      // Update profile to remove avatar URL
      const { error: updateError } = await updateProfile({
        avatar_url: null
      });

      if (updateError) {
        throw new Error(updateError);
      }

      // Delete file from storage
      const filePath = profile.avatar_url.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('avatars')
          .remove([`avatars/${filePath}`]);
      }

    } catch (error: any) {
      console.error('Avatar removal error:', error);
      setUploadError(error.message || 'Failed to remove avatar');
    } finally {
      setUploading(false);
    }
  };

  if (!profile) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded-full w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Avatar</h2>
          <p className="text-gray-600">
            Upload a profile picture to personalize your account
          </p>
        </div>

        {/* Avatar Display */}
        <div className="flex items-start space-x-6">
          <div className="relative">
            <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Avatar'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-200">
                  <span className="text-4xl font-bold text-gray-500">
                    {profile.full_name?.charAt(0) || profile.email?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
            </div>

            {/* Upload overlay when uploading */}
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            {/* Upload Button */}
            <div>
              <button
                onClick={handleFileSelect}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload New Photo
                  </>
                )}
              </button>

              {profile.avatar_url && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove Photo
                </button>
              )}
            </div>

            {/* File Requirements */}
            <div className="text-sm text-gray-500">
              <p>• JPG, PNG, or GIF format</p>
              <p>• Maximum file size: 5MB</p>
              <p>• Recommended: Square image, at least 200x200 pixels</p>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{uploadError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}