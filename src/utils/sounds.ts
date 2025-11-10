/**
 * Sound Alert Utility
 *
 * Provides sound feedback for proximity alerts using notifee.
 * Compatible with React Native New Architecture.
 */

import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';

/**
 * Sound types for different alert scenarios
 */
export enum SoundType {
  NOTIFICATION = 'notification',
  ALERT = 'alert',
  WARNING = 'warning',
}

/**
 * Play a sound using notifee
 * This approach is compatible with React Native New Architecture
 */
const playSound = async (soundType: SoundType, volume: number = 1.0): Promise<void> => {
  try {
    // Create a channel ID for this sound type
    const channelId = `sound-${soundType}`;

    // Ensure the channel exists
    await notifee.createChannel({
      id: channelId,
      name: `${soundType} sounds`,
      importance: AndroidImportance.HIGH,
      sound: 'default', // Use default notification sound
    });

    // Display a notification with sound
    // The notification is immediately cancelled so only the sound plays
    const notificationId = await notifee.displayNotification({
      title: '', // Empty title
      body: '', // Empty body
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        sound: 'default',
        // Make notification invisible by using minimal UI
        smallIcon: 'ic_launcher',
        color: '#00000000', // Transparent
        showTimestamp: false,
        autoCancel: true,
      },
      ios: {
        sound: 'default',
      },
    });

    // Immediately cancel the notification so only sound plays
    setTimeout(() => {
      notifee.cancelNotification(notificationId);
    }, 100);
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

/**
 * Exported sound utility
 */
export const sounds = {
  /**
   * Play notification sound - for standard proximity alerts
   */
  notification: async (volume: number = 1.0) => {
    await playSound(SoundType.NOTIFICATION, volume);
  },

  /**
   * Play alert sound - for important proximity alerts
   */
  alert: async (volume: number = 1.0) => {
    await playSound(SoundType.ALERT, volume);
  },

  /**
   * Play warning sound - for critical proximity alerts (very close)
   */
  warning: async (volume: number = 1.0) => {
    await playSound(SoundType.WARNING, volume);
  },

  /**
   * Preload all sounds for better performance
   * (No-op in this implementation as notifee handles sound on-demand)
   */
  preloadAll: async () => {
    // Create all channels upfront
    await Promise.all([
      notifee.createChannel({
        id: 'sound-notification',
        name: 'Notification sounds',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      }),
      notifee.createChannel({
        id: 'sound-alert',
        name: 'Alert sounds',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      }),
      notifee.createChannel({
        id: 'sound-warning',
        name: 'Warning sounds',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      }),
    ]);
  },

  /**
   * Release all sounds to free memory
   * (No-op in this implementation as notifee manages resources automatically)
   */
  releaseAll: () => {
    // Nothing to release - notifee manages its own resources
  },
};
