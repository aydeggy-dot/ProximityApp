import { useState, useEffect, useCallback } from 'react';
import { GroupMembership, UserProfile } from '../../../types';
import { getGroupMembers } from '../../../services/firebase/firestore';

type GroupMemberWithProfile = GroupMembership & { userProfile?: UserProfile };

interface UseGroupMembersResult {
  members: GroupMemberWithProfile[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useGroupMembers = (groupId: string): UseGroupMembersResult => {
  const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const groupMembers = await getGroupMembers(groupId);

      // Sort members by role (admin > moderator > member) and then by join date
      const sortedMembers = groupMembers.sort((a, b) => {
        const roleOrder = { admin: 0, moderator: 1, member: 2 };
        const roleComparison = roleOrder[a.role] - roleOrder[b.role];
        if (roleComparison !== 0) return roleComparison;

        // If roles are the same, sort by join date
        return (a.joinedAt as any)?.getTime() - (b.joinedAt as any)?.getTime();
      });

      setMembers(sortedMembers);
    } catch (err) {
      console.error('Error fetching group members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const refresh = useCallback(async () => {
    await fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    refresh,
  };
};
