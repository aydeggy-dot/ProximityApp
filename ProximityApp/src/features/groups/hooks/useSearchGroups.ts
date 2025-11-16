import { useState, useCallback } from 'react';
import { Group } from '../../../types';
import { searchGroups, getPublicGroups } from '../../../services/firebase/firestore';

interface UseSearchGroupsResult {
  groups: Group[];
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  loadPublicGroups: () => Promise<void>;
}

export const useSearchGroups = (): UseSearchGroupsResult => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      const results = await searchGroups(query);
      setGroups(results);
    } catch (err) {
      console.error('Error searching groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to search groups');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPublicGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const results = await getPublicGroups();
      setGroups(results);
    } catch (err) {
      console.error('Error loading public groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    groups,
    loading,
    error,
    search,
    loadPublicGroups,
  };
};
