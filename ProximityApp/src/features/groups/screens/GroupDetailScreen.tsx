// Group Detail screen

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GroupsStackParamList } from '../../../types';
import { useGroupDetail } from '../hooks/useGroupDetail';
import { useGroupMembers } from '../hooks/useGroupMembers';
import { useManageMembers } from '../hooks/useManageMembers';
import { useAuth } from '../../../contexts/AuthContext';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { MemberListItem } from '../components/MemberListItem';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatDistanceToNow } from 'date-fns';
import Toast from 'react-native-toast-message';
import { haptics } from '../../../utils/haptics';
import { removeGroupMember, generateGroupInviteCode } from '../../../services/firebase/firestore';
import Clipboard from '@react-native-clipboard/clipboard';

type GroupDetailScreenRouteProp = RouteProp<GroupsStackParamList, 'GroupDetail'>;
type GroupDetailScreenNavigationProp = StackNavigationProp<
  GroupsStackParamList,
  'GroupDetail'
>;

interface Props {
  route: GroupDetailScreenRouteProp;
  navigation: GroupDetailScreenNavigationProp;
}

const GroupDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { groupId } = route.params;
  const { user } = useAuth();
  const { group, loading: groupLoading, error: groupError, refresh: refreshGroup } = useGroupDetail(groupId);
  const { members, loading: membersLoading, error: membersError, refresh: refreshMembers } = useGroupMembers(groupId);
  const { changeRole, removeMember, updating, removing } = useManageMembers();

  const [leaving, setLeaving] = React.useState(false);

  const styles = createStyles(theme);

  const loading = groupLoading && membersLoading;
  const error = groupError || membersError;

  React.useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error,
      });
    }
  }, [error]);

  const handleRefresh = async () => {
    await Promise.all([refreshGroup(), refreshMembers()]);
  };

  const currentMember = members.find(m => m.userId === user?.uid);
  const isAdmin = currentMember?.role === 'admin';
  const isMember = !!currentMember;

  const handleLeaveGroup = () => {
    haptics.medium();
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid) return;

            try {
              setLeaving(true);
              await removeGroupMember(user.uid, groupId);

              haptics.success();
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'You have left the group',
              });

              navigation.goBack();
            } catch (err) {
              console.error('Error leaving group:', err);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err instanceof Error ? err.message : 'Failed to leave group',
              });
            } finally {
              setLeaving(false);
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = async (userId: string, newRole: 'admin' | 'moderator' | 'member') => {
    const success = await changeRole(userId, groupId, newRole);

    if (success) {
      haptics.success();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Member role updated successfully',
      });
      await refreshMembers();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update member role',
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    const success = await removeMember(userId, groupId);

    if (success) {
      haptics.success();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Member removed from group',
      });
      await refreshMembers();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to remove member',
      });
    }
  };

  const handleShareGroup = async () => {
    try {
      haptics.medium();

      // Get or generate invite code
      let inviteCode = group?.inviteCode;
      if (!inviteCode) {
        inviteCode = await generateGroupInviteCode(groupId);
        // Refresh group to get updated invite code
        await refreshGroup();
      }

      // Show alert with invite code and copy option
      Alert.alert(
        'Share Group',
        `Invite Code: ${inviteCode}\n\nShare this code with others to invite them to join "${group?.name}"`,
        [
          {
            text: 'Copy Code',
            onPress: () => {
              Clipboard.setString(inviteCode!);
              haptics.success();
              Toast.show({
                type: 'success',
                text1: 'Copied!',
                text2: 'Invite code copied to clipboard',
              });
            },
          },
          {
            text: 'Close',
            style: 'cancel',
          },
        ]
      );
    } catch (err) {
      console.error('Error sharing group:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to generate invite code',
      });
    }
  };

  const getPrivacyIcon = () => {
    switch (group?.privacyLevel) {
      case 'private':
        return 'lock';
      case 'invite-only':
        return 'account-key';
      default:
        return 'earth';
    }
  };

  const getPrivacyColor = () => {
    switch (group?.privacyLevel) {
      case 'private':
        return theme.colors.error;
      case 'invite-only':
        return theme.colors.warning;
      default:
        return theme.colors.success;
    }
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
        Loading group...
      </Text>
    </View>
  );

  if (loading && !group) {
    return (
      <View style={styles.container}>
        {renderLoadingState()}
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="alert-circle-outline" size={64} color={theme.colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Group Not Found
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            This group may have been deleted or you don't have access to it.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={groupLoading || membersLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Group Info Card */}
        <Card elevation="md" style={styles.groupCard}>
          <View style={styles.groupHeader}>
            <View style={styles.groupTitleRow}>
              <Text style={[styles.groupName, { color: theme.colors.text }]}>
                {group.name}
              </Text>
              <Icon
                name={getPrivacyIcon()}
                size={20}
                color={getPrivacyColor()}
              />
            </View>

            {group.description && (
              <Text style={[styles.groupDescription, { color: theme.colors.textSecondary }]}>
                {group.description}
              </Text>
            )}

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Icon name="account-group" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Icon name="clock-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  Created {formatDistanceToNow(group.createdAt, { addSuffix: true })}
                </Text>
              </View>
            </View>

            {!group.isActive && (
              <View style={[styles.inactiveBadge, { backgroundColor: theme.colors.error + '20' }]}>
                <Icon name="alert" size={16} color={theme.colors.error} />
                <Text style={[styles.inactiveBadgeText, { color: theme.colors.error }]}>
                  This group is inactive
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Members Section */}
        <View style={styles.membersSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Members ({members.length})
          </Text>

          {membersLoading && members.length === 0 ? (
            <View style={styles.membersLoadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={members}
              keyExtractor={(item) => item.id || `${item.userId}_${item.groupId}`}
              renderItem={({ item }) => (
                <MemberListItem
                  member={item}
                  isAdmin={isAdmin}
                  currentUserId={user?.uid}
                  onChangeRole={handleChangeRole}
                  onRemove={handleRemoveMember}
                />
              )}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyMembers}>
                  <Text style={[styles.emptyMembersText, { color: theme.colors.textSecondary }]}>
                    No members found
                  </Text>
                </View>
              }
            />
          )}
        </View>

        {/* Action Buttons */}
        {isMember && (
          <View style={styles.actionsSection}>
            <Button
              title="Share Group"
              onPress={handleShareGroup}
              icon="share-variant"
            />

            {isAdmin && (
              <>
                <Button
                  title="Invite Members"
                  onPress={() => {
                    haptics.light();
                    navigation.navigate('InviteMembers', { groupId });
                  }}
                  icon="account-multiple-plus"
                  variant="outline"
                />
                <Button
                  title="Group Settings"
                  onPress={() => {
                    haptics.light();
                    navigation.navigate('GroupSettings', { groupId });
                  }}
                  icon="cog"
                  variant="outline"
                />
              </>
            )}

            <Button
              title="Leave Group"
              onPress={handleLeaveGroup}
              variant="outline"
              loading={leaving}
              disabled={leaving || isAdmin}
              icon="exit-to-app"
            />
            {isAdmin && (
              <Text style={[styles.adminNote, { color: theme.colors.textTertiary }]}>
                Admins cannot leave. Transfer ownership or delete the group.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    loadingText: {
      marginTop: theme.spacing.md,
      fontSize: theme.typography.fontSize.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    emptySubtitle: {
      fontSize: theme.typography.fontSize.md,
      textAlign: 'center',
    },
    groupCard: {
      margin: theme.spacing.md,
    },
    groupHeader: {
      padding: theme.spacing.md,
    },
    groupTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    groupName: {
      fontSize: theme.typography.fontSize.xxl,
      fontWeight: theme.typography.fontWeight.bold,
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    groupDescription: {
      fontSize: theme.typography.fontSize.md,
      lineHeight: 22,
      marginBottom: theme.spacing.md,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      fontSize: theme.typography.fontSize.sm,
      marginLeft: 4,
    },
    inactiveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      marginTop: theme.spacing.md,
    },
    inactiveBadgeText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      marginLeft: 4,
    },
    membersSection: {
      marginTop: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    membersLoadingContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyMembers: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyMembersText: {
      fontSize: theme.typography.fontSize.md,
    },
    actionsSection: {
      padding: theme.spacing.md,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    adminNote: {
      fontSize: theme.typography.fontSize.sm,
      textAlign: 'center',
      marginTop: -theme.spacing.sm,
    },
  });

export default GroupDetailScreen;
