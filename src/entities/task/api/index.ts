import type { Task, TaskPriority, TaskStatus } from '@/shared/types';

interface CreateTaskData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  category?: string;
  dueDate?: string;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  category?: string;
  dueDate?: string;
}

export async function createTask(data: CreateTaskData): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateTask(id: number, data: UpdateTaskData): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteTask(id: number): Promise<void> {
  await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
}

export async function getTask(id: number): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`);
  return res.json();
}