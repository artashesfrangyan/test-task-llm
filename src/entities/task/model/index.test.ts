import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTasks } from './index';

global.fetch = vi.fn();

describe('useTasks', () => {
  it('returns empty array initially', () => {
    (fetch as any).mockResolvedValueOnce({ json: () => [] });
    const { result } = renderHook(() => useTasks());
    expect(result.current.loading).toBe(true);
  });

  it('fetches tasks successfully', async () => {
    const mockTasks = [{ id: 1, title: 'Test Task', priority: 'medium', status: 'pending' }];
    (fetch as any).mockResolvedValueOnce({ json: () => mockTasks });

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toEqual(mockTasks);
  });
});