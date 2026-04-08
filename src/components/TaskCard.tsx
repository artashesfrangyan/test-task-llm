'use client';

import { Card, CardContent, CardActions, Typography, Chip, Stack, Divider, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, AccountTree as DecomposeIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { priorityColors, statusColors } from '@/theme';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDecompose: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDelete, onDecompose }: TaskCardProps) {
  const statusLabel = task.status === 'pending' ? 'Ожидает' : task.status === 'in_progress' ? 'В работе' : 'Готово';
  const priorityLabel = task.priority === 'low' ? 'Низкий' : task.priority === 'high' ? 'Высокий' : 'Средний';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom noWrap>
          {task.title}
        </Typography>
        {task.description && (
          <Typography
            color="text.secondary"
            variant="body2"
            sx={{
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {task.description}
          </Typography>
        )}
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip
            size="small"
            label={statusLabel}
            sx={{ bgcolor: statusColors[task.status].bg, color: statusColors[task.status].color }}
          />
          <Chip
            size="small"
            label={priorityLabel}
            sx={{ bgcolor: priorityColors[task.priority].bg, color: priorityColors[task.priority].color }}
          />
        </Stack>
        {task.dueDate && (
          <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
            <ScheduleIcon fontSize="small" />
            <Typography variant="caption">
              {new Date(task.dueDate).toLocaleDateString('ru')}
            </Typography>
          </Stack>
        )}
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end', px: 2 }}>
        <Tooltip title="Декомпозиция">
          <IconButton size="small" onClick={() => onDecompose(task)}>
            <DecomposeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Редактировать">
          <IconButton size="small" onClick={() => onEdit(task)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Удалить">
          <IconButton size="small" color="error" onClick={() => onDelete(task.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}