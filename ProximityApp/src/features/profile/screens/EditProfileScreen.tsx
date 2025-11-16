import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { UserProfile, ProfilePhoto } from '../../../types';
import {
  getUserProfile,
  setProfilePicture,
  addGalleryPhoto,
  removeGalleryPhoto,
  updatePhotoCaption,
  updateUserProfile,
} from '../../../services/firebase/profile';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48) / 3;

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bio, setBio] = useState('');
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user?.uid) return;

    try {
      const profileData = await getUserProfile(user.uid);
      setProfile(profileData);
      setBio(profileData?.bio || '');
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const showImagePickerOptions = (type: 'profile' | 'gallery') => {
    Alert.alert(
      'Choose Photo',
      'Select a photo source',
      [
        {
          text: 'Camera',
          onPress: () => handleImagePicker('camera', type),
        },
        {
          text: 'Gallery',
          onPress: () => handleImagePicker('gallery', type),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleImagePicker = async (source: 'camera' | 'gallery', type: 'profile' | 'gallery') => {
    if (!user?.uid) return;

    try {
      const options = {
        mediaType: 'photo' as const,
        quality: 0.8 as const,
        maxWidth: 1024,
        maxHeight: 1024,
      };

      const result = source === 'camera'
        ? await launchCamera(options)
        : await launchImageLibrary(options);

      if (result.didCancel || !result.assets?.[0]?.uri) {
        return;
      }

      const imageUri = result.assets[0].uri;
      setUploading(true);
      setUploadProgress(0);

      if (type === 'profile') {
        await setProfilePicture(user.uid, imageUri, (progress) => {
          setUploadProgress(progress);
        });
        Toast.show({
          type: 'success',
          text1: 'Profile picture updated!',
        });
      } else {
        // For gallery, ask for caption
        Alert.prompt(
          'Add Caption',
          'Add a caption to your photo (optional)',
          async (caption) => {
            await addGalleryPhoto(user.uid, imageUri, caption || undefined, (progress) => {
              setUploadProgress(progress);
            });
            Toast.show({
              type: 'success',
              text1: 'Photo added to gallery!',
            });
            loadProfile();
          },
          'plain-text'
        );
      }

      loadProfile();
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid) return;
            try {
              await removeGalleryPhoto(user.uid, photoId);
              Toast.show({
                type: 'success',
                text1: 'Photo deleted',
              });
              loadProfile();
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Error', 'Failed to delete photo.');
            }
          },
        },
      ]
    );
  };

  const handleSaveCaption = async () => {
    if (!user?.uid || !editingCaption) return;

    try {
      await updatePhotoCaption(user.uid, editingCaption, captionText);
      Toast.show({
        type: 'success',
        text1: 'Caption updated',
      });
      setEditingCaption(null);
      setCaptionText('');
      loadProfile();
    } catch (error) {
      console.error('Error updating caption:', error);
      Alert.alert('Error', 'Failed to update caption.');
    }
  };

  const handleSaveBio = async () => {
    if (!user?.uid) return;

    try {
      await updateUserProfile(user.uid, { bio });
      Toast.show({
        type: 'success',
        text1: 'Bio updated',
      });
    } catch (error) {
      console.error('Error updating bio:', error);
      Alert.alert('Error', 'Failed to update bio.');
    }
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const profileImage = profile?.profilePicture || profile?.photoURL;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Picture Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Picture</Text>
        <View style={styles.profilePictureContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Icon name="account" size={60} color={theme.colors.textSecondary} />
            </View>
          )}
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={() => showImagePickerOptions('profile')}
            disabled={uploading}
          >
            <Icon name="camera" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bio Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bio</Text>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell others about yourself..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={150}
          onBlur={handleSaveBio}
        />
        <Text style={styles.charCount}>{bio.length}/150</Text>
      </View>

      {/* Gallery Section */}
      <View style={styles.section}>
        <View style={styles.gallerySectionHeader}>
          <Text style={styles.sectionTitle}>Photo Gallery</Text>
          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={() => showImagePickerOptions('gallery')}
            disabled={uploading}
          >
            <Icon name="plus" size={20} color="#ffffff" />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        </View>

        {uploading && (
          <View style={styles.uploadProgress}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.uploadText}>Uploading... {uploadProgress}%</Text>
          </View>
        )}

        {profile?.photos && profile.photos.length > 0 ? (
          <View style={styles.photoGrid}>
            {profile.photos.map((photo) => (
              <View key={photo.id} style={styles.photoItem}>
                <Image source={{ uri: photo.url }} style={styles.photo} />

                {/* Photo Actions */}
                <View style={styles.photoActions}>
                  <TouchableOpacity
                    style={styles.photoActionButton}
                    onPress={() => {
                      setEditingCaption(photo.id);
                      setCaptionText(photo.caption || '');
                    }}
                  >
                    <Icon name="pencil" size={16} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.photoActionButton, styles.deleteButton]}
                    onPress={() => handleDeletePhoto(photo.id)}
                  >
                    <Icon name="delete" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                {/* Caption */}
                {editingCaption === photo.id ? (
                  <View style={styles.captionEdit}>
                    <TextInput
                      style={styles.captionInput}
                      value={captionText}
                      onChangeText={setCaptionText}
                      placeholder="Add caption..."
                      placeholderTextColor={theme.colors.textSecondary}
                      autoFocus
                    />
                    <TouchableOpacity onPress={handleSaveCaption}>
                      <Icon name="check" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                ) : photo.caption ? (
                  <Text style={styles.photoCaption} numberOfLines={2}>
                    {photo.caption}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyGallery}>
            <Icon name="image-plus" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySubtext}>Add photos to show in your profile</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      paddingBottom: 32,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    section: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 16,
    },
    profilePictureContainer: {
      alignItems: 'center',
      position: 'relative',
    },
    profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.surface,
    },
    profileImagePlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    changePhotoButton: {
      position: 'absolute',
      right: width / 2 - 70,
      bottom: 0,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.colors.background,
    },
    bioInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 12,
      fontSize: 15,
      color: theme.colors.text,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    charCount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'right',
      marginTop: 4,
    },
    gallerySectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    addPhotoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    addPhotoText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
    uploadProgress: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      marginBottom: 16,
    },
    uploadText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    photoItem: {
      width: PHOTO_SIZE,
      marginBottom: 12,
    },
    photo: {
      width: '100%',
      height: PHOTO_SIZE,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
    },
    photoActions: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 6,
    },
    photoActionButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      padding: 8,
      borderRadius: 6,
      alignItems: 'center',
    },
    deleteButton: {
      backgroundColor: '#EF4444',
    },
    captionEdit: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
    },
    captionInput: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 6,
      padding: 8,
      fontSize: 13,
      color: theme.colors.text,
    },
    photoCaption: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    emptyGallery: {
      alignItems: 'center',
      paddingVertical: 48,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.text,
      marginTop: 12,
      fontWeight: '600',
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
  });

export default EditProfileScreen;
