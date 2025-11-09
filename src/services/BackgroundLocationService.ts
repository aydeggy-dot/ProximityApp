/**
 * Background Location Service
 * Handles location tracking and proximity detection when app is in background
 */

import BackgroundFetch from 'react-native-background-fetch';
import Geolocation from 'react-native-geolocation-service';
import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';
import firestore from '@react-native-firebase/firestore';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateDistance } from '../utils/geolocation';
import { sounds } from '../utils/sounds';
import { haptics } from '../utils/haptics';
import { AlertStyle } from '../types';

const BACKGROUND_TASK_ID = 'com.proximityapp.background-location';
const LOCATION_STORAGE_KEY = 'lastKnownLocation';
const NOTIFIED_USERS_KEY = 'notifiedNearbyUsers';

interface BackgroundLocationConfig {
  userId: string;
  minimumFetchInterval?: number; // Minutes
  stopOnTerminate?: boolean;
  startOnBoot?: boolean;
  enableHeadless?: boolean;
}

/**
 * Request background location permission (Android 10+)
 */
const requestBackgroundPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    if (Platform.Version >= 29) {
      const backgroundGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Background Location Permission',
          message:
            'This app needs access to your location in the background to notify you when group members are nearby.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return backgroundGranted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  } catch (err) {
    console.error('Error requesting background location permission:', err);
    return false;
  }
};

/**
 * Get current location
 */
const getCurrentLocation = (): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      error => {
        console.error('Background location error:', error);
        reject(error);
      },
      {
        accuracy: {
          android: 'high',
          ios: 'best',
        },
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000,
        distanceFilter: 10,
      }
    );
  });
};

/**
 * Update user location in Firestore
 */
const updateLocationInFirestore = async (
  userId: string,
  location: { latitude: number; longitude: number; accuracy: number; timestamp: number }
) => {
  try {
    // Get user's active groups
    const userDoc = await firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || !userData.groups || userData.groups.length === 0) {
      return;
    }

    const activeGroups = userData.groups;

    // Update location for each active group
    const batch = firestore().batch();

    activeGroups.forEach((groupId: string) => {
      const locationRef = firestore()
        .collection('groupLocations')
        .doc(groupId)
        .collection('members')
        .doc(userId);

      batch.set(
        locationRef,
        {
          location: new firestore.GeoPoint(location.latitude, location.longitude),
          accuracy: location.accuracy,
          lastUpdated: firestore.FieldValue.serverTimestamp(),
          isActive: true,
        },
        { merge: true }
      );
    });

    await batch.commit();

    // Store locally for quick access
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch (error) {
    console.error('Error updating location in Firestore:', error);
  }
};

/**
 * Check for nearby users and send notifications
 */
const checkNearbyUsers = async (userId: string, currentLocation: any) => {
  try {
    // Get user preferences
    const userDoc = await firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) return;

    const { notificationPreferences, groups } = userData;

    // Check if proximity alerts are enabled
    if (!notificationPreferences?.enableProximityAlerts) {
      return;
    }

    const proximityRadius = notificationPreferences.proximityRadius || 100;
    const alertStyle = notificationPreferences.alertStyle || AlertStyle.BOTH;

    // Get previously notified users to avoid duplicate notifications
    const notifiedUsersStr = await AsyncStorage.getItem(NOTIFIED_USERS_KEY);
    const notifiedUsers = notifiedUsersStr ? JSON.parse(notifiedUsersStr) : {};

    const nearbyUsers: any[] = [];

    // Check each group for nearby members
    for (const groupId of groups) {
      const groupLocationsSnapshot = await firestore()
        .collection('groupLocations')
        .doc(groupId)
        .collection('members')
        .where('isActive', '==', true)
        .get();

      groupLocationsSnapshot.forEach(doc => {
        const memberData = doc.data();
        const memberId = doc.id;

        if (memberId === userId) return; // Skip self

        const memberLocation = {
          latitude: memberData.location.latitude,
          longitude: memberData.location.longitude,
        };

        const distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          memberLocation.latitude,
          memberLocation.longitude
        );

        // Check if within proximity radius
        if (distance <= proximityRadius) {
          nearbyUsers.push({
            userId: memberId,
            groupId,
            distance,
            memberData,
          });
        }
      });
    }

    // Send notifications for newly nearby users
    for (const nearbyUser of nearbyUsers) {
      const notificationKey = `${nearbyUser.userId}_${nearbyUser.groupId}`;

      // Check if we already notified about this user recently (within 15 minutes)
      const lastNotified = notifiedUsers[notificationKey];
      const now = Date.now();

      if (lastNotified && now - lastNotified < 15 * 60 * 1000) {
        continue; // Skip if notified recently
      }

      // Get user profile for display name
      const nearbyUserDoc = await firestore()
        .collection('users')
        .doc(nearbyUser.userId)
        .get();
      const nearbyUserData = nearbyUserDoc.data();

      // Get group name
      const groupDoc = await firestore().collection('groups').doc(nearbyUser.groupId).get();
      const groupData = groupDoc.data();

      // Send local notification
      await sendProximityNotification({
        userId: nearbyUser.userId,
        displayName: nearbyUserData?.displayName || 'Someone',
        groupName: groupData?.name || 'Unknown Group',
        distance: nearbyUser.distance,
        alertStyle,
      });

      // Mark as notified
      notifiedUsers[notificationKey] = now;
    }

    // Save updated notified users
    await AsyncStorage.setItem(NOTIFIED_USERS_KEY, JSON.stringify(notifiedUsers));

    // Clean up old notifications (older than 1 hour)
    const cleanedNotifiedUsers: any = {};
    Object.keys(notifiedUsers).forEach(key => {
      if (now - notifiedUsers[key] < 60 * 60 * 1000) {
        cleanedNotifiedUsers[key] = notifiedUsers[key];
      }
    });
    await AsyncStorage.setItem(NOTIFIED_USERS_KEY, JSON.stringify(cleanedNotifiedUsers));
  } catch (error) {
    console.error('Error checking nearby users:', error);
  }
};

