'use client';

import { Card, CardContent, Typography, Box, Chip, IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import { Edit, Delete, MoreVert, AutoAwesome } from '@mui/icons-material';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDecompose: (task: Task) => void;
}

const priorityColors = {
  low: 'success',
  medium: 'warning',
  high: 'error',
} as const;

const statusLabels = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  done: 'Готово',
} as const;

const categoryLabels: Record<string, string> = {
  bug: 'Баг',
  feature: 'Фича',
  improvement: 'Улучшение',
  documentation: 'Документация',
  research: 'Исследование',
};

export function TaskCard({ task, onEdit, onDelete, onDecompose }: TaskCardProps) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1, mr: 1 }}>
            {task.title}
          </Typography>
          <Box>
            <Tooltip title="Редактировать">
              <IconButton size="small" onClick={() => onEdit(task)}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Удалить">
              <IconButton size="small" color="error" onClick={() => onDelete(task.id)}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {task.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {task.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          <Chip
            label={statusLabels[task.status]}
            size="small"
            color={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'primary' : 'default'}
          />
          <Chip
            label={task.priority === 'low' ? 'Низкий' : task.priority === 'medium' ? 'Средний' : 'Высокий'}
            size="small"
            color={priorityColors[task.priority]}
          />
          {task.category && (
            <Chip label={categoryLabels[task.category] || task.category} size="small" variant="outlined" />
          )}
        </Box>

        {task.dueDate && (
          <Typography variant="caption" color="text.secondary">
            Срок: {new Date(task.dueDate).toLocaleDateString('ru-RU')}
          </Typography>
        )}

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title="Декомпозиция с AI">
            <IconButton size="small" color="secondary" onClick={() => onDecompose(task)}>
              <AutoAwesome fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
}