import { useState, useEffect, useCallback } from 'react';
import { Group } from '../../../types';
import { getUserGroups } from '../../../services/firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';

interface UseGroupsResult {
  groups: Group[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

export const useGroups = (): UseGroupsResult => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = useCallback(async (isRefreshing = false) => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);
      const userGroups = await getUserGroups(user.uid);

      // Sort groups by creation date (newest first)
      const sortedGroups = userGroups.sort((a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime()
      );

      setGroups(sortedGroups);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  const refresh = useCallback(async () => {
    await fetchGroups(true);
  }, [fetchGroups]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    error,
    refreshing,
    refresh,
  };
};
