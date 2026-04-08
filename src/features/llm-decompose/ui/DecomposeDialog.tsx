'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, List, ListItem, ListItemText, Checkbox, CircularProgress
} from '@mui/material';
import type { Task, TaskPriority } from '@/shared/types';

interface Subtask {
  title: string;
  priority: TaskPriority;
}

interface DecomposeDialogProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий'
};

const defaultSubtasks = (title: string): Subtask[] => [
  { title: `${title} - Планирование`, priority: 'high' },
  { title: `${title} - Реализация`, priority: 'medium' },
  { title: `${title} - Тестирование`, priority: 'medium' },
];

export function DecomposeDialog({ task, open, onClose, onCreated }: DecomposeDialogProps) {
  const [loading, setLoading] = useState(true);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [creating, setCreating] = useState(false);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      requestedRef.current = false;
      return;
    }

    if (requestedRef.current) return;
    requestedRef.current = true;

    const decompose = async () => {
      setLoading(true);
      setSubtasks([]);

      const makeRequest = () =>
        fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'decompose', title: task.title, description: task.description }),
        }).then(r => r.json());

      const results = await Promise.allSettled([makeRequest(), makeRequest()]);

      let found: Subtask[] | null = null;
      for (const r of results) {
        if (r.status === 'fulfilled') {
          const data = r.value;
          if (data.subtasks && Array.isArray(data.subtasks) && data.subtasks.length > 0) {
            found = data.subtasks;
            break;
          }
        }
      }

      if (found) {
        setSubtasks(found);
        setSelected(found.map(() => true));
      } else {
        const fallback = defaultSubtasks(task.title);
        setSubtasks(fallback);
        setSelected(fallback.map(() => true));
      }

      setLoading(false);
    };

    decompose();
  }, [task, open]);

  const toggleSubtask = (index: number) => {
    setSelected(prev => prev.map((s, i) => (i === index ? !s : s)));
  };

  const handleCreate = async () => {
    setCreating(true);
    const toCreate = subtasks.filter((_, i) => selected[i]);

    try {
      await Promise.all(
        toCreate.map(st =>
          fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: st.title,
              priority: st.priority,
              status: 'pending',
            }),
          })
        )
      );
      onCreated();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Декомпозиция: {task.title}</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : subtasks.length === 0 ? (
          'Не удалось сгенерировать подзадачи'
        ) : (
          <List>
            {subtasks.map((st, i) => (
              <ListItem disableGutters key={i}  onClick={() => toggleSubtask(i)}>
                <Checkbox checked={selected[i]} />
                <ListItemText primary={st.title} secondary={`Приоритет: ${priorityLabels[st.priority] || st.priority}`} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={creating || loading || !selected.some(Boolean)}
        >
          {creating ? <CircularProgress size={24} /> : 'Создать выбранные'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}