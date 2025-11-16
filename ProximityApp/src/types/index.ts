// Core type definitions for the Proximity App

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfilePhoto {
  id: string;
  url: string; // Firebase Storage URL
  thumbnailUrl?: string; // Optimized thumbnail
  caption?: string;
  uploadedAt: Date;
  width?: number;
  height?: number;
}

export interface UserProfile extends User {
  bio?: string;
  groups: string[]; // Group IDs
  privacySettings: PrivacySettings;
  notificationPreferences: NotificationPreferences;
  profilePicture?: string; // Main profile picture URL
  photos: ProfilePhoto[]; // Gallery of additional photos
  photosCount: number; // Total count for display
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  imageURL?: string;
  category?: string;
  createdBy: string;
  createdAt: Date;
  memberCount: number;
  isActive: boolean;
  privacyLevel: 'public' | 'private' | 'invite-only';
  inviteCode?: string; // Unique code for sharing/joining via link
  // Scalability fields
  lastActivity?: Date; // Last message/event/member join
  activeMembers?: number; // Members active in last 7 days
  locationCenter?: {
    latitude: number;
    longitude: number;
  };
  popularityScore?: number; // Calculated score for ranking
  distance?: number; // Calculated client-side for nearby sorting
}

export interface GroupMembership {
  userId: string;
  groupId: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  isBroadcasting: boolean; // Whether user is actively broadcasting location for this group
  isVisible: boolean; // Whether user is visible to other group members
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  inviterId: string; // User who sent the invitation
  inviteeId?: string; // User being invited (if found by email)
  inviteeEmail: string; // Email of person being invited
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
  message?: string; // Optional personal message
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface UserLocation {
  userId: string;
  groupId: string;
  location: Location;
  lastUpdated: Date;
  isActive: boolean; // Whether the user is currently broadcasting
}

export interface ProximityAlert {
  id: string;
  userId: string; // The nearby user
  groupId: string;
  distance: number; // Distance in meters
  timestamp: Date;
  acknowledged: boolean;
  userProfile: {
    displayName: string;
    photoURL?: string;
  };
  groupName: string;
}

export interface PrivacySettings {
  shareLocation: boolean;
  shareProfile: boolean;
  allowDirectMessages: boolean;
  visibleGroups: string[]; // Group IDs where user is visible
  invisibleMode: boolean; // Global invisible mode
  autoStopBroadcastingAfter?: number; // Hours
}

/**
 * Alert style for proximity notifications
 */
export enum AlertStyle {
  SILENT = 'silent',           // No sound or vibration
  VIBRATION = 'vibration',     // Vibration only
  SOUND = 'sound',             // Sound only
  BOTH = 'both',               // Sound and vibration
}

export interface NotificationPreferences {
  enableProximityAlerts: boolean;
  enableGroupInvites: boolean;
  enableDirectMessages: boolean;
  enableGroupAnnouncements: boolean;
  proximityRadius: number; // Meters
  quietHoursStart?: string; // 24h format, e.g., "22:00"
  quietHoursEnd?: string; // 24h format, e.g., "08:00"
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  alertStyle: AlertStyle; // Alert notification style
}

export interface Chat {
  id: string; // Format: "userId1_userId2" (sorted alphabetically)
  participants: [string, string]; // Two user IDs
  participantProfiles: {
    [userId: string]: {
      displayName: string;
      photoURL?: string;
      profilePicture?: string;
    };
  };
  lastMessage?: string;
  lastMessageTimestamp?: Date;
  lastMessageSenderId?: string;
  unreadCount: {
    [userId: string]: number; // Unread count per participant
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  chatId: string; // Reference to parent Chat
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  read: boolean;
  readAt?: Date;
  type: 'text' | 'image' | 'location';
  imageUrl?: string; // For type: 'image'
  location?: Location; // For type: 'location'
  // Sender info for quick display
  senderName?: string;
  senderPhoto?: string;
}

export interface MeetRequest {
  id: string;
  senderId: string;
  receiverId: string;
  groupId: string;
  location?: Location;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

export interface GroupEvent {
  id: string;
  groupId: string;
  createdBy: string;
  title: string;
  description?: string;
  location: Location;
  address?: string;
  startTime: Date;
  endTime?: Date;
  attendees: string[]; // User IDs
  maxAttendees?: number;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Map: undefined;
  Groups: undefined;
  Chats: undefined; // New: Chat list screen
  Notifications: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MapStackParamList = {
  MapView: undefined;
  MemberProfile: { userId: string; groupId: string };
  ChatScreen: { chatId: string; otherUserId: string; otherUserName: string; otherUserPhoto?: string };
};

export type GroupsStackParamList = {
  GroupsList: undefined;
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
};

export type ChatsStackParamList = {
  ChatList: undefined;
  ChatScreen: { chatId: string; otherUserId: string; otherUserName: string; otherUserPhoto?: string };
  MemberProfile: { userId: string };
};

export type ProfileStackParamList = {
  ProfileView: undefined;
  EditProfile: undefined;
  Settings: undefined;
};

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: Error | null;
}

export interface PaginatedData<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

// Geolocation types
export interface ProximityConfig {
  radius: number; // Meters
  checkInterval: number; // Milliseconds
  enableBLE: boolean;
  enableGPS: boolean;
}

export interface GeofenceRegion {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number; // Meters
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
}
