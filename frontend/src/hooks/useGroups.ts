/**
 * useGroups - хук для получения и кэширования списка групп с сервера
 * @returns { groups, isLoading, error, refresh }
 */

import { useState, useCallback, useEffect } from 'react';
import { GroupsData } from '@/types/api';
import { apiService } from '@/services/api';

let groupsCache: GroupsData | null = null;

export function useGroups() {
  const [groups, setGroups] = useState<GroupsData | null>(groupsCache);
  const [isLoading, setIsLoading] = useState<boolean>(!groupsCache);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getAvailableGroups();
      setGroups(data);
      groupsCache = data;
      setIsLoading(false);
    } catch (e) {
      setError((e as Error).message);
      setGroups(null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!groupsCache) fetchGroups();
  }, [fetchGroups]);

  const refresh = useCallback(() => {
    groupsCache = null;
    fetchGroups();
  }, [fetchGroups]);

  return { groups, isLoading, error, refresh };
}
