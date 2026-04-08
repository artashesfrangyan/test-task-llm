'use client';

import { Box, TextField, MenuItem, Paper, Typography } from '@mui/material';
import type { TaskStatus, TaskPriority } from '@/types';

interface TaskFiltersProps {
  search: string;
  statusFilter: string;
  priorityFilter: string;
  taskCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
}

export function TaskFilters({
  search,
  statusFilter,
  priorityFilter,
  taskCount,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
}: TaskFiltersProps) {
  const pluralize = (n: number) => {
    const lastTwo = n % 100;
    const lastOne = n % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return 'задач';
    if (lastOne === 1) return 'задача';
    if (lastOne >= 2 && lastOne <= 4) return 'задачи';
    return 'задач';
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Поиск задач..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          sx={{ minWidth: 200, flexGrow: 1 }}
        />
        <TextField
          select
          size="small"
          label="Статус"
          value={statusFilter}
          onChange={e => onStatusChange(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">Все</MenuItem>
          <MenuItem value="pending">Ожидает</MenuItem>
          <MenuItem value="in_progress">В работе</MenuItem>
          <MenuItem value="done">Готово</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Приоритет"
          value={priorityFilter}
          onChange={e => onPriorityChange(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">Все</MenuItem>
          <MenuItem value="low">Низкий</MenuItem>
          <MenuItem value="medium">Средний</MenuItem>
          <MenuItem value="high">Высокий</MenuItem>
        </TextField>
        <Typography variant="body2" color="text.secondary">
          {taskCount} {pluralize(taskCount)}
        </Typography>
      </Box>
    </Paper>
  );
}