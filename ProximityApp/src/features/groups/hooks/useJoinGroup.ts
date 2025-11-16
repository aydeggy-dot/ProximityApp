import { useState, useCallback } from 'react';
import { addGroupMember, isUserMemberOfGroup } from '../../../services/firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';

interface UseJoinGroupResult {
  joining: boolean;
  error: string | null;
  joinGroup: (groupId: string) => Promise<boolean>;
  checkMembership: (groupId: string) => Promise<boolean>;
}

export const useJoinGroup = (): UseJoinGroupResult => {
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkMembership = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!user?.uid) return false;

      try {
        return await isUserMemberOfGroup(user.uid, groupId);
      } catch (err) {
        console.error('Error checking membership:', err);
        return false;
      }
    },
    [user?.uid]
  );

  const joinGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!user?.uid) {
        setError('You must be logged in to join a group');
        return false;
      }

      try {
        setJoining(true);
        setError(null);

        // Try to join as regular member
        // If membership already exists, addGroupMember will use merge:true
        // so it won't fail, just update the existing document
        await addGroupMember(user.uid, groupId, 'member');

        return true;
      } catch (err) {
        console.error('Error joining group:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to join group';
        setError(errorMessage);
        return false;
      } finally {
        setJoining(false);
      }
    },
    [user?.uid]
  );

  return {
    joining,
    error,
    joinGroup,
    checkMembership,
  };
};
