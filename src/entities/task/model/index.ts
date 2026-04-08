import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskFilters } from '@/shared/types';

export function useTasks(filters?: TaskFilters) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.priority) params.set('priority', filters.priority);
      if (filters?.search) params.set('search', filters.search);

      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();
      setTasks(data);
    } catch {
      setError('Ошибка загрузки задач');
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.priority, filters?.search]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, error, refresh: fetchTasks };
}