/**
 * useBackgroundLocation Hook
 * Manages background location tracking lifecycle
 */

import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import BackgroundLocationService from '../services/BackgroundLocationService';
import { useAuth } from '../contexts/AuthContext';
import BackgroundFetch from 'react-native-background-fetch';

export const useBackgroundLocation = () => {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [status, setStatus] = useState<number>(BackgroundFetch.STATUS_DENIED);

  /**
   * Start background location tracking
   */
  const startBackgroundTracking = useCallback(async () => {
    if (!user) {
      console.log('Cannot start tracking: No user logged in');
      return false;
    }

    try {
      const success = await BackgroundLocationService.configure({
        userId: user.uid,
        minimumFetchInterval: 15, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true,
      });

      if (success) {
        setIsTracking(true);
        console.log('Background location tracking started');
        return true;
      } else {
        console.log('Failed to start background location tracking');
        return false;
      }
    } catch (error) {
      console.error('Error starting background tracking:', error);
      return false;
    }
  }, [user]);

  /**
   * Stop background location tracking
   */
  const stopBackgroundTracking = useCallback(async () => {
    try {
      await BackgroundLocationService.stop();
      setIsTracking(false);
      console.log('Background location tracking stopped');
    } catch (error) {
      console.error('Error stopping background tracking:', error);
    }
  }, []);

  /**
   * Get background tracking status
   */
  const getTrackingStatus = useCallback(async () => {
    try {
      const currentStatus = await BackgroundLocationService.getStatus();
      setStatus(currentStatus);
      return currentStatus;
    } catch (error) {
      console.error('Error getting tracking status:', error);
      return BackgroundFetch.STATUS_DENIED;
    }
  }, []);

  /**
   * Check if background tracking is available
   */
  const isBackgroundTrackingAvailable = useCallback(() => {
    return (
      status === BackgroundFetch.STATUS_AVAILABLE ||
      status === BackgroundFetch.STATUS_RESTRICTED
    );
  }, [status]);

  /**
   * Get status description
   */
  const getStatusDescription = useCallback(() => {
    switch (status) {
      case BackgroundFetch.STATUS_AVAILABLE:
        return 'Background tracking is available';
      case BackgroundFetch.STATUS_DENIED:
        return 'Background tracking permission denied';
      case BackgroundFetch.STATUS_RESTRICTED:
        return 'Background tracking is restricted';
      default:
        return 'Unknown status';
    }
  }, [status]);

  // Initialize status on mount
  useEffect(() => {
    getTrackingStatus();
  }, [getTrackingStatus]);

  // Auto-start when user logs in and stop when they log out
  useEffect(() => {
    if (user && !isTracking) {
      // Automatically start tracking when user is logged in
      startBackgroundTracking();
    } else if (!user && isTracking) {
      // Stop tracking when user logs out
      stopBackgroundTracking();
    }
  }, [user, isTracking, startBackgroundTracking, stopBackgroundTracking]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && user && isTracking) {
        console.log('App moved to background, background tracking active');
      } else if (nextAppState === 'active' && user) {
        console.log('App moved to foreground');
        // Refresh status
        getTrackingStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [user, isTracking, getTrackingStatus]);

  return {
    isTracking,
    status,
    startBackgroundTracking,
    stopBackgroundTracking,
    getTrackingStatus,
    isBackgroundTrackingAvailable,
    getStatusDescription,
  };
};

export default useBackgroundLocation;
