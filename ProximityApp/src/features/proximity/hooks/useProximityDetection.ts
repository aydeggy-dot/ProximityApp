/**
 * useProximityDetection Hook
 *
 * Real-time proximity detection and alert triggering for group members.
 * This is the core hook that makes the proximity-based app functional.
 *
 * Features:
 * - Real-time monitoring of nearby users via Firestore subscriptions
 * - Distance calculation and proximity checking
 * - Alert debouncing to prevent spam
 * - User preference enforcement (radius, quiet hours, enable/disable)
 * - Haptic feedback and toast notifications
 * - Alert history tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from '../../../contexts/LocationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { subscribeToNearbyUsers, getUserProfile } from '../../../services/firebase/firestore';
import {
  findNearbyUsers,
  calculateDistancesToUsers,
  shouldTriggerAlert,
} from '../../../services/proximity/ProximityService';
import { UserLocation, ProximityAlert, Location, UserProfile, AlertStyle } from '../../../types';
import { haptics } from '../../../utils/haptics';
import { sounds } from '../../../utils/sounds';
import Toast from 'react-native-toast-message';

interface UseProximityDetectionOptions {
  /**
   * Group ID to monitor for nearby users
   */
  groupId: string;

  /**
   * Proximity radius in meters (overrides user preference)
   */
  radiusMeters?: number;

  /**
   * Enable/disable detection (default: true)
   */
  enabled?: boolean;

  /**
   * Only trigger alerts when user is broadcasting (default: true)
   */
  triggerAlertsOnlyWhenBroadcasting?: boolean;

  /**
   * Alert debounce window in milliseconds (default: 5 minutes)
   */
  debounceWindowMs?: number;

  /**
   * Callback when new proximity alert is triggered
   */
  onProximityAlert?: (alert: ProximityAlert) => void;
}

interface NearbyUser extends UserLocation {
  distance: number;
  userProfile?: UserProfile;
}

interface UseProximityDetectionResult {
  /**
   * List of all users broadcasting in this group
   */
  allUsers: UserLocation[];

  /**
   * List of nearby users within proximity radius
   */
  nearbyUsers: NearbyUser[];

  /**
   * Users sorted by distance
   */
  usersByDistance: NearbyUser[];

  /**
   * Recent proximity alerts (for debouncing)
   */
  recentAlerts: ProximityAlert[];

  /**
   * Whether proximity detection is active
   */
  isDetecting: boolean;

  /**
   * Error message if any
   */
  error: string | null;

  /**
   * Manually trigger proximity check
   */
  checkNow: () => void;

  /**
   * Clear alert history
   */
  clearAlerts: () => void;
}

/**
 * Check if current time is within quiet hours
 */
function isQuietHours(quietHoursStart?: string, quietHoursEnd?: string): boolean {
  if (!quietHoursStart || !quietHoursEnd) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

  const [startHour, startMin] = quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = quietHoursEnd.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startMinutes > endMinutes) {
    return currentTime >= startMinutes || currentTime <= endMinutes;
  }

  return currentTime >= startMinutes && currentTime <= endMinutes;
}

/**
 * Hook for real-time proximity detection within a group
 */
