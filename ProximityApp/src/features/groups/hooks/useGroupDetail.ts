import { useState, useEffect, useCallback } from 'react';
import { Group } from '../../../types';
import { getGroup } from '../../../services/firebase/firestore';

interface UseGroupDetailResult {
  group: Group | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useGroupDetail = (groupId: string): UseGroupDetailResult => {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const groupData = await getGroup(groupId);

      if (groupData) {
        setGroup(groupData);
      } else {
        setError('Group not found');
      }
    } catch (err) {
      console.error('Error fetching group:', err);
      setError(err instanceof Error ? err.message : 'Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const refresh = useCallback(async () => {
    await fetchGroup();
  }, [fetchGroup]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  return {
    group,
    loading,
    error,
    refresh,
  };
};
