/**
 * MapScreen - Proximity-based group member tracking
 *
 * Features:
 * - Real-time location tracking and broadcasting
 * - Proximity detection for group members
 * - Broadcasting toggle control
 * - Visual markers for nearby users
 * - Distance calculations
 * - Alert triggering with haptics
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle, Polyline, Callout } from 'react-native-maps';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLocation } from '../../../contexts/LocationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroups } from '../../groups/hooks/useGroups';
import { useLocationSync } from '../../proximity/hooks/useLocationSync';
import { useProximityDetection } from '../../proximity/hooks/useProximityDetection';
import { useBackgroundLocation } from '../../../hooks/useBackgroundLocation';
import { useMeetRequests } from '../../../hooks/useMeetRequests';
import { updateGroupMembership, getDocument, createProximityAlert } from '../../../services/firebase/firestore';
import { MAP_DEFAULTS, COLLECTIONS } from '../../../constants';
import { GroupMembership, ProximityAlert as ProximityAlertType } from '../../../types';
import { formatDistance } from '../../../utils/distance';
import {
  calculateETA,
  calculateBearing,
  createPolylinePoints,
  getTimeSinceUpdate,
  isLocationStale,
  getDirectionDescription
} from '../../../utils/mapHelpers';
import { haptics } from '../../../utils/haptics';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import MeetRequestModal from '../../../components/MeetRequestModal';

const MapScreen: React.FC = () => {
  const { theme } = useTheme();
  const { currentLocation, locationPermission, requestPermission, startTracking, isTracking } =
    useLocation();
  const { user } = useAuth();
  const { groups, loading: groupsLoading } = useGroups();

  const [mapReady, setMapReady] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [loadingBroadcast, setLoadingBroadcast] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [meetRequestModalVisible, setMeetRequestModalVisible] = useState(false);
  const [showPolylines, setShowPolylines] = useState(true);
  const mapRef = useRef<MapView>(null);

  // Initialize location sync (syncs to all broadcasting groups)
  const locationSync = useLocationSync({
    autoSync: true,
  });

  // Proximity detection for selected group
  const proximityDetection = useProximityDetection({
    groupId: selectedGroupId || '',
    enabled: !!selectedGroupId && isBroadcasting,
    onProximityAlert: handleProximityAlert,
  });

  // Background location tracking
  const backgroundLocation = useBackgroundLocation();

  // Meet requests
  const meetRequests = useMeetRequests();

  useEffect(() => {
    initializeLocation();
  }, []);

  // Select first group by default
  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
      loadBroadcastingStatus(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  const initializeLocation = async () => {
    if (!locationPermission) {
      const granted = await requestPermission();
      if (granted) {
        startTracking();
      } else {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show nearby group members'
        );
      }
    } else if (!isTracking) {
      startTracking();
    }
  };

  /**
   * Load broadcasting status for selected group
   */
  const loadBroadcastingStatus = async (groupId: string) => {
    if (!user?.uid) return;

    try {
      const membershipId = `${user.uid}_${groupId}`;
      const membership = await getDocument<GroupMembership>(
        COLLECTIONS.GROUP_MEMBERSHIPS,
        membershipId
      );
      setIsBroadcasting(membership?.isBroadcasting || false);
    } catch (error) {
      console.error('Error loading broadcasting status:', error);
    }
  };

  /**
   * Toggle broadcasting for current group
   */
  const toggleBroadcasting = async () => {
    if (!user?.uid || !selectedGroupId) return;

    setLoadingBroadcast(true);
    haptics.light();

    try {
      const newBroadcastingState = !isBroadcasting;

      await updateGroupMembership(user.uid, selectedGroupId, {
        isBroadcasting: newBroadcastingState,
      });

      setIsBroadcasting(newBroadcastingState);

      Toast.show({
        type: 'success',
        text1: newBroadcastingState ? 'Broadcasting Started' : 'Broadcasting Stopped',
        text2: newBroadcastingState
          ? 'Your location is now visible to group members'
          : 'Your location is hidden from group members',
        position: 'top',
      });

      console.log(`Broadcasting ${newBroadcastingState ? 'enabled' : 'disabled'} for group ${selectedGroupId}`);
    } catch (error) {
      console.error('Error toggling broadcasting:', error);
      Alert.alert('Error', 'Failed to update broadcasting status');
    } finally {
      setLoadingBroadcast(false);
    }
  };

  /**
   * Handle group selection change
   */
  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    loadBroadcastingStatus(groupId);
    haptics.selection();
  };

  /**
   * Center map on user location
   */
  const centerOnUser = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: MAP_DEFAULTS.LATITUDE_DELTA,
        longitudeDelta: MAP_DEFAULTS.LONGITUDE_DELTA,
      });
      haptics.light();
    }
  };

  /**
   * Handle proximity alert - save to Firestore
   */
  async function handleProximityAlert(alert: ProximityAlertType) {
    if (!user?.uid) return;

    try {
      // Find the group name for this alert
      const group = groups.find(g => g.id === alert.groupId);
      const groupName = group?.name || 'Unknown Group';

      await createProximityAlert({
        ...alert,
        userId: user.uid, // The user receiving the alert
        groupName, // Populate the group name
      });
      console.log('Proximity alert saved to Firestore:', alert.id);
    } catch (error) {
      console.error('Error saving proximity alert:', error);
    }
  }

  const styles = createStyles(theme);

  // Loading state
  if (!currentLocation || groupsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>
          {!currentLocation ? 'Getting your location...' : 'Loading groups...'}
        </Text>
      </View>
    );
  }

  // No groups state
  if (groups.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="account-group-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.emptyText}>No Groups Yet</Text>
        <Text style={styles.emptySubtext}>Join or create a group to see nearby members</Text>
      </View>
    );
  }

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const { nearbyUsers, usersByDistance } = proximityDetection;

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: MAP_DEFAULTS.LATITUDE_DELTA,
          longitudeDelta: MAP_DEFAULTS.LONGITUDE_DELTA,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        onMapReady={() => setMapReady(true)}
      >
        {/* Current user marker */}
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="You"
          description={isBroadcasting ? 'Broadcasting' : 'Not Broadcasting'}
        >
          <View style={styles.currentUserMarker}>
            <Icon name="account" size={24} color="#ffffff" />
          </View>
        </Marker>

        {/* Proximity radius circle */}
        {isBroadcasting && (
          <Circle
            center={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            radius={100} // Default 100m, should use user preference
            strokeColor="rgba(74, 144, 226, 0.5)"
            fillColor="rgba(74, 144, 226, 0.1)"
            strokeWidth={2}
          />
        )}

        {/* Nearby users markers */}
        {isBroadcasting &&
          usersByDistance.map(nearbyUser => (
            <Marker
              key={nearbyUser.userId}
              coordinate={{
                latitude: nearbyUser.location.latitude,
                longitude: nearbyUser.location.longitude,
              }}
              title={nearbyUser.userProfile?.displayName || 'Group Member'}
              description={`${Math.round(nearbyUser.distance)}m away`}
            >
              <View
                style={[
                  styles.nearbyUserMarker,
                  nearbyUsers.some(u => u.userId === nearbyUser.userId) && styles.veryCloseMarker,
                ]}
              >
                <Icon
                  name="account"
                  size={20}
                  color={nearbyUsers.some(u => u.userId === nearbyUser.userId) ? '#ffffff' : theme.colors.primary}
                />
              </View>
            </Marker>
          ))}
      </MapView>

      {/* Group Selector Header */}
      <View style={styles.header}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupSelectorScroll}
        >
          {groups.map(group => (
            <TouchableOpacity
              key={group.id}
              style={[
                styles.groupChip,
                selectedGroupId === group.id && styles.groupChipActive,
              ]}
              onPress={() => handleGroupChange(group.id)}
            >
              <Text
                style={[
                  styles.groupChipText,
                  selectedGroupId === group.id && styles.groupChipTextActive,
                ]}
                numberOfLines={1}
              >
                {group.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Broadcasting Control Card */}
      <View style={styles.broadcastCard}>
        <View style={styles.broadcastHeader}>
          <View style={styles.broadcastInfo}>
            <Icon
              name={isBroadcasting ? 'broadcast' : 'broadcast-off'}
              size={24}
              color={isBroadcasting ? theme.colors.success : theme.colors.textSecondary}
            />
            <View style={styles.broadcastTextContainer}>
              <Text style={styles.broadcastTitle}>
                {isBroadcasting ? 'Broadcasting' : 'Not Broadcasting'}
              </Text>
              <Text style={styles.broadcastSubtitle}>
                {isBroadcasting
                  ? `Visible to ${selectedGroup?.memberCount || 0} members`
                  : 'Turn on to share your location'}
              </Text>
            </View>
          </View>
          <Switch
            value={isBroadcasting}
            onValueChange={toggleBroadcasting}
            disabled={loadingBroadcast}
            trackColor={{ false: theme.colors.border, true: theme.colors.success }}
            thumbColor={isBroadcasting ? theme.colors.surface : theme.colors.textSecondary}
          />
        </View>

        {/* Sync Status */}
        {isBroadcasting && (
          <View style={styles.syncStatus}>
            <Icon
              name={locationSync.isSyncing ? 'sync' : 'check-circle'}
              size={14}
              color={theme.colors.success}
            />
            <Text style={styles.syncStatusText}>
              {locationSync.isSyncing
                ? 'Syncing location...'
                : locationSync.lastSyncTime
                ? `Last synced ${new Date(locationSync.lastSyncTime).toLocaleTimeString()}`
                : 'Ready to sync'}
            </Text>
          </View>
        )}
      </View>

      {/* Center on user button */}
      <TouchableOpacity style={styles.fab} onPress={centerOnUser}>
        <Icon name="crosshairs-gps" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Bottom sheet - Nearby members */}
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>
            Nearby Members ({nearbyUsers.length})
          </Text>
          {proximityDetection.isDetecting && (
            <View style={styles.detectingBadge}>
              <View style={styles.pulsingDot} />
              <Text style={styles.detectingText}>Live</Text>
            </View>
          )}
        </View>

        {!isBroadcasting ? (
          <Text style={styles.bottomSheetSubtitle}>
            Enable broadcasting to see nearby members
          </Text>
        ) : usersByDistance.length === 0 ? (
          <Text style={styles.bottomSheetSubtitle}>
            No group members are currently broadcasting
          </Text>
        ) : nearbyUsers.length === 0 ? (
          <Text style={styles.bottomSheetSubtitle}>
            No members within your proximity radius
          </Text>
        ) : (
          <ScrollView
            style={styles.nearbyList}
            showsVerticalScrollIndicator={false}
          >
            {nearbyUsers.map(nearbyUser => (
              <View key={nearbyUser.userId} style={styles.nearbyUserCard}>
                <View style={styles.nearbyUserAvatar}>
                  <Icon name="account" size={32} color={theme.colors.primary} />
                </View>
                <View style={styles.nearbyUserInfo}>
                  <Text style={styles.nearbyUserName}>
                    {nearbyUser.userProfile?.displayName || 'Group Member'}
                  </Text>
                  <Text style={styles.nearbyUserDistance}>
                    {formatDistance(nearbyUser.distance)} away
                  </Text>
                </View>
                <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.xl,
    },
    loadingText: {
      marginTop: theme.spacing.md,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.md,
    },
    emptyText: {
      marginTop: theme.spacing.md,
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
    },
    emptySubtext: {
      marginTop: theme.spacing.sm,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.md,
      textAlign: 'center',
    },
    map: {
      flex: 1,
    },
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface,
      ...theme.shadows.md,
    },
    groupSelectorScroll: {
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    groupChip: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.background,
      borderWidth: 2,
      borderColor: theme.colors.border,
      marginRight: theme.spacing.sm,
    },
    groupChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    groupChipText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    groupChipTextActive: {
      color: '#ffffff',
    },
    broadcastCard: {
      position: 'absolute',
      top: 80,
      left: theme.spacing.md,
      right: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      ...theme.shadows.lg,
    },
    broadcastHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    broadcastInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    broadcastTextContainer: {
      marginLeft: theme.spacing.sm,
      flex: 1,
    },
    broadcastTitle: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    broadcastSubtitle: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    syncStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    syncStatusText: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.xs,
    },
    currentUserMarker: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: '#ffffff',
    },
    nearbyUserMarker: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    veryCloseMarker: {
      backgroundColor: theme.colors.warning,
      borderColor: theme.colors.warning,
    },
    fab: {
      position: 'absolute',
      right: theme.spacing.md,
      bottom: 220,
      backgroundColor: theme.colors.primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.lg,
    },
    bottomSheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      maxHeight: 300,
      ...theme.shadows.xl,
    },
    bottomSheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    bottomSheetTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    detectingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.success + '20',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
    },
    pulsingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.success,
      marginRight: theme.spacing.xs,
    },
    detectingText: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.success,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    bottomSheetSubtitle: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
    },
    nearbyList: {
      maxHeight: 200,
    },
    nearbyUserCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    nearbyUserAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    nearbyUserInfo: {
      flex: 1,
    },
    nearbyUserName: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    nearbyUserDistance: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  });

export default MapScreen;
