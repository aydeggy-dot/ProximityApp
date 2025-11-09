/**
 * useLocationSync Hook
 *
 * Automatically syncs user location to Firestore for all groups where broadcasting is enabled.
 * This hook bridges LocationContext (local tracking) with Firestore (remote storage).
 *
 * Features:
 * - Monitors location changes from LocationContext
 * - Syncs location for each group where user has broadcasting enabled
 * - Implements throttling to avoid excessive Firestore writes
 * - Handles errors gracefully with automatic retry
 * - Tracks sync status and last sync time
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from '../../../contexts/LocationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { updateUserLocation, getGroupMemberships } from '../../../services/firebase/firestore';
import { GroupMembership, Location } from '../../../types';

// Constants for location syncing
const SYNC_THROTTLE_MS = 10000; // Sync at most every 10 seconds
const MAX_SYNC_DISTANCE_M = 10; // Only sync if moved more than 10 meters
const SYNC_RETRY_DELAY_MS = 5000; // Retry failed syncs after 5 seconds
const SYNC_STALE_THRESHOLD_MS = 60000; // Consider location stale after 1 minute

interface UseLocationSyncOptions {
  /**
   * Throttle interval in milliseconds (default: 10000)
   * Minimum time between location syncs
   */
  throttleMs?: number;

  /**
   * Minimum distance in meters to trigger sync (default: 10)
   * Only sync if user moved more than this distance
   */
  minDistanceMeters?: number;

  /**
   * Enable automatic syncing (default: true)
   * If false, you must call syncNow() manually
   */
  autoSync?: boolean;
}

interface UseLocationSyncResult {
  /**
   * Whether location syncing is currently active
   */
  isSyncing: boolean;

  /**
   * Last time location was successfully synced
   */
  lastSyncTime: Date | null;

  /**
   * Number of groups currently being synced to
   */
  activeGroupCount: number;

  /**
   * Error message if sync failed
   */
  error: string | null;

  /**
   * Manually trigger location sync
   */
  syncNow: () => Promise<void>;

  /**
   * Clear any sync errors
   */
  clearError: () => void;
}

/**
 * Calculate distance between two locations using Haversine formula
 */
function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (loc1.latitude * Math.PI) / 180;
  const φ2 = (loc2.latitude * Math.PI) / 180;
  const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Hook to automatically sync user location to Firestore for broadcasting groups
 */
export const useLocationSync = (options: UseLocationSyncOptions = {}): UseLocationSyncResult => {
  const {
    throttleMs = SYNC_THROTTLE_MS,
    minDistanceMeters = MAX_SYNC_DISTANCE_M,
    autoSync = true,
  } = options;

  const { user } = useAuth();
  const { currentLocation, isTracking } = useLocation();

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [activeGroupCount, setActiveGroupCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const lastSyncedLocation = useRef<Location | null>(null);
  const lastSyncTimestamp = useRef<number>(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const broadcatingMemberships = useRef<GroupMembership[]>([]);

  /**
   * Fetch groups where user is broadcasting
   */
  const fetchBroadcastingGroups = useCallback(async () => {
    if (!user?.uid) {
      broadcatingMemberships.current = [];
      setActiveGroupCount(0);
      return;
    }

    try {
      const memberships = await getGroupMemberships(user.uid);
      const broadcasting = memberships.filter(m => m.isBroadcasting);
      broadcatingMemberships.current = broadcasting;
      setActiveGroupCount(broadcasting.length);
    } catch (err) {
      console.error('Error fetching broadcasting groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch broadcasting groups');
    }
  }, [user?.uid]);

  /**
   * Sync current location to Firestore for all broadcasting groups
   */
  const syncLocation = useCallback(async (location: Location, force = false) => {
    if (!user?.uid) return;

    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTimestamp.current;

    // Check throttle (unless forced)
    if (!force && timeSinceLastSync < throttleMs) {
      return;
    }

    // Check minimum distance (unless forced)
    if (!force && lastSyncedLocation.current) {
      const distance = calculateDistance(lastSyncedLocation.current, location);
      if (distance < minDistanceMeters) {
        return;
      }
    }

    // Get broadcasting groups if needed
    if (broadcatingMemberships.current.length === 0) {
      await fetchBroadcastingGroups();
    }

    const groups = broadcatingMemberships.current;
    if (groups.length === 0) {
      // No broadcasting groups, nothing to sync
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      // Sync location to each broadcasting group
      const syncPromises = groups.map(membership =>
        updateUserLocation(user.uid, membership.groupId, location)
      );

      await Promise.all(syncPromises);

      // Update sync state
      lastSyncedLocation.current = location;
      lastSyncTimestamp.current = now;
      setLastSyncTime(new Date(now));

      console.log(`Location synced to ${groups.length} group(s) at ${new Date(now).toLocaleTimeString()}`);
    } catch (err) {
      console.error('Error syncing location:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync location';
      setError(errorMessage);

      // Schedule retry
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncLocation(location, true);
      }, SYNC_RETRY_DELAY_MS);
    } finally {
      setIsSyncing(false);
    }
  }, [user?.uid, throttleMs, minDistanceMeters, fetchBroadcastingGroups]);

  /**
   * Manually trigger sync
   */
  const syncNow = useCallback(async () => {
    if (!currentLocation) {
      setError('No current location available');
      return;
    }
    await syncLocation(currentLocation, true);
  }, [currentLocation, syncLocation]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Effect: Fetch broadcasting groups when user changes
   */
  useEffect(() => {
    fetchBroadcastingGroups();
  }, [fetchBroadcastingGroups]);

  /**
   * Effect: Auto-sync location when it changes
   */
  useEffect(() => {
    if (!autoSync || !isTracking || !currentLocation) {
      return;
    }

    syncLocation(currentLocation, false);
  }, [autoSync, isTracking, currentLocation, syncLocation]);

  /**
   * Effect: Cleanup timeouts on unmount
   */
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Effect: Check for stale location and re-sync periodically
   */
  useEffect(() => {
    if (!autoSync || activeGroupCount === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastSync = now - lastSyncTimestamp.current;

      // If location hasn't been synced in a while and we have a current location, re-sync
      if (timeSinceLastSync > SYNC_STALE_THRESHOLD_MS && currentLocation) {
        console.log('Location sync is stale, forcing re-sync...');
        syncLocation(currentLocation, true);
      }
    }, SYNC_STALE_THRESHOLD_MS);

    return () => clearInterval(interval);
  }, [autoSync, activeGroupCount, currentLocation, syncLocation]);

  return {
    isSyncing,
    lastSyncTime,
    activeGroupCount,
    error,
    syncNow,
    clearError,
  };
};