export const useProximityDetection = (
  options: UseProximityDetectionOptions
): UseProximityDetectionResult => {
  const {
    groupId,
    radiusMeters,
    enabled = true,
    triggerAlertsOnlyWhenBroadcasting = true,
    debounceWindowMs = 300000, // 5 minutes
    onProximityAlert,
  } = options;

  const { user } = useAuth();
  const { currentLocation, isTracking } = useLocation();

  const [allUsers, setAllUsers] = useState<UserLocation[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [usersByDistance, setUsersByDistance] = useState<NearbyUser[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<ProximityAlert[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserProfile | null>(null);

  /**
   * Fetch user preferences
   */
  useEffect(() => {
    if (!user?.uid) return;

    const fetchPreferences = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        setUserPreferences(profile);
      } catch (err) {
        console.error('Error fetching user preferences:', err);
      }
    };

    fetchPreferences();
  }, [user?.uid]);

  /**
   * Trigger proximity alert with haptics and toast
   */
  const triggerProximityAlert = useCallback(
    async (nearbyUser: NearbyUser, distance: number) => {
      if (!user?.uid || !userPreferences) return;

      // Check if we should only trigger when broadcasting
      if (triggerAlertsOnlyWhenBroadcasting === false) {
        // Alerts allowed regardless of broadcasting status
      } else if (!triggerAlertsOnlyWhenBroadcasting) {
        // No alert when not broadcasting
        console.log('Not broadcasting - skipping proximity alert');
        return;
      }

      // Check if alerts are enabled
      if (!userPreferences.notificationPreferences.enableProximityAlerts) {
        console.log('Proximity alerts disabled in user preferences');
        return;
      }

      // Check quiet hours
      if (
        isQuietHours(
          userPreferences.notificationPreferences.quietHoursStart,
          userPreferences.notificationPreferences.quietHoursEnd
        )
      ) {
        console.log('Currently in quiet hours, skipping alert');
        return;
      }

      // Create alert
      const alert: ProximityAlert = {
        id: `${nearbyUser.userId}_${groupId}_${Date.now()}`,
        userId: nearbyUser.userId,
        groupId,
        distance,
        timestamp: new Date(),
        acknowledged: false,
        userProfile: nearbyUser.userProfile
          ? {
              displayName: nearbyUser.userProfile.displayName,
              photoURL: nearbyUser.userProfile.photoURL,
            }
          : {
              displayName: 'Unknown User',
            },
        groupName: '', // Will be populated by caller if needed
      };

      // Check debouncing
      if (!shouldTriggerAlert(nearbyUser.userId, groupId, recentAlerts, debounceWindowMs)) {
        console.log(`Alert for user ${nearbyUser.userId} recently triggered, skipping`);
        return;
      }

      // Add to recent alerts
      setRecentAlerts(prev => [...prev, alert]);

      // Get alert style preference (default to BOTH for backward compatibility)
      const alertStyle = userPreferences.notificationPreferences.alertStyle || AlertStyle.BOTH;

      // Trigger haptics based on alert style
      if (
        alertStyle === AlertStyle.VIBRATION ||
        alertStyle === AlertStyle.BOTH ||
        (alertStyle !== AlertStyle.SILENT && userPreferences.notificationPreferences.vibrationEnabled)
      ) {
        haptics.warning();
      }

      // Play sound based on alert style
      if (
        alertStyle === AlertStyle.SOUND ||
        alertStyle === AlertStyle.BOTH ||
        (alertStyle !== AlertStyle.SILENT && userPreferences.notificationPreferences.soundEnabled)
      ) {
        // Use different sounds based on distance
        if (distance < 20) {
          sounds.warning(); // Very close - use warning sound
        } else if (distance < 50) {
          sounds.alert(); // Close - use alert sound
        } else {
          sounds.notification(); // Nearby - use notification sound
        }
      }

      // Show toast notification
      Toast.show({
        type: 'info',
        text1: 'Nearby Group Member!',
        text2: `${alert.userProfile.displayName} is ${Math.round(distance)}m away`,
        position: 'top',
        visibilityTime: 4000,
      });

      console.log(`Proximity alert triggered for ${alert.userProfile.displayName} at ${distance}m (style: ${alertStyle})`);

      // Callback for external handling
      if (onProximityAlert) {
        onProximityAlert(alert);
      }
    },
    [user?.uid, userPreferences, groupId, recentAlerts, debounceWindowMs, triggerAlertsOnlyWhenBroadcasting, onProximityAlert]
  );

  /**
   * Check for proximity and trigger alerts
   */
  const checkProximity = useCallback(
    async (location: Location, users: UserLocation[]) => {
      if (!user?.uid || !userPreferences) return;

      // Determine radius (use override or user preference)
      const radius = radiusMeters || userPreferences.notificationPreferences.proximityRadius;

      // Find nearby users
      const nearby = findNearbyUsers(location, users, radius, user.uid);

      // Calculate distances for all users
      const withDistances = calculateDistancesToUsers(location, users)
        .filter(u => u.userId !== user.uid)
        .map(async u => {
          // Fetch user profile if not already loaded
          let profile = u.userProfile;
          if (!profile) {
            try {
              profile = await getUserProfile(u.userId);
            } catch (err) {
              console.error(`Error fetching profile for user ${u.userId}:`, err);
            }
          }

          return {
            ...u,
            userProfile: profile || undefined,
          };
        });

      const usersWithProfiles = await Promise.all(withDistances);

      // Update state
      const nearbyWithProfiles = usersWithProfiles.filter(u =>
        nearby.some(n => n.userId === u.userId)
      );

      setNearbyUsers(nearbyWithProfiles);
      setUsersByDistance(usersWithProfiles);

      // Trigger alerts for ALL nearby users (time-based debouncing in triggerProximityAlert)
      for (const nearbyUser of nearbyWithProfiles) {
        await triggerProximityAlert(nearbyUser, nearbyUser.distance);
      }
    },
    [user?.uid, userPreferences, radiusMeters, triggerProximityAlert]
  );

  /**
   * Subscribe to nearby users in the group (ONCE per group, don't re-create on location changes!)
   */
  useEffect(() => {
    if (!enabled || !groupId || !user?.uid) {
      setIsDetecting(false);
      setNearbyUsers([]);
      setUsersByDistance([]);
      return;
    }

    // Reset state immediately when groupId changes to prevent flickering
    setNearbyUsers([]);
    setUsersByDistance([]);
    setAllUsers([]);

    setIsDetecting(true);
    setError(null);

    console.log(`[ProximityDetection] Starting subscription for group ${groupId}`);

    const unsubscribe = subscribeToNearbyUsers(groupId, (locations) => {
      console.log(`[ProximityDetection] Received ${locations.length} locations from Firestore`);
      setAllUsers(locations);
    });

    return () => {
      console.log(`[ProximityDetection] Stopping subscription for group ${groupId}`);
      unsubscribe();
      setIsDetecting(false);
    };
  }, [enabled, groupId, user?.uid]); // CRITICAL FIX: Removed currentLocation, isTracking, checkProximity

  /**
   * Check proximity when location or users data changes (separate effect)
   */
  useEffect(() => {
    if (!currentLocation || !isTracking || allUsers.length === 0) {
      return;
    }

    console.log(`[ProximityDetection] Checking proximity: current location vs ${allUsers.length} users`);
    checkProximity(currentLocation, allUsers);
  }, [currentLocation, isTracking, allUsers, checkProximity]);

  /**
   * Manual proximity check
   */
  const checkNow = useCallback(() => {
    if (currentLocation && allUsers.length > 0) {
      checkProximity(currentLocation, allUsers);
    }
  }, [currentLocation, allUsers, checkProximity]);

  /**
   * Clear alert history
   */
  const clearAlerts = useCallback(() => {
    setRecentAlerts([]);
  }, []);

  /**
   * Clean up old alerts (older than debounce window)
   */
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setRecentAlerts(prev =>
        prev.filter(alert => now - alert.timestamp.getTime() < debounceWindowMs)
      );
    }, 60000); // Clean up every minute

    return () => clearInterval(cleanup);
  }, [debounceWindowMs]);

  return {
    allUsers,
    nearbyUsers,
    usersByDistance,
    recentAlerts,
    isDetecting,
    error,
    checkNow,
    clearAlerts,
  };
};
