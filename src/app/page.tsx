'use client';

import { useState, useEffect } from 'react';
import { Container, Grid, Fab, Alert, Skeleton, Card, CardContent } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Header } from '@/components/Header';
import { TaskFilters } from '@/components/TaskFilters';
import { TaskCard } from '@/components/TaskCard';
import { EmptyState } from '@/components/EmptyState';
import { TaskForm } from '@/components/TaskForm';
import { DecomposeDialog } from '@/components/DecomposeDialog';
import { SummaryDialog } from '@/components/SummaryDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Task } from '@/types';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [decomposeTask, setDecomposeTask] = useState<Task | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      setError('Ошибка загрузки задач');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/tasks/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    fetchTasks();
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingTask(undefined);
  };

  return (
    <>
      <Header onSummaryClick={() => setSummaryOpen(true)} />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <TaskFilters
          search={search}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          taskCount={tasks.length}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
        />

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Grid container spacing={2}>
            {[1, 2, 3].map(i => (
              <Grid size={{ xs: 12, md: 4 }} key={i}>
                <Card><CardContent><Skeleton variant="text" /><Skeleton variant="text" width="60%" /></CardContent></Card>
              </Grid>
            ))}
          </Grid>
        ) : tasks.length === 0 ? (
          <EmptyState onCreateClick={() => setFormOpen(true)} />
        ) : (
          <Grid container spacing={2}>
            {tasks.map(task => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={task.id}>
                <TaskCard task={task} onEdit={handleEdit} onDelete={setDeleteId} onDecompose={setDecomposeTask} />
              </Grid>
            ))}
          </Grid>
        )}

        <Fab color="primary" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={() => setFormOpen(true)}>
          <AddIcon />
        </Fab>

        <TaskForm open={formOpen} task={editingTask} onClose={handleFormClose} onSave={fetchTasks} />
        <ConfirmDialog open={!!deleteId} title="Удалить задачу?" message="Это действие нельзя отменить." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
        {decomposeTask && <DecomposeDialog task={decomposeTask} onClose={() => setDecomposeTask(null)} onCreated={fetchTasks} />}
        {summaryOpen && (
          <SummaryDialog
            open={summaryOpen}
            onClose={() => setSummaryOpen(false)}
            stats={{
              total: tasks.length,
              pending: tasks.filter(t => t.status === 'pending').length,
              inProgress: tasks.filter(t => t.status === 'in_progress').length,
              completed: tasks.filter(t => t.status === 'done').length,
              highPriority: tasks.filter(t => t.priority === 'high').length,
            }}
          />
        )}
      </Container>
    </>
  );
}