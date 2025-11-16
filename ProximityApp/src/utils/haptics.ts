import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Platform } from 'react-native';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const haptics = {
  /**
   * Light impact - for simple UI interactions like taps
   */
  light: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('impactLight', options);
    } else {
      ReactNativeHapticFeedback.trigger('impactLight', options);
    }
  },

  /**
   * Medium impact - for toggles, switches, selections
   */
  medium: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('impactMedium', options);
    } else {
      ReactNativeHapticFeedback.trigger('impactMedium', options);
    }
  },

  /**
   * Heavy impact - for important actions, errors
   */
  heavy: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('impactHeavy', options);
    } else {
      ReactNativeHapticFeedback.trigger('impactHeavy', options);
    }
  },

  /**
   * Success notification
   */
  success: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('notificationSuccess', options);
    } else {
      ReactNativeHapticFeedback.trigger('impactMedium', options);
    }
  },

  /**
   * Warning notification
   */
  warning: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('notificationWarning', options);
    } else {
      ReactNativeHapticFeedback.trigger('impactMedium', options);
    }
  },

  /**
   * Error notification
   */
  error: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('notificationError', options);
    } else {
      ReactNativeHapticFeedback.trigger('impactHeavy', options);
    }
  },

  /**
   * Selection feedback - for picker wheels, segmented controls
   */
  selection: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('selection', options);
    } else {
      ReactNativeHapticFeedback.trigger('impactLight', options);
    }
  },

  /**
   * Rigid impact - for dragging elements
   */
  rigid: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('rigid', options);
    } else {
      ReactNativeHapticFeedback.trigger('impactMedium', options);
    }
  },

  /**
   * Soft impact - for gentle interactions
   */
  soft: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('soft', options);
    } else {
      ReactNativeHapticFeedback.trigger('impactLight', options);
    }
  },
};
