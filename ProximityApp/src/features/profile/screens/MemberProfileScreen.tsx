import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { MapStackParamList, UserProfile } from '../../../types';
import { getUserProfile } from '../../../services/firebase/profile';
import { createOrGetChat, generateChatId } from '../../../services/firebase/chat';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageViewer from '../../../components/ImageViewer';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48) / 3; // 3 columns with padding

type MemberProfileRouteProp = RouteProp<MapStackParamList, 'MemberProfile'>;
type MemberProfileNavigationProp = StackNavigationProp<MapStackParamList, 'MemberProfile'>;

const MemberProfileScreen: React.FC = () => {
  const route = useRoute<MemberProfileRouteProp>();
  const navigation = useNavigation<MemberProfileNavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { userId } = route.params;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const profileData = await getUserProfile(userId);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!user || !profile) return;

    try {
      const chatId = generateChatId(user.uid, userId);

      await createOrGetChat(
        user.uid,
        userId,
        {
          displayName: user.displayName || '',
          photoURL: user.photoURL,
        },
        {
          displayName: profile.displayName,
          photoURL: profile.photoURL,
          profilePicture: profile.profilePicture,
        }
      );

      navigation.navigate('ChatScreen', {
        chatId,
        otherUserId: userId,
        otherUserName: profile.displayName,
        otherUserPhoto: profile.profilePicture || profile.photoURL,
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check if it's a permission error
      if (errorMessage.includes('permission') || errorMessage.includes('PERMISSION_DENIED')) {
        Alert.alert(
          'Permission Error',
          'Chat feature requires Firebase rules to be deployed. Please check Firebase Console.'
        );
      } else {
        Alert.alert('Error', `Could not start chat: ${errorMessage}`);
      }
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

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="account-off" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  const profileImage = profile.profilePicture || profile.photoURL;

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.header}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Icon name="account" size={60} color={theme.colors.textSecondary} />
          </View>
        )}

        <Text style={styles.displayName}>{profile.displayName}</Text>
        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{profile.photosCount || 0}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{profile.groups?.length || 0}</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </View>
        </View>

        {/* Message Button */}
        <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
          <Icon name="message-text" size={20} color="#ffffff" />
          <Text style={styles.messageButtonText}>Send Message</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Gallery - Instagram Style */}
      <View style={styles.gallery}>
        <Text style={styles.galleryTitle}>Photos</Text>

        {profile.photos && profile.photos.length > 0 ? (
          <View style={styles.photoGrid}>
            {profile.photos.map((photo, index) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.photoItem}
                onPress={() => {
                  setSelectedPhotoIndex(index);
                  setImageViewerVisible(true);
                }}
              >
                <Image source={{ uri: photo.url }} style={styles.photo} />
                {photo.caption && (
                  <View style={styles.photoOverlay}>
                    <Text style={styles.photoCaption} numberOfLines={2}>
                      {photo.caption}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyGallery}>
            <Icon name="image-off-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No photos yet</Text>
          </View>
        )}
      </View>
    </ScrollView>

      {/* Image Viewer */}
      {profile && profile.photos && profile.photos.length > 0 && (
        <ImageViewer
          visible={imageViewerVisible}
          onClose={() => setImageViewerVisible(false)}
          photos={profile.photos}
          initialIndex={selectedPhotoIndex}
        />
      )}
    </>
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
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: 32,
    },
    errorText: {
      fontSize: 18,
      color: theme.colors.text,
      marginTop: 16,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 24,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
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
    displayName: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
      marginTop: 16,
    },
    bio: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      marginTop: 24,
      gap: 40,
    },
    stat: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    messageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 24,
    },
    messageButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
    gallery: {
      paddingTop: 24,
    },
    galleryTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
      gap: 6,
    },
    photoItem: {
      width: PHOTO_SIZE,
      height: PHOTO_SIZE,
      marginBottom: 6,
    },
    photo: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.surface,
    },
    photoOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
      padding: 8,
    },
    photoCaption: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '500',
    },
    emptyGallery: {
      alignItems: 'center',
      paddingVertical: 48,
    },
    emptyText: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      marginTop: 12,
    },
  });

export default MemberProfileScreen;
