import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GroupInvitation, UserProfile, Group } from '../../../types';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatDistanceToNow } from 'date-fns';
import { haptics } from '../../../utils/haptics';

interface InvitationListItemProps {
  invitation: GroupInvitation & { inviterProfile?: UserProfile; groupDetails?: Group };
  onAccept?: (invitationId: string) => void;
  onReject?: (invitationId: string) => void;
  onCancel?: (invitationId: string) => void;
  showActions?: boolean;
  isInviter?: boolean;
}

export const InvitationListItem: React.FC<InvitationListItemProps> = ({
  invitation,
  onAccept,
  onReject,
  onCancel,
  showActions = true,
  isInviter = false,
}) => {
  const { theme } = useTheme();

  const groupName = invitation.groupDetails?.name || 'Unknown Group';
  const inviterName = invitation.inviterProfile?.displayName || 'Unknown User';
  const createdAt = invitation.createdAt
    ? formatDistanceToNow(invitation.createdAt, { addSuffix: true })
    : '';

  const handleAccept = () => {
    haptics.medium();
    onAccept?.(invitation.id);
  };

  const handleReject = () => {
    haptics.light();
    onReject?.(invitation.id);
  };

  const handleCancel = () => {
    haptics.light();
    onCancel?.(invitation.id);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
        <Icon name="account-multiple-plus" size={24} color={theme.colors.primary} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.groupName, { color: theme.colors.text }]} numberOfLines={1}>
          {groupName}
        </Text>

        {isInviter ? (
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            Invited {invitation.inviteeEmail}
          </Text>
        ) : (
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            From {inviterName}
          </Text>
        )}

        {invitation.message && (
          <Text style={[styles.message, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            "{invitation.message}"
          </Text>
        )}

        {createdAt && (
          <Text style={[styles.time, { color: theme.colors.textTertiary }]}>
            {createdAt}
          </Text>
        )}
      </View>

      {showActions && (
        <View style={styles.actions}>
          {isInviter ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.error + '20' }]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Icon name="close" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.success + '20' }]}
                onPress={handleAccept}
                activeOpacity={0.7}
              >
                <Icon name="check" size={20} color={theme.colors.success} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.error + '20' }]}
                onPress={handleReject}
                activeOpacity={0.7}
              >
                <Icon name="close" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  time: {
    fontSize: 11,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
