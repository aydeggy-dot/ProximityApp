// Firebase Storage service for image uploads
import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';

/**
 * Upload an image to Firebase Storage
 * @param uri - Local file URI
 * @param path - Storage path (e.g., 'users/userId/profile.jpg')
 * @param onProgress - Optional progress callback (0-100)
 * @returns Download URL of the uploaded image
 */
export const uploadImage = async (
  uri: string,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    console.log(`[Storage] Uploading image to ${path}`);
    console.log(`[Storage] Local URI: ${uri}`);

    // Create a reference to the file location
    const reference = storage().ref(path);

    // Handle platform-specific URIs
    let uploadUri = uri;
    if (Platform.OS === 'android' && !uri.startsWith('file://')) {
      uploadUri = `file://${uri}`;
    }

    // Start upload task
    const task = reference.putFile(uploadUri);

    // Monitor upload progress
    if (onProgress) {
      task.on('state_changed', snapshot => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(Math.round(progress));
      });
    }

    // Wait for upload to complete
    await task;

    // Get download URL
    const downloadURL = await reference.getDownloadURL();
    console.log(`[Storage] ✓ Upload successful: ${downloadURL}`);

    return downloadURL;
  } catch (error) {
    console.error('[Storage] Upload failed:', {
      path,
      uri,
      error: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
    });
    throw error;
  }
};

/**
 * Delete an image from Firebase Storage
 * @param url - Full download URL or storage path
 */
export const deleteImage = async (url: string): Promise<void> => {
  try {
    console.log(`[Storage] Deleting image: ${url}`);

    // Extract path from URL if needed
    let reference;
    if (url.startsWith('http')) {
      reference = storage().refFromURL(url);
    } else {
      reference = storage().ref(url);
    }

    await reference.delete();
    console.log(`[Storage] ✓ Image deleted successfully`);
  } catch (error) {
    console.error('[Storage] Delete failed:', {
      url,
      error: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
    });
    throw error;
  }
};

/**
 * Generate a unique filename with timestamp
 * @param userId - User ID
 * @param type - Image type ('profile' | 'gallery')
 * @param extension - File extension (default: 'jpg')
 */
export const generateImagePath = (
  userId: string,
  type: 'profile' | 'gallery',
  extension: string = 'jpg'
): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 9);
  return `users/${userId}/${type}/${timestamp}_${randomId}.${extension}`;
};

/**
 * Upload profile picture
 * @param userId - User ID
 * @param imageUri - Local image URI
 * @param onProgress - Optional progress callback
 * @returns Download URL
 */
export const uploadProfilePicture = async (
  userId: string,
  imageUri: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const path = generateImagePath(userId, 'profile');
  return uploadImage(imageUri, path, onProgress);
};

/**
 * Upload gallery photo
 * @param userId - User ID
 * @param imageUri - Local image URI
 * @param onProgress - Optional progress callback
 * @returns Download URL
 */
export const uploadGalleryPhoto = async (
  userId: string,
  imageUri: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const path = generateImagePath(userId, 'gallery');
  return uploadImage(imageUri, path, onProgress);
};

/**
 * Get metadata for an image
 * @param url - Download URL
 */
export const getImageMetadata = async (url: string) => {
  try {
    const reference = storage().refFromURL(url);
    const metadata = await reference.getMetadata();
    return metadata;
  } catch (error) {
    console.error('[Storage] Failed to get metadata:', error);
    throw error;
  }
};
