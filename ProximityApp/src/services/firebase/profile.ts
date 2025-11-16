// Profile service for managing user profiles and photos
import firestore from '@react-native-firebase/firestore';
import { UserProfile, ProfilePhoto } from '../../types';
import { uploadProfilePicture, uploadGalleryPhoto, deleteImage } from './storage';

const COLLECTIONS = {
  USERS: 'users',
  USER_PROFILES: 'userProfiles',
};

/**
 * Get user profile by ID
 * @param userId - User ID
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log(`[Profile] Getting profile for user ${userId}`);

    const doc = await firestore()
      .collection(COLLECTIONS.USER_PROFILES)
      .doc(userId)
      .get();

    if (!doc.exists) {
      console.log(`[Profile] Profile not found`);
      return null;
    }

    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate(),
      updatedAt: data?.updatedAt?.toDate(),
      photos: data?.photos || [],
      photosCount: data?.photosCount || 0,
    } as UserProfile;
  } catch (error) {
    console.error('[Profile] Error getting profile:', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Update user profile
 * @param userId - User ID
 * @param updates - Partial profile data to update
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  try {
    console.log(`[Profile] Updating profile for user ${userId}`);

    await firestore()
      .collection(COLLECTIONS.USER_PROFILES)
      .doc(userId)
      .update({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    console.log(`[Profile] ✓ Profile updated`);
  } catch (error) {
    console.error('[Profile] Error updating profile:', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Upload and set profile picture
 * @param userId - User ID
 * @param imageUri - Local image URI
 * @param onProgress - Optional progress callback
 */
