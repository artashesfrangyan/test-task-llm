export type TaskStatus = 'pending' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskCategory = 'bug' | 'feature' | 'improvement' | 'documentation' | 'research';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category?: TaskCategory;
  dueDate?: string;
  createdAt: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category?: TaskCategory;
  dueDate?: string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
}