// Firestore database service

import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../../constants';
import {
  User,
  UserProfile,
  Group,
  GroupMembership,
  GroupInvitation,
  UserLocation,
  ProximityAlert,
  ChatMessage,
  MeetRequest,
  GroupEvent,
} from '../../types';

// Helper function to convert Firestore Timestamps to Dates
const convertTimestamps = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }

  if (data?.toDate && typeof data.toDate === 'function') {
    return data.toDate();
  }

  if (Array.isArray(data)) {
    return data.map(convertTimestamps);
  }

  if (typeof data === 'object') {
    const converted: any = {};
    Object.keys(data).forEach(key => {
      converted[key] = convertTimestamps(data[key]);
    });
    return converted;
  }

  return data;
};

// Generic Firestore operations

/**
 * Get a document by ID
 */
export const getDocument = async <T>(
  collection: string,
  docId: string
): Promise<T | null> => {
  try {
    const doc = await firestore().collection(collection).doc(docId).get();
    if (!doc.exists) {
      return null;
    }
    const data = convertTimestamps(doc.data());
    return { id: doc.id, ...data } as T;
  } catch (error) {
    console.error(`Error getting document from ${collection}:`, error);
    throw error;
  }
};

/**
 * Create or update a document
 */
export const setDocument = async <T>(
  collection: string,
  docId: string,
  data: Partial<T>,
  merge: boolean = true
): Promise<void> => {
  try {
    await firestore().collection(collection).doc(docId).set(data, { merge });
  } catch (error) {
    console.error(`Error setting document in ${collection}:`, error);
    throw error;
  }
};

/**
 * Update a document
 */
