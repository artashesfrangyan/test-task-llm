'use client';

import { useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Skeleton, Button, AppBar, Toolbar, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, AutoAwesome as AIIcon } from '@mui/icons-material';
import { useTasks } from '@/entities/task/model';
import { TaskCard } from '@/entities/task/ui/TaskCard';
import { createTask, updateTask, deleteTask } from '@/entities/task/api';
import { TaskFilters } from '@/features/task-filters/ui/TaskFilters';
import { TaskFormDialog } from '@/features/task-form/ui/TaskFormDialog';
import { SummaryDialog } from '@/features/llm-summary/ui/SummaryDialog';
import { DecomposeDialog } from '@/features/llm-decompose/ui/DecomposeDialog';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import type { Task } from '@/shared/types';

export function TasksBoard() {
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [decomposeTask, setDecomposeTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const { tasks, loading, refresh } = useTasks(
    status !== 'all' || priority !== 'all' || search ? { status, priority, search } as any : undefined
  );

  const handleSave = async (data: any) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask(data);
    }
    refresh();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTask(deleteId);
      setDeleteId(null);
      refresh();
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Task Manager
          </Typography>
          <Tooltip title="AI Сводка">
            <IconButton onClick={() => setSummaryOpen(true)} color="secondary">
              <AIIcon />
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingTask(null); setFormOpen(true); }}>
            Новая задача
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <TaskFilters
            status={status}
            priority={priority}
            search={search}
            onStatusChange={setStatus}
            onPriorityChange={setPriority}
            onSearchChange={setSearch}
          />
        </Box>

        {loading ? (
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map(i => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card><CardContent><Skeleton height={100} /></CardContent></Card>
              </Grid>
            ))}
          </Grid>
        ) : tasks.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 8 }}>
            <CardContent>
              <Typography color="text.secondary">
                {search || status !== 'all' || priority !== 'all' ? 'Задачи не найдены' : 'Нет задач. Создайте первую!'}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {tasks.map(task => (
              <Grid key={task.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <TaskCard
                  task={task}
                  onEdit={handleEdit}
                  onDelete={id => setDeleteId(id)}
                  onDecompose={setDecomposeTask}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <TaskFormDialog open={formOpen} task={editingTask} onClose={() => setFormOpen(false)} onSave={handleSave} />
      <SummaryDialog open={summaryOpen} onClose={() => setSummaryOpen(false)} />
      {decomposeTask && (
        <DecomposeDialog task={decomposeTask} open={true} onClose={() => setDecomposeTask(null)} onCreated={refresh} />
      )}
      <ConfirmDialog open={!!deleteId} title="Удалить задачу?" onConfirm={handleDelete} onClose={() => setDeleteId(null)} />
    </Box>
  );
}