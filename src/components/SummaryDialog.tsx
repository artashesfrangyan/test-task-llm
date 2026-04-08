'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Typography } from '@mui/material';

interface SummaryDialogProps {
  open: boolean;
  onClose: () => void;
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    highPriority: number;
  };
}

export function SummaryDialog({ open, onClose, stats }: SummaryDialogProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (!open) return;
    
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'summary', stats }),
        });
        const data = await res.json();
        setSummary(data.summary || 'Не удалось сгенерировать сводку');
      } catch (e) {
        console.error(e);
        setSummary('Не удалось сгенерировать сводку');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [open, stats]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Сводка по задачам</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : (
          <Typography>{summary}</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}