'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Typography, Box } from '@mui/material';
import { AutoAwesome as AIIcon } from '@mui/icons-material';

interface SummaryDialogProps {
  open: boolean;
  onClose: () => void;
}

interface LLMStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  highPriority: number;
}

export function SummaryDialog({ open, onClose }: SummaryDialogProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [stats, setStats] = useState<LLMStats | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/tasks', { signal: abortRef.current?.signal });
        const tasks = await res.json();

        const s: LLMStats = {
          total: tasks.length,
          pending: tasks.filter((t: { status: string }) => t.status === 'pending').length,
          inProgress: tasks.filter((t: { status: string }) => t.status === 'in_progress').length,
          completed: tasks.filter((t: { status: string }) => t.status === 'done').length,
          highPriority: tasks.filter((t: { priority: string; status: string }) => t.priority === 'high' && t.status !== 'done').length,
        };
        setStats(s);

        const llmRes = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'summary', stats: s }),
          signal: abortRef.current?.signal,
        });
        const data = await llmRes.json();
        setSummary(data.summary || 'Не удалось сгенерировать сводку');
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        setSummary('Ошибка при генерации сводки');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();

    return () => {
      abortRef.current?.abort();
    };
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AIIcon color="secondary" />
        Сводка по задачам
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
              {summary}
            </Typography>
            {stats && (
              <Typography variant="caption" color="text.secondary">
                Всего: {stats.total} | Ожидают: {stats.pending} | В работе: {stats.inProgress} | Готово: {stats.completed}
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}