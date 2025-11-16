import { useState, useCallback } from 'react';
import { GroupMembership } from '../../../types';
import { updateGroupMembership, removeGroupMember } from '../../../services/firebase/firestore';

interface UseManageMembersResult {
  updating: boolean;
  removing: boolean;
  error: string | null;
  changeRole: (userId: string, groupId: string, newRole: GroupMembership['role']) => Promise<boolean>;
  removeMember: (userId: string, groupId: string) => Promise<boolean>;
}

export const useManageMembers = (): UseManageMembersResult => {
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeRole = useCallback(
    async (userId: string, groupId: string, newRole: GroupMembership['role']): Promise<boolean> => {
      try {
        setUpdating(true);
        setError(null);

        await updateGroupMembership(userId, groupId, { role: newRole });

        return true;
      } catch (err) {
        console.error('Error changing member role:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to change member role';
        setError(errorMessage);
        return false;
      } finally {
        setUpdating(false);
      }
    },
    []
  );

  const removeMember = useCallback(
    async (userId: string, groupId: string): Promise<boolean> => {
      try {
        setRemoving(true);
        setError(null);

        await removeGroupMember(userId, groupId);

        return true;
      } catch (err) {
        console.error('Error removing member:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
        setError(errorMessage);
        return false;
      } finally {
        setRemoving(false);
      }
    },
    []
  );

  return {
    updating,
    removing,
    error,
    changeRole,
    removeMember,
  };
};
