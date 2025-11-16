/**
 * useMeetRequests Hook
 * Manages meet request state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { MeetRequest, Location } from '../types';
import MeetRequestService from '../services/MeetRequestService';
import { useAuth } from '../contexts/AuthContext';

export const useMeetRequests = () => {
  const { user } = useAuth();
  const [sentRequests, setSentRequests] = useState<MeetRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<MeetRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to sent requests
  useEffect(() => {
    if (!user) {
      setSentRequests([]);
      setLoading(false);
      return;
    }

    const unsubscribe = MeetRequestService.getSent(user.uid, requests => {
      setSentRequests(requests);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Subscribe to received requests
  useEffect(() => {
    if (!user) {
      setReceivedRequests([]);
      return;
    }

    const unsubscribe = MeetRequestService.getReceived(user.uid, requests => {
      setReceivedRequests(requests);
    });

    return unsubscribe;
  }, [user]);

  /**
   * Send a meet request to another user
   */
  const sendMeetRequest = useCallback(
    async ({
      receiverId,
      groupId,
      location,
      message,
    }: {
      receiverId: string;
      groupId: string;
      location?: Location;
      message?: string;
    }): Promise<MeetRequest> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      return await MeetRequestService.create({
        senderId: user.uid,
        receiverId,
        groupId,
        location,
        message,
      });
    },
    [user]
  );

  /**
   * Accept a received meet request
   */
  const acceptRequest = useCallback(async (requestId: string): Promise<void> => {
    await MeetRequestService.accept(requestId);
  }, []);

  /**
   * Decline a received meet request
   */
  const declineRequest = useCallback(async (requestId: string): Promise<void> => {
    await MeetRequestService.decline(requestId);
  }, []);

  /**
   * Cancel a sent meet request
   */
  const cancelRequest = useCallback(async (requestId: string): Promise<void> => {
    await MeetRequestService.cancel(requestId);
  }, []);

  /**
   * Get active meet request with a specific user in a group
   */
  const getActiveMeetRequest = useCallback(
    async (otherUserId: string, groupId: string): Promise<MeetRequest | null> => {
      if (!user) return null;
      return await MeetRequestService.getActive(user.uid, otherUserId, groupId);
    },
    [user]
  );

  /**
   * Check if there's a pending request with a user
   */
  const hasPendingRequest = useCallback(
    (otherUserId: string, groupId: string): boolean => {
      return (
        sentRequests.some(
          req =>
            req.receiverId === otherUserId &&
            req.groupId === groupId &&
            req.status === 'pending'
        ) ||
        receivedRequests.some(
          req =>
            req.senderId === otherUserId && req.groupId === groupId && req.status === 'pending'
        )
      );
    },
    [sentRequests, receivedRequests]
  );

  return {
    sentRequests,
    receivedRequests,
    pendingReceivedCount: receivedRequests.filter(r => r.status === 'pending').length,
    loading,
    sendMeetRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    getActiveMeetRequest,
    hasPendingRequest,
  };
};

export default useMeetRequests;
