/**
 * NotificationsScreen
 *
 * Displays proximity alerts to the user with real-time updates.
 * Features:
 * - Real-time subscription to Firestore proximity alerts
 * - Filter between all and unacknowledged alerts
 * - Acknowledge/dismiss alerts
 * - Shows user details, distance, timestamp, and group name
 * - Relative time formatting (e.g., "2 minutes ago")
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import {
  subscribeToProximityAlerts,
  acknowledgeProximityAlert,
} from '../../../services/firebase/firestore';
import { ProximityAlert } from '../../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

type FilterType = 'all' | 'unacknowledged';

const NotificationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<ProximityAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<ProximityAlert[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = createStyles(theme);

  /**
   * Subscribe to proximity alerts for current user
   */
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    console.log('Subscribing to proximity alerts for user:', user.uid);

    const unsubscribe = subscribeToProximityAlerts(user.uid, (fetchedAlerts) => {
      console.log(`Received ${fetchedAlerts.length} proximity alerts`);
      setAlerts(fetchedAlerts);
      setLoading(false);
      setRefreshing(false);
    });

    return () => {
      console.log('Unsubscribing from proximity alerts');
      unsubscribe();
    };
  }, [user?.uid]);

  /**
   * Filter alerts based on selected filter
   */
  useEffect(() => {
    if (filter === 'all') {
      setFilteredAlerts(alerts);
    } else {
      setFilteredAlerts(alerts.filter(alert => !alert.acknowledged));
    }
  }, [alerts, filter]);

  /**
   * Acknowledge an alert
   */
  const handleAcknowledge = useCallback(
    async (alertId: string) => {
      try {
        await acknowledgeProximityAlert(alertId);

        Toast.show({
          type: 'success',
          text1: 'Alert Dismissed',
          position: 'bottom',
          visibilityTime: 2000,
        });
      } catch (err) {
        console.error('Error acknowledging alert:', err);
        Toast.show({
          type: 'error',
          text1: 'Error Dismissing Alert',
          text2: err instanceof Error ? err.message : 'Please try again',
          position: 'bottom',
        });
      }
    },
    []
  );

  /**
   * Format timestamp as relative time (e.g., "2 minutes ago")
   */
  const formatRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  /**
   * Render a single alert item
   */
  const renderAlertItem = ({ item }: { item: ProximityAlert }) => {
    const isNew = !item.acknowledged;

    return (
      <View style={[styles.alertCard, isNew && styles.alertCardNew]}>
        <View style={styles.alertHeader}>
          <View style={styles.alertUserInfo}>
            {item.userProfile.photoURL ? (
              <Image
                source={{ uri: item.userProfile.photoURL }}
                style={styles.userAvatar}
              />
            ) : (
              <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
                <Icon name="account" size={24} color={theme.colors.textTertiary} />
              </View>
            )}
            <View style={styles.alertTextInfo}>
              <Text style={styles.alertUserName}>
                {item.userProfile.displayName}
              </Text>
              <Text style={styles.alertGroupName}>{item.groupName || 'Unknown Group'}</Text>
            </View>
          </View>
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>

        <View style={styles.alertBody}>
          <View style={styles.alertDetail}>
            <Icon name="map-marker-distance" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.alertDetailText}>
              {Math.round(item.distance)}m away
            </Text>
          </View>
          <View style={styles.alertDetail}>
            <Icon name="clock-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.alertDetailText}>
              {formatRelativeTime(item.timestamp)}
            </Text>
          </View>
        </View>

        {isNew && (
          <TouchableOpacity
            style={styles.acknowledgeButton}
            onPress={() => handleAcknowledge(item.id)}
          >
            <Icon name="check" size={18} color={theme.colors.primary} />
            <Text style={styles.acknowledgeButtonText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  /**
   * Refresh alerts
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // The subscription will automatically update the alerts
    // Just set refreshing to show the loading indicator
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  /**
   * Render filter tabs
   */
  const renderFilterTabs = () => {
    const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

    return (
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'all' && styles.filterTabTextActive,
            ]}
          >
            All ({alerts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'unacknowledged' && styles.filterTabActive,
          ]}
          onPress={() => setFilter('unacknowledged')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'unacknowledged' && styles.filterTabTextActive,
            ]}
          >
            New ({unacknowledgedCount})
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Error Loading Alerts</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const emptyMessage =
      filter === 'unacknowledged'
        ? 'No new alerts'
        : 'No alerts yet';
    const emptySubtitle =
      filter === 'unacknowledged'
        ? 'All alerts have been acknowledged'
        : "You'll be notified when group members are nearby";

    return (
      <View style={styles.centerContainer}>
        <Icon name="bell-outline" size={64} color={theme.colors.textTertiary} />
        <Text style={styles.emptyTitle}>{emptyMessage}</Text>
        <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Proximity Alerts</Text>
      </View>

      {renderFilterTabs()}

      <FlatList
        data={filteredAlerts}
        renderItem={renderAlertItem}
        keyExtractor={item => item.id}
        contentContainerStyle={
          filteredAlerts.length === 0 ? styles.emptyListContainer : styles.listContainer
        }
        ListEmptyComponent={renderEmptyState()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    filterTabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    filterTab: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    filterTabActive: {
      borderBottomColor: theme.colors.primary,
    },
    filterTabText: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    filterTabTextActive: {
      color: theme.colors.primary,
      fontWeight: theme.typography.fontWeight.bold,
    },
    listContainer: {
      padding: theme.spacing.md,
    },
    emptyListContainer: {
      flex: 1,
    },
    alertCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    alertCardNew: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    alertHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    alertUserInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: theme.spacing.sm,
    },
    userAvatarPlaceholder: {
      backgroundColor: theme.colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    alertTextInfo: {
      flex: 1,
    },
    alertUserName: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    alertGroupName: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    newBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
    },
    newBadgeText: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.bold,
      color: '#FFFFFF',
    },
    alertBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    alertDetail: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    alertDetailText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.xs,
    },
    acknowledgeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      marginTop: theme.spacing.xs,
    },
    acknowledgeButtonText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.primary,
      marginLeft: theme.spacing.xs,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    emptySubtitle: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    loadingText: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
    },
    errorTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.error,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    errorSubtitle: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
    },
    retryButtonText: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.bold,
      color: '#FFFFFF',
    },
  });

export default NotificationsScreen;
