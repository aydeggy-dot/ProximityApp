import { useState, useCallback, useEffect } from 'react';
import { GroupInvitation, UserProfile, Group } from '../../../types';
import {
  createGroupInvitation,
  getUserInvitations,
  getGroupInvitations,
  acceptGroupInvitation,
  rejectGroupInvitation,
  cancelGroupInvitation,
} from '../../../services/firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';

interface UseInvitationsResult {
  userInvitations: Array<GroupInvitation & { inviterProfile?: UserProfile; groupDetails?: Group }>;
  groupInvitations: Array<GroupInvitation & { inviterProfile?: UserProfile; groupDetails?: Group }>;
  loading: boolean;
  error: string | null;
  sendInvitation: (groupId: string, inviteeEmail: string, message?: string) => Promise<boolean>;
  acceptInvitation: (invitationId: string) => Promise<boolean>;
  rejectInvitation: (invitationId: string) => Promise<boolean>;
  cancelInvitation: (invitationId: string) => Promise<boolean>;
  loadUserInvitations: () => Promise<void>;
  loadGroupInvitations: (groupId: string) => Promise<void>;
}

export const useInvitations = (): UseInvitationsResult => {
  const { user } = useAuth();
  const [userInvitations, setUserInvitations] = useState<
    Array<GroupInvitation & { inviterProfile?: UserProfile; groupDetails?: Group }>
  >([]);
  const [groupInvitations, setGroupInvitations] = useState<
    Array<GroupInvitation & { inviterProfile?: UserProfile; groupDetails?: Group }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserInvitations = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      const invitations = await getUserInvitations(user.uid, 'pending');
      setUserInvitations(invitations);
    } catch (err) {
      console.error('Error loading user invitations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const loadGroupInvitations = useCallback(async (groupId: string) => {
    try {
      setLoading(true);
      setError(null);
      const invitations = await getGroupInvitations(groupId, 'pending');
      setGroupInvitations(invitations);
    } catch (err) {
      console.error('Error loading group invitations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load group invitations');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendInvitation = useCallback(
    async (groupId: string, inviteeEmail: string, message?: string): Promise<boolean> => {
      if (!user?.uid) {
        setError('You must be logged in to send invitations');
        return false;
      }

      try {
        setLoading(true);
        setError(null);
        await createGroupInvitation(groupId, user.uid, inviteeEmail, message);
        return true;
      } catch (err) {
        console.error('Error sending invitation:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to send invitation';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.uid]
  );

  const acceptInvitation = useCallback(
    async (invitationId: string): Promise<boolean> => {
      if (!user?.uid) {
        setError('You must be logged in to accept invitations');
        return false;
      }

      try {
        setLoading(true);
        setError(null);
        await acceptGroupInvitation(invitationId, user.uid);
        // Refresh user invitations after accepting
        await loadUserInvitations();
        return true;
      } catch (err) {
        console.error('Error accepting invitation:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to accept invitation';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.uid, loadUserInvitations]
  );

  const rejectInvitation = useCallback(
    async (invitationId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        await rejectGroupInvitation(invitationId);
        // Refresh user invitations after rejecting
        await loadUserInvitations();
        return true;
      } catch (err) {
        console.error('Error rejecting invitation:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to reject invitation';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadUserInvitations]
  );

  const cancelInvitation = useCallback(
    async (invitationId: string): Promise<boolean> => {
      if (!user?.uid) {
        setError('You must be logged in to cancel invitations');
        return false;
      }

      try {
        setLoading(true);
        setError(null);
        await cancelGroupInvitation(invitationId, user.uid);
        return true;
      } catch (err) {
        console.error('Error cancelling invitation:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to cancel invitation';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.uid]
  );

  // Load user invitations on mount
  useEffect(() => {
    if (user?.uid) {
      loadUserInvitations();
    }
  }, [user?.uid, loadUserInvitations]);

  return {
    userInvitations,
    groupInvitations,
    loading,
    error,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    loadUserInvitations,
    loadGroupInvitations,
  };
};
