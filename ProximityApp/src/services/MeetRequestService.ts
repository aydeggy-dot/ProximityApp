/**
 * Meet Request Service
 * Handles creation, management, and notifications for meet-up requests
 */

import firestore from '@react-native-firebase/firestore';
import { MeetRequest, Location } from '../types';

const MEET_REQUESTS_COLLECTION = 'meetRequests';
const REQUEST_EXPIRY_HOURS = 2; // Meet requests expire after 2 hours

/**
 * Create a new meet request
 */
export const createMeetRequest = async ({
  senderId,
  receiverId,
  groupId,
  location,
  message,
}: {
  senderId: string;
  receiverId: string;
  groupId: string;
  location?: Location;
  message?: string;
}): Promise<MeetRequest> => {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + REQUEST_EXPIRY_HOURS * 60 * 60 * 1000);

    const meetRequestData = {
      senderId,
      receiverId,
      groupId,
      location: location
        ? new firestore.GeoPoint(location.latitude, location.longitude)
        : null,
      message: message || null,
      status: 'pending' as const,
      createdAt: firestore.FieldValue.serverTimestamp(),
      expiresAt: firestore.Timestamp.fromDate(expiresAt),
    };

    const docRef = await firestore()
      .collection(MEET_REQUESTS_COLLECTION)
      .add(meetRequestData);

    // Get the created document
    const doc = await docRef.get();
    const data = doc.data();

    return {
      id: doc.id,
      senderId: data!.senderId,
      receiverId: data!.receiverId,
      groupId: data!.groupId,
      location: data!.location
        ? {
            latitude: data!.location.latitude,
            longitude: data!.location.longitude,
            timestamp: Date.now(),
          }
        : undefined,
      message: data!.message,
      status: data!.status,
      createdAt: data!.createdAt?.toDate() || now,
      expiresAt: data!.expiresAt?.toDate() || expiresAt,
    };
  } catch (error) {
    console.error('Error creating meet request:', error);
    throw error;
  }
};

/**
 * Accept a meet request
 */
export const acceptMeetRequest = async (requestId: string): Promise<void> => {
  try {
    await firestore().collection(MEET_REQUESTS_COLLECTION).doc(requestId).update({
      status: 'accepted',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error accepting meet request:', error);
    throw error;
  }
};

/**
 * Decline a meet request
 */
export const declineMeetRequest = async (requestId: string): Promise<void> => {
  try {
    await firestore().collection(MEET_REQUESTS_COLLECTION).doc(requestId).update({
      status: 'declined',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error declining meet request:', error);
    throw error;
  }
};

/**
 * Cancel a meet request (by sender)
 */
export const cancelMeetRequest = async (requestId: string): Promise<void> => {
  try {
    await firestore().collection(MEET_REQUESTS_COLLECTION).doc(requestId).update({
      status: 'expired',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error canceling meet request:', error);
    throw error;
  }
};

/**
 * Get pending meet requests sent by user
 */
export const getSentMeetRequests = (
  userId: string,
  callback: (requests: MeetRequest[]) => void
): (() => void) => {
  const unsubscribe = firestore()
    .collection(MEET_REQUESTS_COLLECTION)
    .where('senderId', '==', userId)
    .where('status', 'in', ['pending', 'accepted'])
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snapshot => {
        const requests: MeetRequest[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            senderId: data.senderId,
            receiverId: data.receiverId,
            groupId: data.groupId,
            location: data.location
              ? {
                  latitude: data.location.latitude,
                  longitude: data.location.longitude,
                  timestamp: Date.now(),
                }
              : undefined,
            message: data.message,
            status: data.status,
            createdAt: data.createdAt?.toDate() || new Date(),
            expiresAt: data.expiresAt?.toDate() || new Date(),
          };
        });
        callback(requests);
      },
      error => {
        console.error('Error listening to sent meet requests:', error);
      }
    );

  return unsubscribe;
};

/**
 * Get pending meet requests received by user
 */
export const getReceivedMeetRequests = (
  userId: string,
  callback: (requests: MeetRequest[]) => void
): (() => void) => {
  const unsubscribe = firestore()
    .collection(MEET_REQUESTS_COLLECTION)
    .where('receiverId', '==', userId)
    .where('status', 'in', ['pending', 'accepted'])
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snapshot => {
        const requests: MeetRequest[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            senderId: data.senderId,
            receiverId: data.receiverId,
            groupId: data.groupId,
            location: data.location
              ? {
                  latitude: data.location.latitude,
                  longitude: data.location.longitude,
                  timestamp: Date.now(),
                }
              : undefined,
            message: data.message,
            status: data.status,
            createdAt: data.createdAt?.toDate() || new Date(),
            expiresAt: data.expiresAt?.toDate() || new Date(),
          };
        });
        callback(requests);
      },
      error => {
        console.error('Error listening to received meet requests:', error);
      }
    );

  return unsubscribe;
};

/**
 * Get active meet request between two users in a group
 */
export const getActiveMeetRequest = async (
  userId1: string,
  userId2: string,
  groupId: string
): Promise<MeetRequest | null> => {
  try {
    // Check if there's an active request from userId1 to userId2
    const sentSnapshot = await firestore()
      .collection(MEET_REQUESTS_COLLECTION)
      .where('senderId', '==', userId1)
      .where('receiverId', '==', userId2)
      .where('groupId', '==', groupId)
      .where('status', 'in', ['pending', 'accepted'])
      .limit(1)
      .get();

    if (!sentSnapshot.empty) {
      const doc = sentSnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        groupId: data.groupId,
        location: data.location
          ? {
              latitude: data.location.latitude,
              longitude: data.location.longitude,
              timestamp: Date.now(),
            }
          : undefined,
        message: data.message,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date(),
      };
    }

    // Check if there's an active request from userId2 to userId1
    const receivedSnapshot = await firestore()
      .collection(MEET_REQUESTS_COLLECTION)
      .where('senderId', '==', userId2)
      .where('receiverId', '==', userId1)
      .where('groupId', '==', groupId)
      .where('status', 'in', ['pending', 'accepted'])
      .limit(1)
      .get();

    if (!receivedSnapshot.empty) {
      const doc = receivedSnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        groupId: data.groupId,
        location: data.location
          ? {
              latitude: data.location.latitude,
              longitude: data.location.longitude,
              timestamp: Date.now(),
            }
          : undefined,
        message: data.message,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date(),
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting active meet request:', error);
    return null;
  }
};

/**
 * Clean up expired meet requests
 */
export const cleanupExpiredRequests = async (): Promise<void> => {
  try {
    const now = firestore.Timestamp.now();

    const expiredSnapshot = await firestore()
      .collection(MEET_REQUESTS_COLLECTION)
      .where('expiresAt', '<', now)
      .where('status', '==', 'pending')
      .get();

    const batch = firestore().batch();

    expiredSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'expired',
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    console.log(`Cleaned up ${expiredSnapshot.size} expired meet requests`);
  } catch (error) {
    console.error('Error cleaning up expired requests:', error);
  }
};

export default {
  create: createMeetRequest,
  accept: acceptMeetRequest,
  decline: declineMeetRequest,
  cancel: cancelMeetRequest,
  getSent: getSentMeetRequests,
  getReceived: getReceivedMeetRequests,
  getActive: getActiveMeetRequest,
  cleanupExpired: cleanupExpiredRequests,
};
