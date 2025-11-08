import { useState, useCallback } from 'react';
import { Group } from '../../../types';
import { createGroup, addGroupMember } from '../../../services/firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { SUCCESS_MESSAGES } from '../../../constants';

interface UseCreateGroupResult {
  creating: boolean;
  error: string | null;
  createNewGroup: (name: string, description?: string, privacyLevel?: Group['privacyLevel']) => Promise<string | null>;
}

export const useCreateGroup = (): UseCreateGroupResult => {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewGroup = useCallback(
    async (
      name: string,
      description?: string,
      privacyLevel: Group['privacyLevel'] = 'public'
    ): Promise<string | null> => {
      if (!user?.uid) {
        setError('You must be logged in to create a group');
        return null;
      }

      if (!name.trim()) {
        setError('Group name is required');
        return null;
      }

      try {
        setCreating(true);
        setError(null);

        const groupData: Omit<Group, 'id'> = {
          name: name.trim(),
          description: description?.trim(),
          createdBy: user.uid,
          createdAt: new Date(),
          memberCount: 1,
          isActive: true,
          privacyLevel,
        };

        // Create the group
        const groupId = await createGroup(groupData);

        // Add creator as admin member
        await addGroupMember(user.uid, groupId, 'admin');

        console.log(SUCCESS_MESSAGES.GROUP_CREATED, groupId);
        return groupId;
      } catch (err) {
        console.error('Error creating group:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to create group';
        setError(errorMessage);
        return null;
      } finally {
        setCreating(false);
      }
    },
    [user?.uid]
  );

  return {
    creating,
    error,
    createNewGroup,
  };
};
