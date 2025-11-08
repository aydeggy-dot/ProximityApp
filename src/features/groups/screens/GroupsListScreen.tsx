// Groups List screen with tabs and search

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { GroupsStackParamList, Group } from '../../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useGroups } from '../hooks/useGroups';
import { useSearchGroups } from '../hooks/useSearchGroups';
import { useJoinGroup } from '../hooks/useJoinGroup';
import { useAuth } from '../../../contexts/AuthContext';
import { joinGroupWithInviteCode } from '../../../services/firebase/firestore';
import { GroupCard } from '../components/GroupCard';
import { Button } from '../../../components/ui/Button';
import { haptics } from '../../../utils/haptics';
import Toast from 'react-native-toast-message';

type GroupsListScreenNavigationProp = StackNavigationProp<
  GroupsStackParamList,
  'GroupsList'
>;

interface Props {
  navigation: GroupsListScreenNavigationProp;
}

type TabType = 'my-groups' | 'discover' | 'created';

const GroupsListScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { groups: myGroups, loading: myGroupsLoading, error: myGroupsError, refreshing: myGroupsRefreshing, refresh: refreshMyGroups } = useGroups();
  const { groups: searchResults, loading: searchLoading, error: searchError, search, loadPublicGroups } = useSearchGroups();
  const { joinGroup, joining, checkMembership } = useJoinGroup();

  const [activeTab, setActiveTab] = useState<TabType>('my-groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joiningWithCode, setJoiningWithCode] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<Record<string, boolean>>({});

  const styles = createStyles(theme);

  // Load public groups when switching to discover tab
  useEffect(() => {
    if (activeTab === 'discover') {
      loadPublicGroups();
    }
  }, [activeTab, loadPublicGroups]);

  // Check membership status for discover groups
  useEffect(() => {
    if (activeTab === 'discover' && searchResults.length > 0) {
      const checkAllMemberships = async () => {
        const statuses: Record<string, boolean> = {};
        for (const group of searchResults) {
          statuses[group.id] = await checkMembership(group.id);
        }
        setMembershipStatus(statuses);
      };
      checkAllMemberships();
    }
  }, [searchResults, activeTab, checkMembership]);

  // Show errors
  useEffect(() => {
    const error = myGroupsError || searchError;
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error,
      });
    }
  }, [myGroupsError, searchError]);

  const handleTabChange = (tab: TabType) => {
    haptics.light();
    setActiveTab(tab);
    setSearchQuery('');
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (activeTab === 'discover') {
      await search(query);
    }
  };

  const handleGroupPress = (groupId: string) => {
    haptics.light();
    navigation.navigate('GroupDetail', { groupId });
  };

  const handleCreateGroup = () => {
    haptics.medium();
    navigation.navigate('CreateGroup');
  };

  const handleJoinGroup = async (groupId: string) => {
    haptics.medium();
    const success = await joinGroup(groupId);

    if (success) {
      haptics.success();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'You have joined the group!',
      });

      // Update membership status
      setMembershipStatus(prev => ({ ...prev, [groupId]: true }));

      // Refresh my groups
      await refreshMyGroups();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to join group',
      });
    }
  };

  const handleJoinWithInviteCode = async () => {
    if (!inviteCode.trim()) {
      haptics.light();
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: 'Please enter an invite code',
      });
      return;
    }

    if (!user?.uid) {
      return;
    }

    try {
      setJoiningWithCode(true);
      haptics.medium();

      const group = await joinGroupWithInviteCode(user.uid, inviteCode.trim());

      if (group) {
        haptics.success();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `You have joined ${group.name}!`,
        });

        setInviteCode('');
        await refreshMyGroups();

        // Navigate to the group
        navigation.navigate('GroupDetail', { groupId: group.id });
      }
    } catch (err) {
      console.error('Error joining with invite code:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err instanceof Error ? err.message : 'Failed to join group',
      });
    } finally {
      setJoiningWithCode(false);
    }
  };

  const getFilteredGroups = () => {
    if (activeTab === 'my-groups') {
      return myGroups;
    } else if (activeTab === 'created') {
      return myGroups.filter(group => group.createdBy === user?.uid);
    } else {
      return searchResults;
    }
  };

  const renderTabButton = (tab: TabType, label: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => handleTabChange(tab)}
      activeOpacity={0.7}
    >
      <Icon
        name={icon}
        size={20}
        color={activeTab === tab ? theme.colors.primary : theme.colors.textSecondary}
      />
      <Text
        style={[
          styles.tabButtonText,
          {
            color: activeTab === tab ? theme.colors.primary : theme.colors.textSecondary,
            fontWeight: activeTab === tab ? '600' : '400',
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderSearchBar = () => {
    if (activeTab !== 'discover') return null;

    return (
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Icon name="magnify" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search groups..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Icon name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderInviteCodeInput = () => {
    if (activeTab !== 'discover') return null;

    return (
      <View style={styles.inviteCodeSection}>
        <Text style={[styles.inviteCodeLabel, { color: theme.colors.text }]}>
          Have an invite code?
        </Text>
        <View style={[styles.inviteCodeContainer, { backgroundColor: theme.colors.surface }]}>
          <Icon name="ticket" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.inviteCodeInput, { color: theme.colors.text }]}
            placeholder="Enter code..."
            placeholderTextColor={theme.colors.textTertiary}
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
          />
          <TouchableOpacity
            style={[
              styles.joinCodeButton,
              {
                backgroundColor: inviteCode.trim()
                  ? theme.colors.primary
                  : theme.colors.surface,
              },
            ]}
            onPress={handleJoinWithInviteCode}
            disabled={joiningWithCode || !inviteCode.trim()}
            activeOpacity={0.7}
          >
            {joiningWithCode ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon
                name="arrow-right"
                size={20}
                color={inviteCode.trim() ? '#fff' : theme.colors.textTertiary}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (activeTab === 'discover') {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="magnify" size={64} color={theme.colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            {searchQuery ? 'No Groups Found' : 'Discover Groups'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            {searchQuery
              ? 'Try a different search term'
              : 'Search for public groups to join'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Icon name="account-group-outline" size={64} color={theme.colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          {activeTab === 'created' ? 'No Groups Created' : 'No Groups Yet'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
          {activeTab === 'created'
            ? 'Create your first group to get started'
            : 'Create or join a group to start finding nearby members'}
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleCreateGroup}
        >
          <Text style={styles.createButtonText}>Create Your First Group</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderGroupItem = ({ item }: { item: Group }) => {
    const isMember = activeTab === 'discover' ? membershipStatus[item.id] : true;

    return (
      <View>
        <GroupCard group={item} onPress={handleGroupPress} />
        {activeTab === 'discover' && !isMember && (
          <View style={styles.joinButtonContainer}>
            <Button
              title="Join Group"
              onPress={() => handleJoinGroup(item.id)}
              loading={joining}
              disabled={joining}
              variant="outline"
              size="small"
              icon="account-plus"
            />
          </View>
        )}
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
        Loading groups...
      </Text>
    </View>
  );

  const currentGroups = getFilteredGroups();
  const isLoading = (activeTab === 'my-groups' || activeTab === 'created') ? myGroupsLoading : searchLoading;
  const isRefreshing = activeTab === 'my-groups' ? myGroupsRefreshing : false;

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.background }]}>
        {renderTabButton('my-groups', 'My Groups', 'account-group')}
        {renderTabButton('created', 'Created', 'account-star')}
        {renderTabButton('discover', 'Discover', 'magnify')}
      </View>

      {/* Search Bar */}
      {renderSearchBar()}

      {/* Invite Code Input */}
      {renderInviteCodeInput()}

      {/* Content */}
      {isLoading && currentGroups.length === 0 ? (
        renderLoadingState()
      ) : (
        <FlatList
          data={currentGroups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={currentGroups.length === 0 ? styles.emptyListContent : undefined}
          refreshControl={
            activeTab !== 'discover' ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshMyGroups}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating action button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateGroup}
      >
        <Icon name="plus" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    tabsContainer: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
      gap: 6,
    },
    tabButtonActive: {
      backgroundColor: theme.colors.primary + '15',
    },
    tabButtonText: {
      fontSize: theme.typography.fontSize.sm,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.lg,
      gap: theme.spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: theme.typography.fontSize.md,
      padding: 0,
    },
    inviteCodeSection: {
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    inviteCodeLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      marginBottom: theme.spacing.xs,
    },
    inviteCodeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.lg,
      gap: theme.spacing.sm,
    },
    inviteCodeInput: {
      flex: 1,
      fontSize: theme.typography.fontSize.md,
      padding: 0,
    },
    joinCodeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
      marginTop: 100,
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
      marginBottom: theme.spacing.xl,
    },
    emptyListContent: {
      flexGrow: 1,
    },
    createButton: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    createButtonText: {
      color: '#ffffff',
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
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
    joinButtonContainer: {
      paddingHorizontal: theme.spacing.md,
      marginTop: -theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    fab: {
      position: 'absolute',
      right: theme.spacing.md,
      bottom: theme.spacing.md,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.lg,
    },
  });

export default GroupsListScreen;
