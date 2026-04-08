'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import type { Task, TaskStatus, TaskPriority, TaskCategory } from '@/types';

interface TaskFormProps {
  open: boolean;
  task?: Task;
  onClose: () => void;
  onSave: () => void;
}

export function TaskForm({ open, task, onClose, onSave }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [category, setCategory] = useState<TaskCategory | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestingCategory, setSuggestingCategory] = useState(false);
  const [suggestingPriority, setSuggestingPriority] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      setCategory(task.category || '');
      setDueDate(task.dueDate || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('pending');
      setCategory('');
      setDueDate('');
    }
  }, [task, open]);

  const suggestCategory = async () => {
    if (!title) return;
    setSuggestingCategory(true);
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'categorize', title, description }),
      });
      const data = await res.json();
      if (data.category) setCategory(data.category as TaskCategory);
    } catch (e) {
      console.error(e);
    } finally {
      setSuggestingCategory(false);
    }
  };

  const suggestPriority = async () => {
    if (!title) return;
    setSuggestingPriority(true);
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'priority', title, description, dueDate }),
      });
      const data = await res.json();
      if (data.priority) setPriority(data.priority as TaskPriority);
    } catch (e) {
      console.error(e);
    } finally {
      setSuggestingPriority(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);

    try {
      const url = task ? `/api/tasks/${task.id}` : '/api/tasks';
      const method = task ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          priority,
          status,
          category: category || null,
          dueDate: dueDate || null,
        }),
      });

      onSave();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{task ? 'Редактировать задачу' : 'Новая задача'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Название"
            value={title}
            onChange={e => setTitle(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Описание"
            value={description}
            onChange={e => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              select
              label="Приоритет"
              value={priority}
              onChange={e => setPriority(e.target.value as TaskPriority)}
              fullWidth
            >
              <MenuItem value="low">Низкий</MenuItem>
              <MenuItem value="medium">Средний</MenuItem>
              <MenuItem value="high">Высокий</MenuItem>
            </TextField>
            <Tooltip title="Предложить приоритет">
              <IconButton onClick={suggestPriority} disabled={!title || suggestingPriority}>
                {suggestingPriority ? <CircularProgress size={24} /> : <AutoAwesome />}
              </IconButton>
            </Tooltip>
          </Box>
          <TextField
            select
            label="Статус"
            value={status}
            onChange={e => setStatus(e.target.value as TaskStatus)}
            fullWidth
          >
            <MenuItem value="pending">Ожидает</MenuItem>
            <MenuItem value="in_progress">В работе</MenuItem>
            <MenuItem value="done">Готово</MenuItem>
          </TextField>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              select
              label="Категория"
              value={category}
              onChange={e => setCategory(e.target.value as TaskCategory)}
              fullWidth
            >
              <MenuItem value="">Нет</MenuItem>
              <MenuItem value="bug">Баг</MenuItem>
              <MenuItem value="feature">Фича</MenuItem>
              <MenuItem value="improvement">Улучшение</MenuItem>
              <MenuItem value="documentation">Документация</MenuItem>
              <MenuItem value="research">Исследование</MenuItem>
            </TextField>
            <Tooltip title="Предложить категорию">
              <IconButton onClick={suggestCategory} disabled={!title || suggestingCategory}>
                {suggestingCategory ? <CircularProgress size={24} /> : <AutoAwesome />}
              </IconButton>
            </Tooltip>
          </Box>
          <TextField
            label="Срок выполнения"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!title.trim() || loading}>
          {loading ? <CircularProgress size={24} /> : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}