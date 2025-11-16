// Hook for fetching popular groups with infinite scroll support

import { useState, useEffect, useCallback } from 'react';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Group } from '../../../types';
import { getPopularGroups } from '../../../services/firebase/firestore';

interface UsePopularGroupsResult {
  groups: Group[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching popular groups with infinite scroll
 * Groups are sorted by popularity score and member count
 * @param pageSize - Number of groups to fetch per page (default: 20)
 * @returns Object with groups, loading state, and pagination controls
 */
export const usePopularGroups = (pageSize: number = 20): UsePopularGroupsResult => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [lastVisible, setLastVisible] = useState<FirebaseFirestoreTypes.DocumentSnapshot | null>(null);

  /**
   * Fetch initial page of groups
   */
  const fetchInitialGroups = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { groups: fetchedGroups, lastVisible: lastDoc } = await getPopularGroups(pageSize);

      setGroups(fetchedGroups);
      setLastVisible(lastDoc);
      setHasMore(fetchedGroups.length >= pageSize);
    } catch (err) {
      console.error('Error fetching popular groups:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch groups'));
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  /**
   * Load more groups (for infinite scroll)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    setLoading(true);
    setError(null);

    try {
      const { groups: fetchedGroups, lastVisible: lastDoc } = await getPopularGroups(
        pageSize,
        lastVisible || undefined
      );

      setGroups(prev => [...prev, ...fetchedGroups]);
      setLastVisible(lastDoc);
      setHasMore(fetchedGroups.length >= pageSize);
    } catch (err) {
      console.error('Error loading more groups:', err);
      setError(err instanceof Error ? err : new Error('Failed to load more groups'));
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, pageSize, lastVisible]);

  /**
   * Refresh groups (pull to refresh)
   */
  const refresh = useCallback(async () => {
    setLastVisible(null);
    setHasMore(true);
    await fetchInitialGroups();
  }, [fetchInitialGroups]);

  // Fetch initial groups on mount
  useEffect(() => {
    fetchInitialGroups();
  }, [fetchInitialGroups]);

  return {
    groups,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
};