/**
 * Send proximity notification using Notifee
 */
const sendProximityNotification = async ({
  userId,
  displayName,
  groupName,
  distance,
  alertStyle,
}: {
  userId: string;
  displayName: string;
  groupName: string;
  distance: number;
  alertStyle: AlertStyle;
}) => {
  try {
    // Create notification channel (Android)
    const channelId = await notifee.createChannel({
      id: 'proximity-alerts',
      name: 'Proximity Alerts',
      importance: AndroidImportance.HIGH,
      sound: alertStyle === AlertStyle.SOUND || alertStyle === AlertStyle.BOTH ? 'default' : undefined,
      vibration: alertStyle === AlertStyle.VIBRATION || alertStyle === AlertStyle.BOTH,
    });

    // Display notification
    await notifee.displayNotification({
      title: `${displayName} is nearby!`,
      body: `${displayName} is ${Math.round(distance)}m away in ${groupName}`,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        sound: alertStyle === AlertStyle.SOUND || alertStyle === AlertStyle.BOTH ? 'default' : undefined,
        vibrationPattern: alertStyle === AlertStyle.VIBRATION || alertStyle === AlertStyle.BOTH
          ? [300, 500, 300]
          : undefined,
        style: {
          type: AndroidStyle.BIGTEXT,
          text: `${displayName} is ${Math.round(distance)}m away in ${groupName}. Open the app to see their location on the map.`,
        },
      },
      ios: {
        sound: alertStyle === AlertStyle.SOUND || alertStyle === AlertStyle.BOTH ? 'default' : undefined,
        interruptionLevel: 'timeSensitive',
      },
      data: {
        userId,
        groupName,
        distance: distance.toString(),
      },
    });

    console.log(`Background notification sent for ${displayName} at ${distance}m`);
  } catch (error) {
    console.error('Error sending proximity notification:', error);
  }
};

/**
 * Background fetch task handler
 */
const backgroundFetchTask = async (taskId: string) => {
  console.log('[BackgroundFetch] Task started:', taskId);

  try {
    // Get current user ID from AsyncStorage
    const userIdStr = await AsyncStorage.getItem('userId');
    if (!userIdStr) {
      console.log('[BackgroundFetch] No user ID found');
      BackgroundFetch.finish(taskId);
      return;
    }

    const userId = userIdStr;

    // Get current location
    const location = await getCurrentLocation();
    console.log('[BackgroundFetch] Got location:', location);

    // Update location in Firestore
    await updateLocationInFirestore(userId, location);

    // Check for nearby users
    await checkNearbyUsers(userId, location);

    console.log('[BackgroundFetch] Task completed successfully');
  } catch (error) {
    console.error('[BackgroundFetch] Task error:', error);
  }

  // Required: Signal completion
  BackgroundFetch.finish(taskId);
};

/**
 * Configure and start background location tracking
 */
export const configureBackgroundLocation = async (
  config: BackgroundLocationConfig
): Promise<boolean> => {
  try {
    // Request background permission
    const hasPermission = await requestBackgroundPermission();
    if (!hasPermission) {
      console.log('Background location permission denied');
      return false;
    }

    // Store user ID for background tasks
    await AsyncStorage.setItem('userId', config.userId);

    // Configure BackgroundFetch
    const status = await BackgroundFetch.configure(
      {
        minimumFetchInterval: config.minimumFetchInterval || 15, // Default: 15 minutes
        stopOnTerminate: config.stopOnTerminate !== undefined ? config.stopOnTerminate : false,
        startOnBoot: config.startOnBoot !== undefined ? config.startOnBoot : true,
        enableHeadless: config.enableHeadless !== undefined ? config.enableHeadless : true,
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
        requiresCharging: false,
        requiresDeviceIdle: false,
        requiresBatteryNotLow: false,
        requiresStorageNotLow: false,
      },
      backgroundFetchTask,
      (taskId: string) => {
        // Timeout callback
        console.log('[BackgroundFetch] TIMEOUT:', taskId);
        BackgroundFetch.finish(taskId);
      }
    );

    console.log('[BackgroundFetch] Configure status:', status);

    // Schedule the task
    await BackgroundFetch.scheduleTask({
      taskId: BACKGROUND_TASK_ID,
      delay: 0, // Start immediately
      periodic: true,
      forceAlarmManager: Platform.OS === 'android',
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('[BackgroundFetch] Task scheduled');

    return true;
  } catch (error) {
    console.error('Error configuring background location:', error);
    return false;
  }
};

/**
 * Stop background location tracking
 */
export const stopBackgroundLocation = async (): Promise<void> => {
  try {
    await BackgroundFetch.stop(BACKGROUND_TASK_ID);
    console.log('[BackgroundFetch] Stopped');
  } catch (error) {
    console.error('Error stopping background location:', error);
  }
};

/**
 * Get background fetch status
 */
export const getBackgroundLocationStatus = async (): Promise<number> => {
  try {
    return await BackgroundFetch.status();
  } catch (error) {
    console.error('Error getting background fetch status:', error);
    return BackgroundFetch.STATUS_DENIED;
  }
};

// Headless task for when app is terminated (Android only)
if (Platform.OS === 'android') {
  BackgroundFetch.registerHeadlessTask(backgroundFetchTask);
}

export default {
  configure: configureBackgroundLocation,
  stop: stopBackgroundLocation,
  getStatus: getBackgroundLocationStatus,
};
