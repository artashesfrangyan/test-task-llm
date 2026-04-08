'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl, InputLabel, Stack, Grid, IconButton, Tooltip, CircularProgress
} from '@mui/material';
import { Lightbulb as SuggestIcon } from '@mui/icons-material';
import type { Task, TaskPriority, TaskStatus } from '@/shared/types';

interface TaskFormDialogProps {
  open: boolean;
  task?: Task | null;
  onClose: () => void;
  onSave: (data: FormData) => void;
}

interface FormData {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
}

export function TaskFormDialog({ open, task, onClose, onSave }: TaskFormDialogProps) {
  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
  });
  const [loadingPriority, setLoadingPriority] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      });
    } else {
      setForm({ title: '', description: '', priority: 'medium', status: 'pending', dueDate: '' });
    }
  }, [task, open]);

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  const suggestPriority = async () => {
    if (!form.title.trim()) return;
    setLoadingPriority(true);
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'priority',
          title: form.title,
          description: form.description,
          dueDate: form.dueDate,
        }),
      });
      const data = await res.json();
      if (data.priority) {
        setForm(prev => ({ ...prev, priority: data.priority }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPriority(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{task ? 'Редактировать задачу' : 'Новая задача'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Название"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Описание"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />
          <Grid container spacing={2}>
            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>Приоритет</InputLabel>
                <Select
                  value={form.priority}
                  label="Приоритет"
                  onChange={e => setForm({ ...form, priority: e.target.value as TaskPriority })}
                  endAdornment={
                    <Tooltip title="Предложить приоритет">
                      <IconButton size="small" onClick={suggestPriority} disabled={loadingPriority || !form.title.trim()} sx={{ mr: 2 }}>
                        {loadingPriority ? <CircularProgress size={18} /> : <SuggestIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <MenuItem value="low">Низкий</MenuItem>
                  <MenuItem value="medium">Средний</MenuItem>
                  <MenuItem value="high">Высокий</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>Статус</InputLabel>
                <Select
                  value={form.status}
                  label="Статус"
                  onChange={e => setForm({ ...form, status: e.target.value as TaskStatus })}
                >
                  <MenuItem value="pending">Ожидает</MenuItem>
                  <MenuItem value="in_progress">В работе</MenuItem>
                  <MenuItem value="done">Готово</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <TextField
            label="Срок выполнения"
            type="date"
            value={form.dueDate}
            onChange={e => setForm({ ...form, dueDate: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!form.title.trim()}>
          {task ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}