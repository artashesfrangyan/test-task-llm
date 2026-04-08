import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTasks } from './index';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const createMockTask = (overrides = {}) => ({
  id: 'test-id',
  title: 'Test Task',
  description: 'Test Description',
  priority: 'medium' as const,
  status: 'pending' as const,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('useTasks', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('initial state', () => {
    it('starts with loading true', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => useTasks());
      
      expect(result.current.loading).toBe(true);
      expect(result.current.tasks).toEqual([]);
      expect(result.current.error).toBe('');
    });
  });

  describe('successful fetch', () => {
    it('fetches tasks without filters', async () => {
      const mockTasks = [createMockTask(), createMockTask({ id: 'test-id-2' })];
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve(mockTasks) });

      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.error).toBe('');
      expect(mockFetch).toHaveBeenCalledWith('/api/tasks?');
    });

    it('fetches tasks with status filter', async () => {
      const mockTasks = [createMockTask({ status: 'in_progress' })];
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve(mockTasks) });

      const { result } = renderHook(() => useTasks({ status: 'in_progress' }));

      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('status=in_progress'));
    });

    it('fetches tasks with priority filter', async () => {
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve([]) });

      const { result } = renderHook(() => useTasks({ priority: 'high' }));

      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('priority=high'));
    });

    it('fetches tasks with search filter', async () => {
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve([]) });

      const { result } = renderHook(() => useTasks({ search: 'bug fix' }));

      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('search=bug+fix'));
    });

    it('combines multiple filters', async () => {
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve([]) });

      const { result } = renderHook(() => useTasks({ 
        status: 'pending', 
        priority: 'high',
        search: 'urgent' 
      }));

      await waitFor(() => expect(result.current.loading).toBe(false));
      
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('status=pending');
      expect(url).toContain('priority=high');
      expect(url).toContain('search=urgent');
    });
  });

  describe('error handling', () => {
    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(result.current.error).toBe('Ошибка загрузки задач');
      expect(result.current.tasks).toEqual([]);
    });

    it('handles malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({ json: () => Promise.reject(new Error('Invalid JSON')) });

      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(result.current.error).toBe('Ошибка загрузки задач');
    });

    it('handles HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({ 
        ok: false, 
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }) 
      });

      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(result.current.tasks).toEqual({ error: 'Server error' });
    });
  });

  describe('refresh functionality', () => {
    it('refresh function refetches tasks', async () => {
      const firstTasks = [createMockTask()];
      const secondTasks = [createMockTask(), createMockTask({ id: 'new-task' })];
      
      mockFetch
        .mockResolvedValueOnce({ json: () => Promise.resolve(firstTasks) })
        .mockResolvedValueOnce({ json: () => Promise.resolve(secondTasks) });

      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.tasks).toEqual(firstTasks);

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => expect(result.current.tasks).toEqual(secondTasks));
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('reactivity', () => {
    it('refetches when filters change', async () => {
      mockFetch.mockResolvedValue({ json: () => Promise.resolve([]) });

      const { result, rerender } = renderHook(
        ({ status }) => useTasks({ status }),
        { initialProps: { status: 'pending' as const } }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockFetch).toHaveBeenCalledTimes(1);

      rerender({ status: 'in_progress' });

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    });

    it('does not refetch when filters stay the same', async () => {
      mockFetch.mockResolvedValue({ json: () => Promise.resolve([]) });

      const { result, rerender } = renderHook(() => useTasks({ status: 'pending' }));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockFetch).toHaveBeenCalledTimes(1);

      rerender();

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('handles empty task list', async () => {
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve([]) });

      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(result.current.tasks).toEqual([]);
      expect(result.current.error).toBe('');
    });

    it('handles tasks with missing optional fields', async () => {
      const mockTasks = [{
        id: 'test-id',
        title: 'Minimal Task',
        priority: 'medium' as const,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      }];
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve(mockTasks) });

      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(result.current.tasks).toEqual(mockTasks);
    });

    it('handles tasks with all fields populated', async () => {
      const mockTasks = [createMockTask({
        category: 'feature',
        dueDate: '2025-12-31',
        description: 'Full description with special chars: <>&"\'',
      })];
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve(mockTasks) });

      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(result.current.tasks).toEqual(mockTasks);
    });

    it('handles large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => 
        createMockTask({ id: `task-${i}`, title: `Task ${i}` })
      );
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve(largeDataset) });

      const startTime = performance.now();
      const { result } = renderHook(() => useTasks());
      
      await waitFor(() => expect(result.current.loading).toBe(false));
      const endTime = performance.now();
      
      expect(result.current.tasks.length).toBe(1000);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('concurrent operations', () => {
    it('handles rapid filter changes', async () => {
      mockFetch.mockResolvedValue({ json: () => Promise.resolve([]) });

      const { result, rerender } = renderHook(
        ({ search }) => useTasks({ search }),
        { initialProps: { search: '' } }
      );

      for (let i = 0; i < 5; i++) {
        rerender({ search: `search-${i}` });
      }

      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it('handles refresh during pending fetch', async () => {
      let resolveFirst: (value: unknown) => void;
      let resolveSecond: (value: unknown) => void;
      
      mockFetch
        .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }))
        .mockImplementationOnce(() => new Promise(resolve => { resolveSecond = resolve; }));

      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.refresh();
      });

      act(() => {
        resolveFirst!({ json: () => Promise.resolve([]) });
      });

      act(() => {
        resolveSecond!({ json: () => Promise.resolve([createMockTask()]) });
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
    });
  });
});