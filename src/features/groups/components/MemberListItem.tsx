import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GroupMembership, UserProfile } from '../../../types';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatDistanceToNow } from 'date-fns';
import { haptics } from '../../../utils/haptics';

interface MemberListItemProps {
  member: GroupMembership & { userProfile?: UserProfile };
  isAdmin?: boolean;
  currentUserId?: string;
  onChangeRole?: (userId: string, role: GroupMembership['role']) => void;
  onRemove?: (userId: string) => void;
}

export const MemberListItem: React.FC<MemberListItemProps> = ({
  member,
  isAdmin = false,
  currentUserId,
  onChangeRole,
  onRemove,
}) => {
  const { theme } = useTheme();
  const [showActions, setShowActions] = useState(false);

  const getRoleColor = () => {
    switch (member.role) {
      case 'admin':
        return theme.colors.error;
      case 'moderator':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getRoleIcon = () => {
    switch (member.role) {
      case 'admin':
        return 'shield-crown';
      case 'moderator':
        return 'shield-account';
      default:
        return 'account';
    }
  };

  const displayName = member.userProfile?.displayName || 'Unknown User';
  const email = member.userProfile?.email;
  const joinedDate = member.joinedAt ? formatDistanceToNow(member.joinedAt, { addSuffix: true }) : '';

  const isCurrentUser = member.userId === currentUserId;
  const canManage = isAdmin && !isCurrentUser && member.role !== 'admin';

  const handleRoleChange = (newRole: GroupMembership['role']) => {
    haptics.light();
    Alert.alert(
      'Change Role',
      `Change ${displayName}'s role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: () => {
            onChangeRole?.(member.userId, newRole);
            setShowActions(false);
          },
        },
      ]
    );
  };

  const handleRemove = () => {
    haptics.medium();
    Alert.alert(
      'Remove Member',
      `Remove ${displayName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onRemove?.(member.userId);
            setShowActions(false);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.avatar, { backgroundColor: theme.colors.primary + '20' }]}>
        <Icon name="account" size={24} color={theme.colors.primary} />
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor() + '20' }]}>
            <Icon name={getRoleIcon()} size={12} color={getRoleColor()} />
            <Text style={[styles.roleText, { color: getRoleColor() }]}>
              {member.role}
            </Text>
          </View>
        </View>

        {email && (
          <Text style={[styles.email, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {email}
          </Text>
        )}

        {joinedDate && (
          <Text style={[styles.joined, { color: theme.colors.textTertiary }]}>
            Joined {joinedDate}
          </Text>
        )}
      </View>

      {canManage && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            haptics.light();
            setShowActions(!showActions);
          }}
        >
          <Icon name="dots-vertical" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      )}

      {showActions && canManage && (
        <View style={[styles.actionsMenu, { backgroundColor: theme.colors.surface }]}>
          {member.role !== 'moderator' && (
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleRoleChange('moderator')}
            >
              <Icon name="shield-account" size={20} color={theme.colors.warning} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Make Moderator
              </Text>
            </TouchableOpacity>
          )}

          {member.role !== 'member' && (
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleRoleChange('member')}
            >
              <Icon name="account" size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Make Member
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleRemove}
          >
            <Icon name="account-remove" size={20} color={theme.colors.error} />
            <Text style={[styles.actionText, { color: theme.colors.error }]}>
              Remove from Group
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  avatar: {
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  email: {
    fontSize: 13,
    marginBottom: 2,
  },
  joined: {
    fontSize: 11,
  },
  menuButton: {
    padding: 8,
  },
  actionsMenu: {
    position: 'absolute',
    top: 12,
    right: 56,
    borderRadius: 8,
    padding: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 1000,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