export const updateDocument = async <T>(
  collection: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  try {
    await firestore().collection(collection).doc(docId).update(data);
  } catch (error) {
    console.error(`Error updating document in ${collection}:`, error);
    throw error;
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (
  collection: string,
  docId: string
): Promise<void> => {
  try {
    await firestore().collection(collection).doc(docId).delete();
  } catch (error) {
    console.error(`Error deleting document from ${collection}:`, error);
    throw error;
  }
};

/**
 * Query documents with conditions
 */
export const queryDocuments = async <T>(
  collection: string,
  conditions: Array<{ field: string; operator: FirebaseFirestoreTypes.WhereFilterOp; value: any }>
): Promise<T[]> => {
  try {
    let query: FirebaseFirestoreTypes.Query = firestore().collection(collection);

    conditions.forEach(({ field, operator, value }) => {
      query = query.where(field, operator, value);
    });

    const snapshot = await query.get();
    return snapshot.docs.map(doc => {
      const data = convertTimestamps(doc.data());
      return { id: doc.id, ...data } as T;
    });
  } catch (error) {
    console.error(`Error querying documents from ${collection}:`, error);
    throw error;
  }
};

// User Profile operations

export const createUserProfile = async (
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> => {
  const profileData = {
    ...profile,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
  await setDocument(COLLECTIONS.USERS, userId, profileData);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  return getDocument<UserProfile>(COLLECTIONS.USERS, userId);
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  const updateData = {
    ...updates,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
  await updateDocument(COLLECTIONS.USERS, userId, updateData);
};

// Group operations

export const createGroup = async (group: Omit<Group, 'id'>): Promise<string> => {
  try {
    const groupData = {
      ...group,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await firestore().collection(COLLECTIONS.GROUPS).add(groupData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

export const getGroup = async (groupId: string): Promise<Group | null> => {
  return getDocument<Group>(COLLECTIONS.GROUPS, groupId);
};

export const getUserGroups = async (userId: string): Promise<Group[]> => {
  try {
    console.log('=== GET USER GROUPS DEBUG ===');
    console.log('Fetching groups for user:', userId);

    // Get user's group memberships
    const memberships = await queryDocuments<GroupMembership>(
      COLLECTIONS.GROUP_MEMBERSHIPS,
      [{ field: 'userId', operator: '==', value: userId }]
    );

    console.log('Found memberships:', memberships.length);
    console.log('Membership details:', JSON.stringify(memberships, null, 2));

    // Get group details for each membership
    const groupPromises = memberships.map(membership =>
      getGroup(membership.groupId)
    );
    const groups = await Promise.all(groupPromises);
    const filteredGroups = groups.filter(g => g !== null) as Group[];

    console.log('Found groups:', filteredGroups.length);
    console.log('Group IDs:', filteredGroups.map(g => g.id));

    return filteredGroups;
  } catch (error) {
    console.error('Error getting user groups:', error);
    throw error;
  }
};

export const getGroupMembers = async (groupId: string): Promise<Array<GroupMembership & { userProfile?: UserProfile }>> => {
  try {
    // Get all memberships for this group
    const memberships = await queryDocuments<GroupMembership>(
      COLLECTIONS.GROUP_MEMBERSHIPS,
      [{ field: 'groupId', operator: '==', value: groupId }]
    );

    // Fetch user profiles for each member
    const memberPromises = memberships.map(async (membership) => {
      const userProfile = await getUserProfile(membership.userId);
      return {
        ...membership,
        userProfile: userProfile || undefined,
      };
    });

    const members = await Promise.all(memberPromises);
    return members;
  } catch (error) {
    console.error('Error getting group members:', error);
    throw error;
  }
};

/**
 * Get all group memberships for a specific user
 * @param userId - ID of the user
 * @returns Array of group memberships for the user
 */
export const getGroupMemberships = async (userId: string): Promise<GroupMembership[]> => {
  try {
    const memberships = await queryDocuments<GroupMembership>(
      COLLECTIONS.GROUP_MEMBERSHIPS,
      [{ field: 'userId', operator: '==', value: userId }]
    );
    return memberships;
  } catch (error) {
    console.error('Error getting group memberships:', error);
    throw error;
  }
};

// Group Membership operations

export const addGroupMember = async (
  userId: string,
  groupId: string,
  role: 'admin' | 'moderator' | 'member' = 'member'
): Promise<void> => {
  console.log('=== ADD GROUP MEMBER DEBUG ===');
  console.log('Adding member to group:', { userId, groupId, role });

  const membershipData: Partial<GroupMembership> = {
    userId,
    groupId,
    role,
    joinedAt: firestore.FieldValue.serverTimestamp() as any,
    isBroadcasting: false,
    isVisible: true,
  };

  const membershipId = `${userId}_${groupId}`;
  console.log('Membership ID:', membershipId);
  console.log('Membership data:', JSON.stringify(membershipData, null, 2));

  await setDocument(COLLECTIONS.GROUP_MEMBERSHIPS, membershipId, membershipData);
  console.log('Membership document created successfully');

  // Increment member count
  await firestore()
    .collection(COLLECTIONS.GROUPS)
    .doc(groupId)
    .update({
      memberCount: firestore.FieldValue.increment(1),
    });
  console.log('Member count incremented successfully');
};

export const removeGroupMember = async (
  userId: string,
  groupId: string
): Promise<void> => {
  const membershipId = `${userId}_${groupId}`;
  await deleteDocument(COLLECTIONS.GROUP_MEMBERSHIPS, membershipId);

  // Decrement member count
  await firestore()
    .collection(COLLECTIONS.GROUPS)
    .doc(groupId)
    .update({
      memberCount: firestore.FieldValue.increment(-1),
    });
};

export const updateGroupMembership = async (
  userId: string,
  groupId: string,
  updates: Partial<GroupMembership>
): Promise<void> => {
  const membershipId = `${userId}_${groupId}`;
  // Use set with merge instead of update to handle case where document doesn't exist yet
  await setDocument(COLLECTIONS.GROUP_MEMBERSHIPS, membershipId, updates, true);
};

export const isUserMemberOfGroup = async (
  userId: string,
  groupId: string
): Promise<boolean> => {
  try {
    const membershipId = `${userId}_${groupId}`;
    const membership = await getDocument<GroupMembership>(
      COLLECTIONS.GROUP_MEMBERSHIPS,
      membershipId
    );
    return membership !== null;
  } catch (error) {
    console.error('Error checking group membership:', error);
    return false;
  }
};

export const searchGroups = async (searchQuery: string): Promise<Group[]> => {
  try {
    // Firestore doesn't support full-text search, so we'll get public/invite-only groups
    // and filter client-side for now
    const snapshot = await firestore()
      .collection(COLLECTIONS.GROUPS)
      .where('isActive', '==', true)
      .where('privacyLevel', 'in', ['public', 'invite-only'])
      .get();

    const groups = snapshot.docs.map(doc => {
      const data = convertTimestamps(doc.data());
      return { id: doc.id, ...data } as Group;
    });

    if (!searchQuery.trim()) {
      return groups;
    }

    // Filter by name or description containing search query (case-insensitive)
    const query = searchQuery.toLowerCase();
    return groups.filter(group =>
      group.name.toLowerCase().includes(query) ||
      (group.description && group.description.toLowerCase().includes(query))
    );
  } catch (error) {
    console.error('Error searching groups:', error);
    throw error;
  }
};

export const getPublicGroups = async (): Promise<Group[]> => {
  try {
    return await queryDocuments<Group>(COLLECTIONS.GROUPS, [
      { field: 'privacyLevel', operator: '==', value: 'public' },
      { field: 'isActive', operator: '==', value: true },
    ]);
  } catch (error) {
    console.error('Error getting public groups:', error);
    throw error;
  }
};

export const updateGroup = async (
  groupId: string,
  updates: Partial<Omit<Group, 'id'>>
): Promise<void> => {
  try {
    await updateDocument(COLLECTIONS.GROUPS, groupId, updates);
  } catch (error) {
    console.error('Error updating group:', error);
    throw error;
  }
};

export const deleteGroup = async (groupId: string): Promise<void> => {
  try {
    // Delete all memberships first
    const memberships = await queryDocuments<GroupMembership>(
      COLLECTIONS.GROUP_MEMBERSHIPS,
      [{ field: 'groupId', operator: '==', value: groupId }]
    );

    // Delete all membership documents
    await Promise.all(
      memberships.map(membership =>
        deleteDocument(COLLECTIONS.GROUP_MEMBERSHIPS, membership.id)
      )
    );

    // Delete all pending invitations for this group
    const invitations = await queryDocuments<GroupInvitation>(
      COLLECTIONS.GROUP_INVITATIONS,
      [{ field: 'groupId', operator: '==', value: groupId }]
    );

    await Promise.all(
      invitations.map(invitation =>
        deleteDocument(COLLECTIONS.GROUP_INVITATIONS, invitation.id)
      )
    );

    // Delete the group
    await deleteDocument(COLLECTIONS.GROUPS, groupId);
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};

// Group Invite Code operations

export const generateGroupInviteCode = async (groupId: string): Promise<string> => {
  try {
    // Generate a random 8-character code
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking characters
    let inviteCode = '';
    for (let i = 0; i < 8; i++) {
      inviteCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists
    const existingGroups = await queryDocuments<Group>(
      COLLECTIONS.GROUPS,
      [{ field: 'inviteCode', operator: '==', value: inviteCode }]
    );

    // If code exists, recursively generate a new one
    if (existingGroups.length > 0) {
      return generateGroupInviteCode(groupId);
    }

    // Update group with invite code
    await updateDocument(COLLECTIONS.GROUPS, groupId, { inviteCode });

    return inviteCode;
  } catch (error) {
    console.error('Error generating group invite code:', error);
    throw error;
  }
};

export const getGroupByInviteCode = async (inviteCode: string): Promise<Group | null> => {
  try {
    const groups = await queryDocuments<Group>(
      COLLECTIONS.GROUPS,
      [{ field: 'inviteCode', operator: '==', value: inviteCode.toUpperCase() }]
    );

    if (groups.length === 0) {
      return null;
    }

    return groups[0];
  } catch (error) {
    console.error('Error getting group by invite code:', error);
    throw error;
  }
};

export const joinGroupWithInviteCode = async (
  userId: string,
  inviteCode: string
): Promise<Group | null> => {
  try {
    const group = await getGroupByInviteCode(inviteCode);

    if (!group) {
      throw new Error('Invalid invite code');
    }

    if (!group.isActive) {
      throw new Error('This group is no longer active');
    }

    // Check if user is already a member
    const isMember = await isUserMemberOfGroup(userId, group.id);
    if (isMember) {
      throw new Error('You are already a member of this group');
    }

    // Add user to group
    await addGroupMember(userId, group.id, 'member');

    return group;
  } catch (error) {
    console.error('Error joining group with invite code:', error);
    throw error;
  }
};

// Group Invitation operations

export const createGroupInvitation = async (
  groupId: string,
  inviterId: string,
  inviteeEmail: string,
  message?: string
): Promise<string> => {
  try {
    // Check if invitation already exists and is pending
    const existingInvitations = await queryDocuments<GroupInvitation>(
      COLLECTIONS.GROUP_INVITATIONS,
      [
        { field: 'groupId', operator: '==', value: groupId },
        { field: 'inviteeEmail', operator: '==', value: inviteeEmail },
        { field: 'status', operator: '==', value: 'pending' },
      ]
    );

    if (existingInvitations.length > 0) {
      throw new Error('An invitation to this email already exists for this group');
    }

    // Try to find user by email
    const users = await queryDocuments<UserProfile>(
      COLLECTIONS.USERS,
      [{ field: 'email', operator: '==', value: inviteeEmail }]
    );

    const invitationData: Omit<GroupInvitation, 'id'> = {
      groupId,
      inviterId,
      inviteeEmail,
      inviteeId: users.length > 0 ? users[0].id : undefined,
      status: 'pending',
      createdAt: firestore.FieldValue.serverTimestamp() as any,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) as any, // 7 days from now
      message,
    };

    const docRef = await firestore().collection(COLLECTIONS.GROUP_INVITATIONS).add(invitationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating group invitation:', error);
    throw error;
  }
};

export const getGroupInvitations = async (
  groupId: string,
  status?: GroupInvitation['status']
): Promise<Array<GroupInvitation & { inviterProfile?: UserProfile; groupDetails?: Group }>> => {
  try {
    const conditions: Array<{ field: string; operator: FirebaseFirestoreTypes.WhereFilterOp; value: any }> = [
      { field: 'groupId', operator: '==', value: groupId },
    ];

    if (status) {
      conditions.push({ field: 'status', operator: '==', value: status });
    }

    const invitations = await queryDocuments<GroupInvitation>(
      COLLECTIONS.GROUP_INVITATIONS,
      conditions
    );

    // Fetch inviter profiles and group details
    const enrichedInvitations = await Promise.all(
      invitations.map(async invitation => {
        const inviterProfile = await getUserProfile(invitation.inviterId);
        const groupDetails = await getGroup(invitation.groupId);
        return {
          ...invitation,
          inviterProfile: inviterProfile || undefined,
          groupDetails: groupDetails || undefined,
        };
      })
    );

    return enrichedInvitations;
  } catch (error) {
    console.error('Error getting group invitations:', error);
    throw error;
  }
};

export const getUserInvitations = async (
  userId: string,
  status?: GroupInvitation['status']
): Promise<Array<GroupInvitation & { inviterProfile?: UserProfile; groupDetails?: Group }>> => {
  try {
    // Get user's email
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return [];
    }

    const conditions: Array<{ field: string; operator: FirebaseFirestoreTypes.WhereFilterOp; value: any }> = [
      { field: 'inviteeEmail', operator: '==', value: userProfile.email },
    ];

    if (status) {
      conditions.push({ field: 'status', operator: '==', value: status });
    }

    const invitations = await queryDocuments<GroupInvitation>(
      COLLECTIONS.GROUP_INVITATIONS,
      conditions
    );

    // Fetch inviter profiles and group details
    const enrichedInvitations = await Promise.all(
      invitations.map(async invitation => {
        const inviterProfile = await getUserProfile(invitation.inviterId);
        const groupDetails = await getGroup(invitation.groupId);
        return {
          ...invitation,
          inviterProfile: inviterProfile || undefined,
          groupDetails: groupDetails || undefined,
        };
      })
    );

    return enrichedInvitations;
  } catch (error) {
    console.error('Error getting user invitations:', error);
    throw error;
  }
};

export const acceptGroupInvitation = async (
  invitationId: string,
  userId: string
): Promise<void> => {
  try {
    const invitation = await getDocument<GroupInvitation>(
      COLLECTIONS.GROUP_INVITATIONS,
      invitationId
    );

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer pending');
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = invitation.expiresAt as any;
    if (expiresAt.toDate && expiresAt.toDate() < now) {
      // Update invitation status to expired
      await updateDocument(COLLECTIONS.GROUP_INVITATIONS, invitationId, { status: 'rejected' });
      throw new Error('Invitation has expired');
    }

    // Add user to group
    await addGroupMember(userId, invitation.groupId, 'member');

    // Update invitation status
    await updateDocument(COLLECTIONS.GROUP_INVITATIONS, invitationId, {
      status: 'accepted',
      inviteeId: userId,
    });
  } catch (error) {
    console.error('Error accepting group invitation:', error);
    throw error;
  }
};

export const rejectGroupInvitation = async (invitationId: string): Promise<void> => {
  try {
    const invitation = await getDocument<GroupInvitation>(
      COLLECTIONS.GROUP_INVITATIONS,
      invitationId
    );

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer pending');
    }

    await updateDocument(COLLECTIONS.GROUP_INVITATIONS, invitationId, {
      status: 'rejected',
    });
  } catch (error) {
    console.error('Error rejecting group invitation:', error);
    throw error;
  }
};

export const cancelGroupInvitation = async (invitationId: string, userId: string): Promise<void> => {
  try {
    const invitation = await getDocument<GroupInvitation>(
      COLLECTIONS.GROUP_INVITATIONS,
      invitationId
    );

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Only the inviter can cancel the invitation
    if (invitation.inviterId !== userId) {
      throw new Error('You do not have permission to cancel this invitation');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer pending');
    }

    await updateDocument(COLLECTIONS.GROUP_INVITATIONS, invitationId, {
      status: 'cancelled',
    });
  } catch (error) {
    console.error('Error cancelling group invitation:', error);
    throw error;
  }
};

// Location operations

export const updateUserLocation = async (
  userId: string,
  groupId: string,
  location: UserLocation['location']
): Promise<void> => {
  const locationData: Partial<UserLocation> = {
    userId,
    groupId,
    location,
    lastUpdated: firestore.FieldValue.serverTimestamp() as any,
    isActive: true,
  };

  const locationId = `${userId}_${groupId}`;
  await setDocument(COLLECTIONS.USER_LOCATIONS, locationId, locationData);
};

export const getNearbyUsers = async (
  groupId: string,
  excludeUserId?: string
): Promise<UserLocation[]> => {
  const conditions = [
    { field: 'groupId', operator: '==' as const, value: groupId },
    { field: 'isActive', operator: '==' as const, value: true },
  ];

  const locations = await queryDocuments<UserLocation>(
    COLLECTIONS.USER_LOCATIONS,
    conditions
  );

  return excludeUserId
    ? locations.filter(loc => loc.userId !== excludeUserId)
    : locations;
};

// Real-time listeners

export const subscribeToUserLocation = (
  userId: string,
  groupId: string,
  callback: (location: UserLocation | null) => void
): (() => void) => {
  const locationId = `${userId}_${groupId}`;
  return firestore()
    .collection(COLLECTIONS.USER_LOCATIONS)
    .doc(locationId)
    .onSnapshot(
      doc => {
        if (doc.exists) {
          callback({ id: doc.id, ...doc.data() } as UserLocation);
        } else {
          callback(null);
        }
      },
      error => {
        console.error('Error subscribing to user location:', error);
        callback(null);
      }
    );
};

export const subscribeToNearbyUsers = (
  groupId: string,
  callback: (locations: UserLocation[]) => void
): (() => void) => {
  return firestore()
    .collection(COLLECTIONS.USER_LOCATIONS)
    .where('groupId', '==', groupId)
    .where('isActive', '==', true)
    .onSnapshot(
      snapshot => {
        const locations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as UserLocation[];
        callback(locations);
      },
      error => {
        console.error('Error subscribing to nearby users:', error);
        callback([]);
      }
    );
};

// Proximity Alert operations

/**
 * Create a proximity alert
 * @param alertData - Proximity alert data
 * @returns Created alert ID
 */
export const createProximityAlert = async (
  alertData: Omit<ProximityAlert, 'id'>
): Promise<string> => {
  try {
    const docId = await createDocument(COLLECTIONS.PROXIMITY_ALERTS, alertData);
    return docId;
  } catch (error) {
    console.error('Error creating proximity alert:', error);
    throw error;
  }
};

/**
 * Get proximity alerts for a user
 * @param userId - ID of the user
 * @param limit - Optional limit on number of alerts
 * @returns Array of proximity alerts
 */
export const getProximityAlerts = async (
  userId: string,
  limit?: number
): Promise<ProximityAlert[]> => {
  try {
    const alerts = await queryDocuments<ProximityAlert>(
      COLLECTIONS.PROXIMITY_ALERTS,
      [{ field: 'userId', operator: '==', value: userId }]
    );
    // Sort by timestamp descending (newest first)
    const sorted = alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  } catch (error) {
    console.error('Error getting proximity alerts:', error);
    throw error;
  }
};

/**
 * Subscribe to proximity alerts for a user
 * @param userId - ID of the user
 * @param callback - Callback function for alert updates
 * @returns Unsubscribe function
 */
export const subscribeToProximityAlerts = (
  userId: string,
  callback: (alerts: ProximityAlert[]) => void
): (() => void) => {
  return firestore()
    .collection(COLLECTIONS.PROXIMITY_ALERTS)
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .onSnapshot(
      snapshot => {
        const alerts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as ProximityAlert[];
        callback(alerts);
      },
      error => {
        console.error('Error subscribing to proximity alerts:', error);
        callback([]);
      }
    );
};

/**
 * Mark proximity alert as acknowledged
 * @param alertId - ID of the alert
 */
export const acknowledgeProximityAlert = async (alertId: string): Promise<void> => {
  try {
    await updateDocument(COLLECTIONS.PROXIMITY_ALERTS, alertId, {
      acknowledged: true,
    });
  } catch (error) {
    console.error('Error acknowledging proximity alert:', error);
    throw error;
  }
};
