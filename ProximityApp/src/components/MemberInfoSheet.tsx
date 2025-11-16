import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MemberInfoSheetProps {
  visible: boolean;
  onClose: () => void;
  member: {
    userId: string;
    displayName: string;
    photoURL?: string;
    profilePicture?: string;
    distance: number;
    photosCount?: number;
  };
  onViewProfile: () => void;
  onSendMessage: () => void;
}

const MemberInfoSheet: React.FC<MemberInfoSheetProps> = ({
  visible,
  onClose,
  member,
  onViewProfile,
  onSendMessage,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const profileImage = member.profilePicture || member.photoURL;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.sheet}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Profile Section */}
          <View style={styles.profileSection}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Icon name="account" size={48} color={theme.colors.textSecondary} />
              </View>
            )}

            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{member.displayName}</Text>
              <View style={styles.distanceRow}>
                <Icon name="map-marker-distance" size={16} color={theme.colors.primary} />
                <Text style={styles.distance}>
                  {Math.round(member.distance)}m away
                </Text>
              </View>
              {member.photosCount !== undefined && member.photosCount > 0 && (
                <View style={styles.photosRow}>
                  <Icon name="image-multiple" size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.photosCount}>
                    {member.photosCount} {member.photosCount === 1 ? 'photo' : 'photos'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.viewProfileButton]}
              onPress={() => {
                onClose();
                onViewProfile();
              }}
            >
              <Icon name="account-details" size={24} color={theme.colors.primary} />
              <Text style={styles.viewProfileText}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.messageButton]}
              onPress={() => {
                onClose();
                onSendMessage();
              }}
            >
              <Icon name="message-text" size={24} color="#ffffff" />
              <Text style={styles.messageText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 32,
      minHeight: SCREEN_HEIGHT * 0.35,
      maxHeight: SCREEN_HEIGHT * 0.6,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    dragHandle: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 20,
    },
    profileSection: {
      flexDirection: 'row',
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    profileImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surface,
    },
    profileImagePlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileInfo: {
      flex: 1,
      marginLeft: 16,
      justifyContent: 'center',
    },
    displayName: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 8,
    },
    distanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    distance: {
      fontSize: 15,
      color: theme.colors.primary,
      marginLeft: 6,
      fontWeight: '600',
    },
    photosRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    photosCount: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 6,
    },
    actions: {
      paddingHorizontal: 24,
      gap: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      gap: 10,
    },
    viewProfileButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    viewProfileText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    messageButton: {
      backgroundColor: theme.colors.primary,
    },
    messageText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
  });

export default MemberInfoSheet;
