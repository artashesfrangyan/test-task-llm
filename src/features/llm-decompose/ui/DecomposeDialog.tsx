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

export function DecomposeDialog({ task, open, onClose, onCreated }: DecomposeDialogProps) {
  const [loading, setLoading] = useState(true);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [creating, setCreating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const decompose = async () => {
      setLoading(true);
      setSubtasks([]);
      try {
        const res = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'decompose', title: task.title, description: task.description }),
          signal: abortRef.current?.signal,
        });
        const data = await res.json();
        
        if (!res.ok && data.fallback) {
          setSubtasks(data.fallback.subtasks);
          setSelected(data.fallback.subtasks.map(() => true));
        } else {
          const tasks = data.subtasks || [];
          setSubtasks(tasks);
          setSelected(tasks.map(() => true));
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        const defaults: Subtask[] = [
          { title: `${task.title} - Планирование`, priority: 'high' },
          { title: `${task.title} - Реализация`, priority: 'medium' },
          { title: `${task.title} - Тестирование`, priority: 'medium' },
        ];
        setSubtasks(defaults);
        setSelected(defaults.map(() => true));
      } finally {
        setLoading(false);
      }
    };

    decompose();

    return () => {
      abortRef.current?.abort();
    };
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
              <ListItem key={i}  onClick={() => toggleSubtask(i)}>
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