// Application constants

// Proximity detection
export const PROXIMITY_RADIUS = {
  MIN: 50, // 50 meters
  DEFAULT: 100, // 100 meters
  MAX: 1000, // 1 km
  OPTIONS: [50, 100, 200, 500, 1000], // Available options in meters
};

export const LOCATION_UPDATE_INTERVAL = {
  FOREGROUND: 10000, // 10 seconds when app is active
  BACKGROUND: 60000, // 1 minute when app is in background
  STATIONARY: 300000, // 5 minutes when user is stationary
};

export const BLE_PROXIMITY_THRESHOLD = 30; // 30 meters - BLE effective range

// Map configuration
export const MAP_DEFAULTS = {
  LATITUDE_DELTA: 0.01, // Approximately 1.1 km
  LONGITUDE_DELTA: 0.01,
  ZOOM_LEVEL: 15,
  ANIMATION_DURATION: 300, // milliseconds
};

// Notifications
export const NOTIFICATION_GROUPING_WINDOW = 300000; // 5 minutes - group similar notifications
export const NOTIFICATION_QUIET_HOURS_DEFAULT = {
  START: '22:00',
  END: '08:00',
};

// Auto-stop broadcasting
export const AUTO_STOP_BROADCASTING_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '2 hours', value: 2 },
  { label: '4 hours', value: 4 },
  { label: '8 hours', value: 8 },
  { label: 'Never', value: 0 },
];

// Meet request
export const MEET_REQUEST_EXPIRY = 3600000; // 1 hour

// Chat
export const CHAT_MESSAGE_LIMIT = 50;
export const CHAT_TYPING_TIMEOUT = 3000; // 3 seconds

// Groups
export const MAX_GROUPS_PER_USER = 20;
export const GROUP_NAME_MAX_LENGTH = 50;
export const GROUP_DESCRIPTION_MAX_LENGTH = 500;

// User profile
export const USER_BIO_MAX_LENGTH = 300;
export const DISPLAY_NAME_MAX_LENGTH = 50;

// Firebase collections
export const COLLECTIONS = {
  USERS: 'users',
  GROUPS: 'groups',
  GROUP_MEMBERSHIPS: 'groupMemberships',
  GROUP_INVITATIONS: 'groupInvitations',
  USER_LOCATIONS: 'userLocations',
  PROXIMITY_ALERTS: 'proximityAlerts',
  CHAT_MESSAGES: 'chatMessages',
  MEET_REQUESTS: 'meetRequests',
  GROUP_EVENTS: 'groupEvents',
};

// Error messages
export const ERROR_MESSAGES = {
  LOCATION_PERMISSION_DENIED: 'Location permission is required to use this app',
  LOCATION_SERVICE_DISABLED: 'Please enable location services',
  NOTIFICATION_PERMISSION_DENIED: 'Enable notifications to receive proximity alerts',
  BLUETOOTH_PERMISSION_DENIED: 'Bluetooth permission is required for proximity detection',
  NETWORK_ERROR: 'Network error. Please check your connection',
  AUTHENTICATION_ERROR: 'Authentication failed. Please try again',
  GENERIC_ERROR: 'Something went wrong. Please try again',
};

// Success messages
export const SUCCESS_MESSAGES = {
  GROUP_CREATED: 'Group created successfully',
  GROUP_JOINED: 'You have joined the group',
  LOCATION_SHARED: 'Location shared successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  MEET_REQUEST_SENT: 'Meet request sent',
};

// Storage keys
export const STORAGE_KEYS = {
  USER_TOKEN: '@proximity_user_token',
  USER_PROFILE: '@proximity_user_profile',
  ONBOARDING_COMPLETE: '@proximity_onboarding_complete',
  THEME_PREFERENCE: '@proximity_theme',
  LAST_LOCATION: '@proximity_last_location',
};

// Animation durations
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Regex patterns
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s-()]+$/,
  URL: /^https?:\/\/.+/,
};

// Platform-specific
export const PLATFORM_SPECIFIC = {
  IOS_MAPS: 'apple',
  ANDROID_MAPS: 'google',
};
