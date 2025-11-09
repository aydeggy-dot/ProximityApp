/**
 * Sound Alert Utility
 *
 * Provides sound feedback for proximity alerts using the device's notification sounds.
 * Works with react-native-sound to play system notification sounds.
 */

import Sound from 'react-native-sound';
import { Platform } from 'react-native';

// Enable playback in silence mode (iOS)
Sound.setCategory('Playback');

/**
 * Sound types for different alert scenarios
 */
export enum SoundType {
  NOTIFICATION = 'notification',
  ALERT = 'alert',
  WARNING = 'warning',
}

// Cache for preloaded sounds
const soundCache: { [key: string]: Sound | null } = {};

/**
 * Preload a system sound
 */
const preloadSound = (soundType: SoundType): Promise<Sound | null> => {
  return new Promise((resolve) => {
    // Check cache first
    if (soundCache[soundType]) {
      resolve(soundCache[soundType]);
      return;
    }

    try {
      let sound: Sound;

      if (Platform.OS === 'android') {
        // Use Android system notification sounds
        // These are built-in and don't require bundling
        const soundMap: { [key in SoundType]: string } = {
          [SoundType.NOTIFICATION]: 'notification.mp3',
          [SoundType.ALERT]: 'alert.mp3',
          [SoundType.WARNING]: 'warning.mp3',
        };

        // Android: Try to use bundled sound from android/app/src/main/res/raw/
        // If not found, fallback to system default
        sound = new Sound(soundMap[soundType], Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.log('Failed to load bundled sound, using system default:', error);
            // Fallback to system notification sound
            sound = new Sound('content://settings/system/notification_sound', '', (error) => {
              if (error) {
                console.error('Failed to load system sound:', error);
                soundCache[soundType] = null;
                resolve(null);
              } else {
                soundCache[soundType] = sound;
                resolve(sound);
              }
            });
          } else {
            soundCache[soundType] = sound;
            resolve(sound);
          }
        });
      } else {
        // iOS: Use system sounds
        const soundMap: { [key in SoundType]: string } = {
          [SoundType.NOTIFICATION]: '1315', // SMS received (Tri-tone)
          [SoundType.ALERT]: '1005',        // New mail
          [SoundType.WARNING]: '1006',      // Sent mail
        };

        sound = new Sound(soundMap[soundType], Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.error('Failed to load iOS system sound:', error);
            soundCache[soundType] = null;
            resolve(null);
          } else {
            soundCache[soundType] = sound;
            resolve(sound);
          }
        });
      }
    } catch (error) {
      console.error('Error preloading sound:', error);
      resolve(null);
    }
  });
};

/**
 * Play a sound
 */
const playSound = async (soundType: SoundType, volume: number = 1.0): Promise<void> => {
  try {
    // Get or load the sound
    let sound = soundCache[soundType];

    if (!sound) {
      sound = await preloadSound(soundType);
    }

    if (!sound) {
      console.warn(`Sound ${soundType} not available`);
      return;
    }

    // Set volume (0.0 to 1.0)
    sound.setVolume(Math.max(0, Math.min(1, volume)));

    // Play the sound
    sound.play((success) => {
      if (!success) {
        console.error('Failed to play sound');
        // Reset the sound for next play
        sound?.reset();
      }
    });
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

/**
 * Release all cached sounds to free memory
 */
const releaseAllSounds = (): void => {
  Object.keys(soundCache).forEach((key) => {
    const sound = soundCache[key];
    if (sound) {
      sound.release();
      soundCache[key] = null;
    }
  });
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
   */
  preloadAll: async () => {
    await Promise.all([
      preloadSound(SoundType.NOTIFICATION),
      preloadSound(SoundType.ALERT),
      preloadSound(SoundType.WARNING),
    ]);
  },

  /**
   * Release all sounds to free memory
   */
  releaseAll: () => {
    releaseAllSounds();
  },
};
