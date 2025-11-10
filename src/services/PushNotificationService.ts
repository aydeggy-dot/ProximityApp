/**
 * Push Notification Service
 * Handles Firebase Cloud Messaging (FCM) setup and remote notifications
 */

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';

/**
 * Request notification permission (iOS)
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification permission granted');
    } else {
      console.log('Notification permission denied');
    }

    return enabled;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get FCM token and save to Firestore
 */
export const registerFCMToken = async (userId: string): Promise<string | null> => {
  try {
    // Get FCM token
    const token = await messaging().getToken();
    console.log('FCM Token:', token);

    // Save token to Firestore for server-side push
    await firestore().collection('users').doc(userId).set({
      fcmTokens: firestore.FieldValue.arrayUnion({
        token,
        platform: Platform.OS,
        addedAt: Date.now(),
      }),
      lastTokenUpdate: firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return token;
  } catch (error) {
    console.error('Error registering FCM token:', error);
    return null;
  }
};

/**
 * Handle foreground messages
 */
export const onMessageReceived = async (
  message: FirebaseMessagingTypes.RemoteMessage
): Promise<void> => {
  console.log('FCM message received:', message);

  try {
    // Create notification channel
    const channelId = await notifee.createChannel({
      id: 'proximity-alerts',
      name: 'Proximity Alerts',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    // Display notification
    await notifee.displayNotification({
      title: message.notification?.title || 'Proximity Alert',
      body: message.notification?.body || 'Someone nearby!',
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        sound: 'default',
        vibrationPattern: [300, 500, 300],
      },
      ios: {
        sound: 'default',
        interruptionLevel: 'timeSensitive',
      },
      data: message.data,
    });
  } catch (error) {
    console.error('Error displaying notification:', error);
  }
};

/**
 * Handle background messages (headless)
 */
export const handleBackgroundMessage = async (
  message: FirebaseMessagingTypes.RemoteMessage
): Promise<void> => {
  console.log('Background FCM message received:', message);

  try {
    // Create notification channel
    const channelId = await notifee.createChannel({
      id: 'proximity-alerts',
      name: 'Proximity Alerts',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    // Display notification
    await notifee.displayNotification({
      title: message.notification?.title || 'Proximity Alert',
      body: message.notification?.body || 'Someone nearby!',
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        sound: 'default',
      },
      ios: {
        sound: 'default',
      },
      data: message.data,
    });
  } catch (error) {
    console.error('Error handling background message:', error);
  }
};

/**
 * Initialize push notification service
 */
export const initializePushNotifications = async (userId: string): Promise<void> => {
  try {
    // Request permission (iOS)
    if (Platform.OS === 'ios') {
      await requestNotificationPermission();
    }

    // Register FCM token
    await registerFCMToken(userId);

    // Listen for token refresh
    messaging().onTokenRefresh(async token => {
      console.log('FCM token refreshed:', token);
      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          fcmTokens: firestore.FieldValue.arrayUnion({
            token,
            platform: Platform.OS,
            addedAt: firestore.FieldValue.serverTimestamp(),
          }),
        });
    });

    // Handle foreground messages
    messaging().onMessage(onMessageReceived);

    // Handle notification opened app (from quit/background state)
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app:', remoteMessage);
      // TODO: Navigate to appropriate screen based on notification data
    });

    // Check if app was opened from a notification
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      console.log('App opened from notification:', initialNotification);
      // TODO: Navigate to appropriate screen based on notification data
    }

    // Handle notification interactions (foreground/background)
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('Notification pressed:', detail);
        // TODO: Navigate to appropriate screen
      }
    });

    // Handle background notification interactions
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('Background notification pressed:', detail);
        // TODO: Navigate to appropriate screen
      }
    });

    console.log('Push notifications initialized');
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
};

/**
 * Unregister FCM token on logout
 */
export const unregisterFCMToken = async (userId: string): Promise<void> => {
  try {
    const token = await messaging().getToken();

    await firestore()
      .collection('users')
      .doc(userId)
      .update({
        fcmTokens: firestore.FieldValue.arrayRemove({
          token,
          platform: Platform.OS,
        }),
      });

    // Delete token from FCM
    await messaging().deleteToken();

    console.log('FCM token unregistered');
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
  }
};

// Set background message handler (must be at top level)
messaging().setBackgroundMessageHandler(handleBackgroundMessage);

export default {
  initialize: initializePushNotifications,
  unregister: unregisterFCMToken,
  requestPermission: requestNotificationPermission,
  registerToken: registerFCMToken,
};
