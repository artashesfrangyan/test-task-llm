'use client';

import { TextField, Select, MenuItem, FormControl, InputLabel, InputAdornment, Stack } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import type { TaskPriority, TaskStatus } from '@/shared/types';

interface TaskFiltersProps {
  status: string;
  priority: string;
  search: string;
  onStatusChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onSearchChange: (v: string) => void;
}

export function TaskFilters({
  status, priority, search, onStatusChange, onPriorityChange, onSearchChange
}: TaskFiltersProps) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <TextField
        placeholder="Поиск задач..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        size="small"
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
          }
        }}
        sx={{ minWidth: 250 }}
      />
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Статус</InputLabel>
        <Select value={status} label="Статус" onChange={e => onStatusChange(e.target.value)}>
          <MenuItem value="all">Все</MenuItem>
          <MenuItem value="pending">Ожидает</MenuItem>
          <MenuItem value="in_progress">В работе</MenuItem>
          <MenuItem value="done">Готово</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Приоритет</InputLabel>
        <Select value={priority} label="Приоритет" onChange={e => onPriorityChange(e.target.value)}>
          <MenuItem value="all">Все</MenuItem>
          <MenuItem value="low">Низкий</MenuItem>
          <MenuItem value="medium">Средний</MenuItem>
          <MenuItem value="high">Высокий</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}