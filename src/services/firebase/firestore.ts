// Firestore database service

import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../../constants';
import {
  User,
  UserProfile,
  Group,
  GroupMembership,
  UserLocation,
  ProximityAlert,
  ChatMessage,
  MeetRequest,
  GroupEvent,
} from '../../types';

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
    return { id: doc.id, ...doc.data() } as T;
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
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
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
    // Get user's group memberships
    const memberships = await queryDocuments<GroupMembership>(
      COLLECTIONS.GROUP_MEMBERSHIPS,
      [{ field: 'userId', operator: '==', value: userId }]
    );

    // Get group details for each membership
    const groupPromises = memberships.map(membership =>
      getGroup(membership.groupId)
    );
    const groups = await Promise.all(groupPromises);
    return groups.filter(g => g !== null) as Group[];
  } catch (error) {
    console.error('Error getting user groups:', error);
    throw error;
  }
};

// Group Membership operations

export const addGroupMember = async (
  userId: string,
  groupId: string,
  role: 'admin' | 'moderator' | 'member' = 'member'
): Promise<void> => {
  const membershipData: Partial<GroupMembership> = {
    userId,
    groupId,
    role,
    joinedAt: firestore.FieldValue.serverTimestamp() as any,
    isBroadcasting: false,
    isVisible: true,
  };

  const membershipId = `${userId}_${groupId}`;
  await setDocument(COLLECTIONS.GROUP_MEMBERSHIPS, membershipId, membershipData);

  // Increment member count
  await firestore()
    .collection(COLLECTIONS.GROUPS)
    .doc(groupId)
    .update({
      memberCount: firestore.FieldValue.increment(1),
    });
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
  await updateDocument(COLLECTIONS.GROUP_MEMBERSHIPS, membershipId, updates);
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