export const setProfilePicture = async (
  userId: string,
  imageUri: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    console.log(`[Profile] Setting profile picture for user ${userId}`);

    // Get current profile to delete old picture if exists
    const currentProfile = await getUserProfile(userId);
    const oldPictureUrl = currentProfile?.profilePicture;

    // Upload new picture
    const downloadUrl = await uploadProfilePicture(userId, imageUri, onProgress);

    // Update profile with new picture URL
    await updateUserProfile(userId, {
      profilePicture: downloadUrl,
    });

    // Delete old picture if exists
    if (oldPictureUrl) {
      try {
        await deleteImage(oldPictureUrl);
      } catch (err) {
        console.warn('[Profile] Could not delete old profile picture:', err);
      }
    }

    console.log(`[Profile] ✓ Profile picture set`);
    return downloadUrl;
  } catch (error) {
    console.error('[Profile] Error setting profile picture:', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Add photo to user's gallery
 * @param userId - User ID
 * @param imageUri - Local image URI
 * @param caption - Optional caption
 * @param onProgress - Optional progress callback
 */
export const addGalleryPhoto = async (
  userId: string,
  imageUri: string,
  caption?: string,
  onProgress?: (progress: number) => void
): Promise<ProfilePhoto> => {
  try {
    console.log(`[Profile] Adding gallery photo for user ${userId}`);

    // Upload photo
    const downloadUrl = await uploadGalleryPhoto(userId, imageUri, onProgress);

    // Create photo object
    const photo: ProfilePhoto = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      url: downloadUrl,
      caption,
      uploadedAt: new Date(),
    };

    // Get current profile
    const profile = await getUserProfile(userId);
    const currentPhotos = profile?.photos || [];

    // Update profile with new photo
    await updateUserProfile(userId, {
      photos: [...currentPhotos, photo],
      photosCount: currentPhotos.length + 1,
    });

    console.log(`[Profile] ✓ Gallery photo added`);
    return photo;
  } catch (error) {
    console.error('[Profile] Error adding gallery photo:', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Remove photo from user's gallery
 * @param userId - User ID
 * @param photoId - Photo ID to remove
 */
export const removeGalleryPhoto = async (
  userId: string,
  photoId: string
): Promise<void> => {
  try {
    console.log(`[Profile] Removing gallery photo ${photoId} for user ${userId}`);

    // Get current profile
    const profile = await getUserProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Find photo to delete
    const photoToDelete = profile.photos.find(p => p.id === photoId);
    if (!photoToDelete) {
      throw new Error('Photo not found');
    }

    // Remove from array
    const updatedPhotos = profile.photos.filter(p => p.id !== photoId);

    // Update profile
    await updateUserProfile(userId, {
      photos: updatedPhotos,
      photosCount: updatedPhotos.length,
    });

    // Delete from storage
    try {
      await deleteImage(photoToDelete.url);
    } catch (err) {
      console.warn('[Profile] Could not delete photo from storage:', err);
    }

    console.log(`[Profile] ✓ Gallery photo removed`);
  } catch (error) {
    console.error('[Profile] Error removing gallery photo:', {
      userId,
      photoId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Update photo caption
 * @param userId - User ID
 * @param photoId - Photo ID
 * @param caption - New caption
 */
export const updatePhotoCaption = async (
  userId: string,
  photoId: string,
  caption: string
): Promise<void> => {
  try {
    console.log(`[Profile] Updating caption for photo ${photoId}`);

    // Get current profile
    const profile = await getUserProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Update caption
    const updatedPhotos = profile.photos.map(p =>
      p.id === photoId ? { ...p, caption } : p
    );

    // Update profile
    await updateUserProfile(userId, {
      photos: updatedPhotos,
    });

    console.log(`[Profile] ✓ Photo caption updated`);
  } catch (error) {
    console.error('[Profile] Error updating photo caption:', {
      userId,
      photoId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Subscribe to user profile changes (real-time)
 * @param userId - User ID
 * @param onProfileUpdate - Callback when profile changes
 * @returns Unsubscribe function
 */
export const subscribeToProfile = (
  userId: string,
  onProfileUpdate: (profile: UserProfile | null) => void
): (() => void) => {
  console.log(`[Profile] Subscribing to profile for user ${userId}`);

  const unsubscribe = firestore()
    .collection(COLLECTIONS.USER_PROFILES)
    .doc(userId)
    .onSnapshot(
      doc => {
        if (!doc.exists) {
          onProfileUpdate(null);
          return;
        }

        const data = doc.data();
        const profile: UserProfile = {
          id: doc.id,
          ...data,
          createdAt: data?.createdAt?.toDate(),
          updatedAt: data?.updatedAt?.toDate(),
          photos: data?.photos || [],
          photosCount: data?.photosCount || 0,
        } as UserProfile;

        console.log(`[Profile] ✓ Profile updated`);
        onProfileUpdate(profile);
      },
      error => {
        console.error('[Profile] Error subscribing to profile:', error);
      }
    );

  return unsubscribe;
};

/**
 * Create initial profile for a new user
 * @param userId - User ID
 * @param displayName - Display name
 * @param email - Email address
 * @param photoURL - Optional photo URL from auth provider
 */
export const createUserProfile = async (
  userId: string,
  displayName: string,
  email: string,
  photoURL?: string
): Promise<UserProfile> => {
  try {
    console.log(`[Profile] Creating profile for user ${userId}`);

    const now = firestore.FieldValue.serverTimestamp();
    const profileData: Partial<UserProfile> = {
      id: userId,
      displayName,
      email,
      profilePicture: photoURL,
      photos: [],
      photosCount: 0,
      groups: [],
      createdAt: now as any,
      updatedAt: now as any,
      privacySettings: {
        shareLocation: true,
        shareProfile: true,
        allowDirectMessages: true,
        visibleGroups: [],
        invisibleMode: false,
      },
      notificationPreferences: {
        enableProximityAlerts: true,
        enableGroupInvites: true,
        enableDirectMessages: true,
        enableGroupAnnouncements: true,
        proximityRadius: 100,
        soundEnabled: true,
        vibrationEnabled: true,
        alertStyle: 'both' as any,
      },
    };

    await firestore()
      .collection(COLLECTIONS.USER_PROFILES)
      .doc(userId)
      .set(profileData);

    console.log(`[Profile] ✓ Profile created`);

    return {
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserProfile;
  } catch (error) {
    console.error('[Profile] Error creating profile:', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
