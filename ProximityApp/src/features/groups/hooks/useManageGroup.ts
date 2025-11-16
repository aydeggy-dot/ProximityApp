import { useState, useCallback } from 'react';
import { Group } from '../../../types';
import { updateGroup, deleteGroup } from '../../../services/firebase/firestore';

interface UseManageGroupResult {
  updating: boolean;
  deleting: boolean;
  error: string | null;
  updateGroupDetails: (groupId: string, updates: Partial<Omit<Group, 'id'>>) => Promise<boolean>;
  deleteGroupPermanently: (groupId: string) => Promise<boolean>;
}

export const useManageGroup = (): UseManageGroupResult => {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateGroupDetails = useCallback(
    async (groupId: string, updates: Partial<Omit<Group, 'id'>>): Promise<boolean> => {
      try {
        setUpdating(true);
        setError(null);

        await updateGroup(groupId, updates);

        return true;
      } catch (err) {
        console.error('Error updating group:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to update group';
        setError(errorMessage);
        return false;
      } finally {
        setUpdating(false);
      }
    },
    []
  );

  const deleteGroupPermanently = useCallback(
    async (groupId: string): Promise<boolean> => {
      try {
        setDeleting(true);
        setError(null);

        await deleteGroup(groupId);

        return true;
      } catch (err) {
        console.error('Error deleting group:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete group';
        setError(errorMessage);
        return false;
      } finally {
        setDeleting(false);
      }
    },
    []
  );

  return {
    updating,
    deleting,
    error,
    updateGroupDetails,
    deleteGroupPermanently,
  };
};
