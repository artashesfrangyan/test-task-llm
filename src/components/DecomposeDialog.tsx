'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  CircularProgress,
  Typography,
} from '@mui/material';
import type { Task, TaskPriority } from '@/types';

interface Subtask {
  title: string;
  priority: TaskPriority;
}

interface DecomposeDialogProps {
  task: Task;
  onClose: () => void;
  onCreated: () => void;
}

export function DecomposeDialog({ task, onClose, onCreated }: DecomposeDialogProps) {
  const [loading, setLoading] = useState(true);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const decompose = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'decompose', title: task.title, description: task.description }),
        });
        const data = await res.json();
        const tasks = data.subtasks || [
          { title: `${task.title} - Планирование`, priority: 'high' },
          { title: `${task.title} - Реализация`, priority: 'medium' },
          { title: `${task.title} - Тестирование`, priority: 'medium' },
        ];
        setSubtasks(tasks);
        setSelected(tasks.map(() => true));
      } catch (e) {
        console.error(e);
        const defaults = [
          { title: `${task.title} - Планирование`, priority: 'high' as TaskPriority },
          { title: `${task.title} - Реализация`, priority: 'medium' as TaskPriority },
          { title: `${task.title} - Тестирование`, priority: 'medium' as TaskPriority },
        ];
        setSubtasks(defaults);
        setSelected(defaults.map(() => true));
      } finally {
        setLoading(false);
      }
    };
    decompose();
  }, [task]);

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
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Декомпозиция: {task.title}</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : (
          <List>
            {subtasks.map((st, i) => (
              <ListItem key={i} dense onClick={() => toggleSubtask(i)}>
                <Checkbox checked={selected[i]} />
                <ListItemText primary={st.title} secondary={`Приоритет: ${st.priority}`} />
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
          disabled={creating || !selected.some(Boolean)}
        >
          {creating ? <CircularProgress size={24} /> : 'Создать выбранные'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}